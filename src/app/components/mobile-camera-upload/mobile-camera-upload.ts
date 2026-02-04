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

@Component({
  selector: 'app-mobile-camera-upload',
  imports: [],
  templateUrl: './mobile-camera-upload.html',
  styleUrl: './mobile-camera-upload.scss',
})
export class MobileCameraUpload implements AfterViewInit {
  stream?: MediaStream;
  previewUrl?: string;
  previewBlob?: Blob;
  property_id!: number;
  property: any;

  @Output() propertyIdUpdate = new EventEmitter<number>();
  @ViewChild('video', { static: true }) videoRef!: ElementRef<HTMLVideoElement>;

  constructor(
    private mediaService: MediaService,
    private toast: ToastrService,
    private cdr: ChangeDetectorRef,
  ) {}

  async startCamera() {
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

    this.mediaService.uploadImage(this.property_id, [file]).subscribe({
      next: (response) => {
        this.toast.success('Image uploaded successfully, property ID: ' + response.id);
        this.property = response;
        this.propertyIdUpdate.emit(this.property.id!);
        this.discard();
        this.cdr.detectChanges();
      },
      error: (error) => {
        this.toast.error('Error uploading image');
      },
    });
  }
  ngAfterViewInit() {
    this.startCamera();
  }
}
