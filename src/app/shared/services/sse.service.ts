import { Injectable, NgZone } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { EnvironmentTs } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { AuthService } from '../../account/auth.service';

export enum ConnectionState {
  CONNECTING = 'CONNECTING',
  CONNECTED = 'CONNECTED',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
}

@Injectable({
  providedIn: 'root',
})
export class SseService {
  private eventSource?: EventSource;
  private notificationSubject = new Subject<string>();
  public notification$ = this.notificationSubject.asObservable();

  private connectionStateSubject = new BehaviorSubject<ConnectionState>(
    ConnectionState.DISCONNECTED,
  );
  public connectionState$ = this.connectionStateSubject.asObservable();

  private reconnectAttempts: number = 0;
  private readonly MAX_RECONNECT_ATTEMPTS = 10;
  private readonly INITIAL_RECONNECT_DELAY = 1000; // 1 second
  private reconnectTimeout?: number;
  private isManualDisconnect = false;

  constructor(
    private ngZone: NgZone,
    private toastr: ToastrService,
    private authService: AuthService,
  ) {}

  connect() {
    // Prevent multiple simultaneous connections
    if (
      this.eventSource?.readyState === EventSource.CONNECTING ||
      this.eventSource?.readyState === EventSource.OPEN
    ) {
      console.log('[SSE] Already connecting or connected');
      return;
    }

    this.isManualDisconnect = false;
    this.connectionStateSubject.next(ConnectionState.CONNECTING);

    const token = this.authService.getToken();
    if (!token) {
      console.error('[SSE] No auth token available');
      this.toastr.error('Authentication required', 'Error');
      this.connectionStateSubject.next(ConnectionState.ERROR);
      return;
    }

    console.log(`[SSE] Attempting connection (attempt ${this.reconnectAttempts + 1})`);
    console.log(`[SSE] URL: ${EnvironmentTs.URL}/api/event/stream`);

    try {
      this.eventSource = new EventSourcePolyfill(`${EnvironmentTs.URL}/api/event/stream`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        heartbeatTimeout: 45000,
        withCredentials: false, // Set to true if you need cookies
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('[SSE] Failed to create EventSource:', error);
      this.toastr.error('Failed to establish connection', 'Error');
      this.connectionStateSubject.next(ConnectionState.ERROR);
      this.scheduleReconnect();
    }
  }

  private setupEventListeners() {
    if (!this.eventSource) return;

    this.eventSource.onopen = (event) => {
      this.ngZone.run(() => {
        console.log('[SSE] ✓ Connection opened', event);
        this.toastr.success('[SSE] ✓ Connection opened', 'Success');
        this.reconnectAttempts = 0;
        this.connectionStateSubject.next(ConnectionState.CONNECTED);
      });
    };

    this.eventSource.addEventListener('connected', (event: any) => {
      this.ngZone.run(() => {
        console.log('[SSE] ✓ Initial connection confirmed:', event.data);
      });
    });

    this.eventSource.addEventListener('heartbeat', (event: any) => {
      console.log('[SSE] ♥ Heartbeat:', new Date().toISOString(), event.data);
    });

    this.eventSource.addEventListener('media-notification', (event: any) => {
      this.ngZone.run(() => {
        console.log('[SSE] 📩 Notification received:', event.data);
        this.notificationSubject.next(event.data);
      });
    });

    this.eventSource.onerror = (error: any) => {
      this.ngZone.run(() => {
        console.error('[SSE] ❌ Error occurred:', {
          readyState: this.eventSource?.readyState,
          error: error,
          timestamp: new Date().toISOString(),
        });

        // Check the readyState to understand what happened
        if (this.eventSource?.readyState === EventSource.CLOSED) {
          console.log('[SSE] Connection closed by server or network');
        } else if (this.eventSource?.readyState === EventSource.CONNECTING) {
          console.log('[SSE] Connection failed, trying to reconnect');
        }

        this.toastr.error('Connection to server lost.', 'Error', {
          timeOut: 5000,
        });

        this.connectionStateSubject.next(ConnectionState.ERROR);
        this.eventSource?.close();

        // Only reconnect if not manually disconnected
        if (!this.isManualDisconnect) {
          this.scheduleReconnect();
        }
      });
    };
  }

  private scheduleReconnect() {
    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    if (this.reconnectAttempts >= this.MAX_RECONNECT_ATTEMPTS) {
      console.error('[SSE] Max reconnection attempts reached');
      this.toastr.error(
        'Unable to connect after multiple attempts. Please refresh the page.',
        'Connection Failed',
        { timeOut: 0, closeButton: true },
      );
      this.connectionStateSubject.next(ConnectionState.DISCONNECTED);
      return;
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 32s (capped at 32s)
    const delay = Math.min(
      this.INITIAL_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts),
      32000,
    );

    console.log(`[SSE] Scheduling reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  disconnect() {
    console.log('[SSE] Manual disconnect');
    this.isManualDisconnect = true;

    // Clear reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }

    this.eventSource?.close();
    this.eventSource = undefined;
    this.reconnectAttempts = 0;
    this.connectionStateSubject.next(ConnectionState.DISCONNECTED);
  }

  // Call this when token is refreshed
  reconnectWithNewToken() {
    console.log('[SSE] Reconnecting with new token');
    this.disconnect();
    setTimeout(() => this.connect(), 500);
  }

  // Check connection status
  isConnected(): boolean {
    return this.eventSource?.readyState === EventSource.OPEN;
  }

  getConnectionState(): ConnectionState {
    return this.connectionStateSubject.value;
  }
}
