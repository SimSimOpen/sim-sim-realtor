import { Component, Input } from '@angular/core';
import { Property } from '../../shared/models/properties';

@Component({
  selector: 'app-about-agent',
  standalone: true,
  template: ` <div class="space-y-6">
    <div class="bg-white rounded-lg border border-gray-200 shadow-sm sticky top-24">
      <div class="p-6">
        <div class="space-y-6" data-id="element-329">
          <div data-id="element-330">
            <div class="text-2xl font-bold text-gray-900">$ {{ property?.price }}</div>
            <div class="text-sm text-gray-500">per month + utilities</div>
          </div>
          <div class="space-y-3" data-id="element-333">
            <button
              class="flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none bg-blue-700 text-white hover:bg-blue-800 focus:ring-blue-700 shadow-sm h-10 px-4 py-2 text-sm w-full flex justify-center items-center gap-2"
            >
              Apply Now
            </button>
            <button
              class="flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700 h-10 px-4 py-2 text-sm w-full flex justify-center items-center gap-2"
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
                class="lucide lucide-calendar h-4 w-4"
                aria-hidden="true"
                data-id="element-336"
              >
                <path d="M8 2v4"></path>
                <path d="M16 2v4"></path>
                <rect width="18" height="18" x="3" y="4" rx="2"></rect>
                <path d="M3 10h18"></path>
              </svg>
              Schedule a Tour
            </button>
          </div>
          <div class="pt-4 border-t border-gray-100" data-id="element-337">
            <div class="flex items-center gap-2 text-sm text-gray-600 mb-4">
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
                class="lucide lucide-shield-check h-4 w-4 text-green-500"
                aria-hidden="true"
              >
                <path
                  d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
                ></path>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
              <span>Verified Listing</span>
            </div>
            <div class="flex items-center gap-4">
              <img
                src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&amp;auto=format&amp;fit=crop&amp;w=800&amp;q=80"
                alt="Sarah Jenkins"
                class="h-12 w-12 rounded-full object-cover border border-gray-200"
              />
              <div>
                <div class="font-medium text-gray-900">{{ property?.agent }}</div>
                <div class="text-xs text-gray-500">Senior Leasing Agent</div>
              </div>
            </div>
            <div class="mt-4 grid grid-cols-2 gap-2">
              <button
                class="flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700 h-8 px-3 text-xs gap-2"
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
                  class="lucide lucide-phone h-3.5 w-3.5"
                  aria-hidden="true"
                >
                  <path
                    d="M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384"
                  ></path>
                </svg>
                Call
              </button>
              <button
                class="flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none border border-gray-300 bg-transparent hover:bg-gray-50 text-gray-700 h-8 px-3 text-xs gap-2"
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
                  class="lucide lucide-mail h-3.5 w-3.5"
                  aria-hidden="true"
                >
                  <path d="m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7"></path>
                  <rect x="2" y="4" width="20" height="16" rx="2"></rect>
                </svg>
                Telegram
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>`,
})
export class AboutAgent {
  @Input() property: Property | null = null;
}
