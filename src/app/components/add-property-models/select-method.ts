import { Component, EventEmitter, Output } from '@angular/core';

@Component({
  selector: 'app-select-method',
  standalone: true,
  template: `<div class="flex justify-center gap-3 w-full max-w-2xl">
    <div
      class="select-computer flex justify-center flex-col items-center gap-2 border-2 border-gray-300 rounded-lg p-6 w-full cursor-pointer hover:border-blue-500 transition-colors hover:shadow-md"
      (click)="changeMethod.emit('computer')"
    >
      <div
        class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors"
        data-id="element-31"
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
          class="lucide lucide-upload h-8 w-8 text-blue-600"
          aria-hidden="true"
          data-id="element-32"
        >
          <path d="M12 3v12"></path>
          <path d="m17 8-5-5-5 5"></path>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        </svg>
      </div>
      <h3>Upload from Computer</h3>
      <span class="text-sm text-gray-600 text-center"
        >Select photos from your computer's file system</span
      >
    </div>
    <div
      class="select-mobile flex justify-center flex-col items-center gap-2 border-2 border-gray-300 rounded-lg p-6 w-full cursor-pointer hover:border-blue-500 transition-colors hover:shadow-md"
      (click)="changeMethod.emit('mobile')"
    >
      <div
        class="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors"
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
          class="lucide lucide-smartphone h-8 w-8 text-blue-600"
          aria-hidden="true"
        >
          <rect width="14" height="20" x="5" y="2" rx="2" ry="2"></rect>
          <path d="M12 18h.01"></path>
        </svg>
      </div>
      <h3>Use Mobile App</h3>
      <span class="text-sm text-gray-600 text-center"
        >Take photos with your phone or select from gallery</span
      >
    </div>
  </div>`,
})
export class SelectMethod {
  @Output() changeMethod = new EventEmitter<'computer' | 'mobile' | ''>();
}
