import { Component, Input } from '@angular/core';
import { Property } from '../../shared/models/properties';
import { amenitiesList } from '../../shared/common-functions';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';

@Component({
  selector: 'app-about-property',
  imports: [TranslatePipe],
  standalone: true,
  template: ` <div>
    <div class="bg-white rounded-lg border border-gray-200 shadow-sm">
      <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
        <div data-id="element-91">
          <h3 class="text-lg font-medium text-gray-900">{{ 'property.about' | t }}</h3>
        </div>
      </div>
      <div class="p-6">
        @if (propertyAddress) {
          <p class="text-gray-600 leading-relaxed mb-2">{{ propertyAddress }}</p>
        }
        @if (property?.description) {
          <!-- Descriptions are authored with the rich text editor, so they arrive as HTML.
               Angular sanitizes the binding; .rich-text restores list/quote/code styles. -->
          <div
            class="text-gray-600 leading-relaxed rich-text"
            [innerHTML]="property?.description"
          ></div>
        }
      </div>
    </div>
    <div class="bg-white rounded-lg border border-gray-200 shadow-sm " data-id="element-89">
      <div
        class="px-6 py-4 border-b border-gray-100 flex items-center justify-between"
        data-id="element-90"
      >
        <div data-id="element-91">
          <h3 class="text-lg font-medium text-gray-900" data-id="element-92">
            {{ 'property.amenities' | t }}
          </h3>
        </div>
      </div>
      <div class="p-6" data-id="element-95">
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4" data-id="element-323">
          @for (amenity of activeAmenities; track $index) {
            <div class="flex items-center gap-3 text-gray-700" data-id="element-324">
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
                class="lucide lucide-circle-check h-5 w-5 text-green-500 flex-shrink-0"
                aria-hidden="true"
                data-id="element-325"
              >
                <circle cx="12" cy="12" r="10"></circle>
                <path d="m9 12 2 2 4-4"></path>
              </svg>
              <span data-id="element-326">{{ amenity.label | t }}</span>
            </div>
          }
        </div>
      </div>
    </div>
  </div>`,
})
export class AboutProperty {
  @Input() property: Property | null = null;
  amenities = amenitiesList;

  get activeAmenities() {
    const amenities = this.property?.amenities;
    if (!amenities) return [];
    return amenitiesList.filter((item) => amenities[item.key] === true);
  }
  get propertyAddress() {
    if (!this.property) return '';
    const { address } = this.property;
    return address || '';
  }
}
