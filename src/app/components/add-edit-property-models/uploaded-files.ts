import { Component, computed, EventEmitter, inject, Output } from '@angular/core';
import { ProductApiService } from '../../shared/services/product/state/product-api.service';
import { ToastrService } from 'ngx-toastr';
import { ProductStateService } from '../../shared/services/product/state/product-state.service';

@Component({
  selector: 'app-uploaded-files',
  template: `<div>
    <div
      class="relative max-w-167 group aspect-video rounded-xl overflow-hidden border-2 border-blue-200 bg-gray-100"
    >
      <img [src]="medias()[0]?.mediaUrl" alt="Cover photo" class="w-full h-full object-cover" />
      <div class="absolute inset-0 bg-linear-to-t from-black/50 to-transparent"></div>
      <div class="absolute bottom-3 left-3">
        <span class="px-2 py-1 bg-blue-600 text-white text-xs font-medium rounded"
          >Cover Photo</span
        >
      </div>
      <button
        class="absolute top-3 right-3 p-2 bg-red-500 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
        (click)="deleteImage(medias()[0].id)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="Uploaded Files 42"
          stroke-linecap="round"
          stroke-linejoin="round"
          class="lucide lucide-x h-4 w-4"
          aria-hidden="true"
        >
          <path d="M18 6 6 18"></path>
          <path d="m6 6 12 12"></path>
        </svg>
      </button>
    </div>
    <div class="grid grid-cols-4 gap-3 mt-4">
      @for (media of medias().slice(1); track $index) {
        <div
          class="relative group max-w-40 aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100"
        >
          <img [src]="media.mediaUrl" alt="Photo 2" class="w-full h-full object-cover" />
          <div class="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors"></div>
          <button
            class="absolute top-1.5 right-1.5 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
            (click)="deleteImage(media.id)"
          >
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
              class="lucide lucide-x h-3 w-3"
              aria-hidden="true"
            >
              <path d="M18 6 6 18"></path>
              <path d="m6 6 12 12"></path>
            </svg>
          </button>
          <div
            class="absolute bottom-1.5 left-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <span class="px-1.5 py-0.5 bg-black/60 text-white text-xs rounded" data-id="element-70">
              {{ $index + 1 }}</span
            >
          </div>
        </div>
      }
      @if (hasAddMoreMediasListener) {
        <label
          class="aspect-square w-40 h-40 rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
        >
          <input
            type="file"
            multiple
            accept="image/*"
            class="hidden"
            data-id="element-72"
            (change)="addMoreMedias.emit($event)"
            #fileInput
          /><svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="lucide lucide-upload h-5 w-5 text-gray-400 mb-1"
            aria-hidden="true"
          >
            <path d="M12 3v12"></path>
            <path d="m17 8-5-5-5 5"></path>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          </svg>
          <span class="text-xs text-gray-500">Add</span>
        </label>
      }
    </div>
  </div>`,
})
export class UploadedFiles {
  @Output() addMoreMedias = new EventEmitter<Event>();

  private productApiService = inject(ProductApiService);
  private toast = inject(ToastrService);
  private productStateService = inject(ProductStateService);

  medias = computed(() => this.productStateService.editingProperty()?.medias ?? []);

  deleteImage(image_id: number) {
    this.productApiService.deleteImage(image_id).subscribe({
      next: (res) => {
        this.productStateService.updateEditing({
          medias: this.medias().filter((media) => media.id !== image_id),
        });
        this.toast.info(res);
      },
      error: (error) => {
        console.error('Error deleting image:', error);
        this.toast.error('Failed to delete image');
      },
    });
  }
  addMore() {
    this.addMoreMedias.emit();
  }

  get hasAddMoreMediasListener(): boolean {
    return this.addMoreMedias.observed;
  }
}
