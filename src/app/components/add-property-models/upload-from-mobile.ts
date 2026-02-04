import { Component, EventEmitter, Output } from '@angular/core';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-upload-from-mobile',
  standalone: true,
  imports: [QRCodeComponent],
  template: `<div>
    <section>
      <header class="flex items-center justify-between mb-4 w-2xl">
        <h3 class="text-sm font-bold">Use Mobile Device</h3>
        <span
          class="text-xs  px-3 py-2 hover:bg-gray-100 rounded cursor-pointer"
          (click)="changeMethod.emit(''); disableContinueDetails.emit()"
        >
          Change method
        </span>
      </header>
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-8">
        <div class="text-center space-y-6">
          <div
            class="w-48 h-48 bg-white border-2 border-gray-300 rounded-lg mx-auto flex items-center justify-center"
          >
            <div class="text-center">
              <qrcode
                [qrdata]="'https://192.168.100.4:4200/mobile/camera'"
                [width]="128"
                [errorCorrectionLevel]="'M'"
              ></qrcode>
              <p class="text-xs text-gray-500">QR Code</p>
            </div>
          </div>
          <div>
            <h5 class="text-base font-semibold text-gray-900 mb-2">Scan with Mobile Device</h5>
            <p class="text-sm text-gray-600 mb-4">
              Open the your mobile device and scan this QR code to upload photos
            </p>
          </div>
          <div class="flex items-center gap-4 justify-center">
            <div class="h-px flex-1 bg-gray-300"></div>
            <span class="text-sm text-gray-500">OR</span>
            <div class="h-px flex-1 bg-gray-300"></div>
          </div>
          <div class="bg-white rounded-lg p-4 border border-gray-200">
            <p class="text-sm text-gray-600 mb-3">Send link to your mobile device:</p>
            <div class="flex gap-2">
              <div class="w-full">
                <div class="relative">
                  <input
                    id="ovyhize5n"
                    class="
            block w-full rounded-md border-gray-300 shadow-sm
            focus:border-blue-600 focus:ring-blue-600 sm:text-sm
            disabled:bg-gray-50 disabled:text-gray-500
            border px-3 py-2


            flex-1
          "
                    placeholder="Enter phone number"
                  />
                </div>
              </div>
              <button
                class="inline-flex whitespace-nowrap items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-blue-700 text-white hover:bg-blue-800 focus:ring-blue-700 shadow-sm h-10 px-4 py-2 text-sm  "
              >
                Send Link
              </button>
            </div>
          </div>
          <div class="flex items-center gap-2 text-sm text-gray-600 justify-center">
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
              class="lucide lucide-camera h-4 w-4"
              aria-hidden="true"
            >
              <path
                d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"
              ></path>
              <circle cx="12" cy="13" r="3"></circle>
            </svg>
            <span>Take photos or select from gallery</span>
          </div>
        </div>
      </div>
    </section>
  </div>`,
})
export class UploadFromMobile {
  @Output() changeMethod = new EventEmitter<'computer' | 'mobile' | ''>();
  @Output() disableContinueDetails = new EventEmitter<void>();

  @Output() propertyIdUpdate = new EventEmitter<number>();

  constructor() {}

  property_id!: number;
}
