import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-upload-from-computer',
  standalone: true,
  template: `<div>
    <section>
      <header class="flex items-center justify-between mb-4 w-2xl">
        <h3 class="text-sm font-bold">Upload From Computer</h3>
        <span
          class="text-xs  px-3 py-2 hover:bg-gray-100 rounded cursor-pointer"
          (click)="changeMethod.emit(''); disableContinueDetails.emit()"
        >
          Change method
        </span>
      </header>
      <main>
        <div
          class="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer"
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
    </section>
  </div>`,
})
export class UploadFromComputer {
  @Output() changeMethod = new EventEmitter<'computer' | 'mobile' | ''>();
  @Output() disableContinueDetails = new EventEmitter<void>();
}
