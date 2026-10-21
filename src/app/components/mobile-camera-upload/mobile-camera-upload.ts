import {
  ChangeDetectorRef,
  Component,
  computed,
  ElementRef,
  HostListener,
  inject,
  ViewChild,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { MediaService } from '../../shared/services/media.service';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpParams } from '@angular/common/http';
import { MEDIA_SERVICE_URL, PRODUCT_URL } from '../../shared/constants/urls';
import { Property, PropertyMedia } from '../../shared/models/properties';
import { AuthService } from '../../account/auth.service';
import { UploadedFilesMobile } from '../add-edit-property-models/uploaded-files-mobile';
import { ProductStateService } from '../../shared/services/product/state/product-state.service';
import { Common } from '../../shared/common';
import { SseService } from '../../shared/services/sse.service';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { I18nService } from '../../shared/i18n/i18n.service';
import {
  LISTING_ROUTES,
  ListingKindService,
} from '../../shared/services/product/listing-kind.service';

@Component({
  selector: 'app-mobile-camera-upload',
  imports: [UploadedFilesMobile, TranslatePipe],
  templateUrl: './mobile-camera-upload.html',
  styleUrl: './mobile-camera-upload.scss',
})
export class MobileCameraUpload {
  private i18n = inject(I18nService);
  stream?: MediaStream;
  previewUrl?: string;
  previewBlob?: Blob;
  property_id!: number;
  sessionId!: string;
  sessionStatus: 'Active' | 'Expired' | 'Completed' | 'Loading' = 'Loading';
  token!: string;
  facingMode: 'environment' | 'user' = 'environment';

  @ViewChild('video', { static: false }) videoRef!: ElementRef<HTMLVideoElement>;

  private mediaService = inject(MediaService);
  private productStateService = inject(ProductStateService);
  private common = inject(Common);
  private toast = inject(ToastrService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private router = inject(Router);
  private sseService = inject(SseService);
  private listingKind = inject(ListingKindService);

  medias = computed(() => this.productStateService.editingProperty()?.medias ?? []);
  property = this.productStateService.editingProperty();

  async switchCamera() {
    this.stopCamera();
    this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
    await this.startCamera();
  }

  async startCamera() {
    if (!this.videoRef?.nativeElement) {
      console.warn('Video element not available');
      return;
    }
    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: this.facingMode } },
        audio: false,
      });

      const video = this.videoRef.nativeElement;
      video.srcObject = this.stream;
      await video.play();
      this.cdr.detectChanges();
    } catch (error) {
      console.error('Error accessing camera:', error);
      this.toast.error(this.i18n.t('camera.noAccess'));
    }
  }

  takePhoto() {
    const video = this.videoRef.nativeElement;
    console.log('clicked take photo');

    if (!this.stream || !video.videoWidth || !video.videoHeight) {
      this.toast.error(this.i18n.t('camera.notReady'));
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
      this.toast.error(this.i18n.t('camera.noPhoto'));
      return;
    }

    const file = new File([this.previewBlob], `photo-${Date.now()}.jpg`, {
      type: 'image/jpeg',
    });
    const formData = new FormData();
    formData.append('files', file);

    const routes = this.listingKind.routes();
    const params = new HttpParams().append(routes.idParam, this.property_id?.toString() || '');

    this.http
      .post<number>(`${MEDIA_SERVICE_URL}/v1/${routes.upload}`, formData, {
        params,
        headers: { Authorization: `Bearer ${this.token}` },
      })
      .subscribe({
        next: (response) => {
          this.toast.success(this.i18n.t('upload.uploaded'));
          this.discard();
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toast.error(error.message || error, this.i18n.t('upload.uploadError'), { timeOut: 15000 });
        },
      });
  }

  stopCamera() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.stream = undefined;
  }

  ngOnInit() {
    this.sessionStatus = 'Loading';
    this.checkSessionValid();
    this.getPropertyIfExists();
  }
  uploadFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = Array.from(input.files);
      let property_id = this.property_id ? this.property_id : (this.property?.id as number);
      const formData: FormData = new FormData();
      files.forEach((file) => {
        formData.append('files', file);
      });
      const routes = this.listingKind.routes();
      const params = new HttpParams().append(routes.idParam, property_id?.toString() || '');

      this.http
        .post<number>(`${MEDIA_SERVICE_URL}/v1/${routes.upload}`, formData, {
          params,
          headers: { Authorization: `Bearer ${this.token}` },
        })
        .subscribe({
          next: (response) => {
            this.toast.success(this.i18n.t('upload.uploaded'));
          },
          error: (error) => {
            this.toast.error(this.i18n.t('upload.uploadError'));
            this.toast.error(error.message || error, '', { timeOut: 15000 });
          },
        });
    }
  }
  getPropertyIfExists() {
    if (!this.property_id) return;
    this.http
      .get<Property>(`${PRODUCT_URL}/v1/${this.listingKind.routes().product}/${this.property_id}`, {
        headers: { Authorization: `Bearer ${this.token}` },
      })
      .subscribe({
        next: (property) => {
          this.productStateService.startEditing(property);
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error fetching property:', err);
        },
      });
  }
  checkSessionValid() {
    this.route.queryParams.subscribe((params) => {
      this.sessionId = params['session_id'];
      this.property_id = +params['property_id'];
      // The QR link names the listing kind; anything unknown falls back to real estate.
      this.listingKind.kind.set(params['kind'] in LISTING_ROUTES ? params['kind'] : 'property');
      this.token = params['token'];
      this.productStateService.updateEditing({ ...this.property, id: this.property_id });
      this.mediaService.checkSessionStatus(this.sessionId, this.token).subscribe({
        next: () => {
          this.sessionStatus = 'Active';
          this.cdr.detectChanges();
          // Start camera AFTER session confirmed & view is Active
          setTimeout(() => this.startCamera(), 0);
          setTimeout(() => {
            this.sseService.connectWithCustomToken(this.token);
            this.common.listenToBackendEvents(() => {
              this.getPropertyIfExists();
            });
          }, 0);
        },
        error: (error) => {
          console.error('Session check failed:', error);
          this.sessionStatus = 'Expired';
          this.cdr.detectChanges();
        },
      });
    });
  }
  closeTab() {
    this.stream?.getTracks().forEach((track) => track.stop());
    this.router.navigate(['/mobile/done']);
  }
  @HostListener('window:beforeunload')
  onBeforeUnload() {
    this.authService.clearStorage();
  }
  ngOnDestroy() {
    this.authService.clearStorage();
  }
}
