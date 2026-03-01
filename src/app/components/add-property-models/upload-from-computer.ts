import { Component, EventEmitter, Output } from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { MediaService } from '../../shared/services/media.service';
import { Property } from '../../shared/models/properties';
import { UploadedFiles } from './uploaded-files';

@Component({
  selector: 'app-upload-from-computer',
  standalone: true,
  imports: [UploadedFiles],
  template: `<div>
    <section>
      <header class="flex items-center justify-between mb-4 w-2xl m-auto">
        <h3 class="text-sm font-bold">Upload From Computer</h3>
        <span
          class="text-xs  px-3 py-2 hover:bg-gray-100 rounded cursor-pointer"
          (click)="changeMethod.emit(''); disableContinueDetails.emit()"
        >
          Change method
        </span>
      </header>
      @if (!property) {
        <main>
          <div
            class=" relative border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer"
          >
            <input
              type="file"
              accept="image/*"
              capture="environment"
              class="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              (change)="uploadFile($event)"
              multiple
            />
            Uploaded Files 4
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              class="lucide lucide-upload h-12 w-12 text-gray-400 mx-auto mb-4"
              aria-hidden="true"
            >
              <path d="M12 3v12"></path>
              <path d="m17 8-5-5-5 5"></path>
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            </svg>
            <p class="text-base text-gray-700 mb-2 font-medium">Click to upload or drag and drop</p>
            <p class="text-sm text-gray-500">PNG, JPG, GIF up to 10MB each</p>
          </div>
        </main>
      } @else {
        <section class="space-y-4">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-gray-700">
              Uploaded Files {{ property.medias.length }}
            </p>
            <label class="cursor-pointer">
              <input
                type="file"
                multiple
                (change)="uploadFile($event)"
                accept="image/*"
                class="hidden"
              />
              <span class="text-sm text-blue-600 hover:text-blue-700 font-medium">
                + Add More
              </span>
            </label>
          </div>
          <app-uploaded-files [medias]="property.medias"></app-uploaded-files>
        </section>
      }
    </section>
  </div>`,
})
export class UploadFromComputer {
  @Output() changeMethod = new EventEmitter<'computer' | 'mobile' | ''>();
  @Output() disableContinueDetails = new EventEmitter<void>();
  @Output() propertyIdUpdate = new EventEmitter<number>();

  property_id!: number;
  property!: Property;

  constructor(
    private mediaService: MediaService,
    private toast: ToastrService,
  ) {}

  uploadFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = input.files;
      this.mediaService.uploadImage(this.property_id, Array.from(files)).subscribe({
        next: (response) => {
          this.toast.success('Image uploaded successfully, property ID: ' + response.id);
          this.property = response;
          this.propertyIdUpdate.emit(this.property.id!);
        },
        error: (error) => {
          this.toast.error('Error uploading image');
        },
      });
    }
  }
}
