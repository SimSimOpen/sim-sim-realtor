import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Output,
  ViewChild,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { MediaService } from '../../shared/services/media.service';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MEDIA_SERVICE_URL } from '../../shared/constants/urls';
import { Property } from '../../shared/models/properties';

@Component({
  selector: 'app-mobile-camera-upload',
  imports: [],
  templateUrl: './mobile-camera-upload.html',
  styleUrl: './mobile-camera-upload.scss',
})
export class MobileCameraUpload {
  stream?: MediaStream;
  previewUrl?: string;
  previewBlob?: Blob;
  property_id!: number;
  property: any;
  sessionId!: string;
  sessionStatus: 'Active' | 'Expired' | 'Completed' | 'Loading' = 'Loading';
  token!: string;

  @Output() propertyIdUpdate = new EventEmitter<number>();
  @ViewChild('video', { static: false }) videoRef!: ElementRef<HTMLVideoElement>;

  constructor(
    private mediaService: MediaService,
    private toast: ToastrService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private http: HttpClient,
  ) {}

  async startCamera() {
    if (!this.videoRef?.nativeElement) {
      console.warn('Video element not available');
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });

      const video = this.videoRef.nativeElement;
      video.srcObject = this.stream;
      await video.play();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.toast.error('Could not access camera');
    }
  }

  takePhoto() {
    const video = this.videoRef.nativeElement;
    console.log('clicked take photo');

    if (!this.stream || !video.videoWidth || !video.videoHeight) {
      this.toast.error('Camera not ready yet');
      return;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(
      (blob) => {
        if (!blob) {
          console.log('no blob');

          return;
        }
        this.previewBlob = blob;
        this.previewUrl = URL.createObjectURL(blob);
        console.log('Preview Blob ', this.previewBlob);
        console.log('Preview url', this.previewUrl);
        this.cdr.detectChanges();
      },
      'image/jpeg',
      0.9,
    );
  }

  discard() {
    console.log('discarded');

    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = undefined;
    this.previewBlob = undefined;
  }

  uploadCapturedPhoto(): void {
    if (!this.previewBlob) {
      this.toast.error('No photo to upload');
      return;
    }

    const file = new File([this.previewBlob], `photo-${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });
    const formData = new FormData();
    formData.append('files', file);

    const params = new HttpParams().append('property_id', this.property_id?.toString() || '');

    this.http
      .post<Property>(`${MEDIA_SERVICE_URL}/v1/upload`, formData, {
        params,
        headers: { Authorization: `Bearer ${this.token}` },
      })
      .subscribe({
        next: (response) => {
          this.toast.success('Image uploaded successfully, property ID: ' + response.id);
          this.property = response;
          this.propertyIdUpdate.emit(this.property.id!);
          this.discard();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toast.error('Error uploading image', error.message || error, { timeOut: 15000 });
        },
      });
  }

  stopCamera() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
  }

  ngOnInit() {
    this.sessionStatus = 'Loading';

    this.route.queryParams.subscribe((params) => {
      this.sessionId = params['session_id'];
      this.property_id = +params['property_id'];
      this.token = params['token'];

      console.log('Params loaded:', this.sessionId, this.property_id); // debug

      this.mediaService.checkSessionStatus(this.sessionId, this.token).subscribe({
        next: () => {
          this.sessionStatus = 'Active';
          this.cdr.detectChanges();
          // Start camera AFTER session confirmed & view is Active
          setTimeout(() => this.startCamera(), 0);
        },
        error: (error) => {
          console.error('Session check failed:', error);
          this.sessionStatus = 'Expired';
          this.cdr.detectChanges();
        },
      });
    });
  }
}
