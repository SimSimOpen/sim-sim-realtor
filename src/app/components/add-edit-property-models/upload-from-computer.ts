import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { ToastrService } from 'ngx-toastr';
import { MediaService } from '../../shared/services/media.service';
import { Property } from '../../shared/models/properties';
import { UploadedFiles } from './uploaded-files';
import { ProductApiService } from '../../shared/services/product/state/product-api.service';
import { ProductStateService } from '../../shared/services/product/state/product-state.service';
import { Common } from '../../shared/common';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { I18nService } from '../../shared/i18n/i18n.service';

@Component({
  selector: 'app-upload-from-computer',
  standalone: true,
  imports: [UploadedFiles, TranslatePipe],
  template: `<div>
    <section>
      <header class="flex items-center justify-between mb-4 w-2xl m-auto">
        <h3 class="text-sm font-bold">{{ 'upload.computerTitle' | t }}</h3>
        <span
          class="text-xs  px-3 py-2 hover:bg-gray-100 rounded cursor-pointer"
          (click)="changeMethod.emit(''); disableContinueDetails.emit()"
        >
          {{ 'upload.changeMethod' | t }}
        </span>
      </header>
      @if (!property()?.medias || property()?.medias!.length === 0) {
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
            {{ 'upload.uploadedFiles' | t: { count: 0 } }}
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
            <p class="text-base text-gray-700 mb-2 font-medium">{{ 'upload.dropHint' | t }}</p>
            <p class="text-sm text-gray-500">{{ 'upload.formats' | t }}</p>
          </div>
        </main>
      } @else {
        <section class="space-y-4">
          <div class="flex items-center justify-between">
            <p class="text-sm font-medium text-gray-700">
              {{ 'upload.uploadedFiles' | t: { count: property()?.medias?.length ?? 0 } }}
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
                {{ 'upload.addMore' | t }}
              </span>
            </label>
          </div>
          @if (property()?.medias && property()?.medias!.length > 0) {
            <app-uploaded-files (addMoreMedias)="uploadFile($event)"></app-uploaded-files>
          }
        </section>
      }
    </section>
  </div>`,
})
export class UploadFromComputer {
  private i18n = inject(I18nService);
  @Output() changeMethod = new EventEmitter<'computer' | 'mobile' | ''>();
  @Output() disableContinueDetails = new EventEmitter<void>();

  private mediaService = inject(MediaService);
  private toast = inject(ToastrService);
  private productStateService = inject(ProductStateService);
  private common = inject(Common);

  property = this.productStateService.editingProperty;

  uploadFile(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = input.files;
      const property_id = this.property()?.id as number;
      this.mediaService.uploadProductImage(property_id, Array.from(files)).subscribe({
        next: (response) => {
          this.toast.success(this.i18n.t('upload.uploaded'));
          this.productStateService.setPropertyId(response);
        },
        error: (error) => {
          this.toast.error(this.i18n.t('upload.uploadError'));
        },
      });
    }
  }

  ngOnInit() {
    this.common.listenToBackendEvents();
  }
}
