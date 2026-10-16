import { Component, inject, signal } from '@angular/core';
import { I18nService, Lang, LANGUAGES } from './i18n.service';

@Component({
  selector: 'app-language-switcher',
  host: { class: 'relative inline-block' },
  template: `
    <button
      type="button"
      class="inline-flex items-center gap-1.5 h-10 px-3 rounded-md text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors cursor-pointer"
      (click)="open.set(!open())"
      [attr.aria-expanded]="open()"
      aria-haspopup="listbox"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        class="h-4 w-4"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10"></circle>
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"></path>
        <path d="M2 12h20"></path>
      </svg>
      {{ current().short }}
    </button>
    @if (open()) {
      <div class="fixed inset-0 z-40" (click)="open.set(false)"></div>
      <ul
        role="listbox"
        class="absolute right-0 z-50 mt-1 w-40 rounded-lg border border-gray-100 bg-white py-1 shadow-lg"
      >
        @for (language of languages; track language.code) {
          <li
            role="option"
            [attr.aria-selected]="language.code === i18n.lang()"
            (click)="select(language.code)"
            class="flex cursor-pointer items-center justify-between px-3 py-2 text-sm hover:bg-gray-50"
            [class.font-semibold]="language.code === i18n.lang()"
            [class.text-blue-700]="language.code === i18n.lang()"
          >
            {{ language.label }}
            <span class="text-xs text-gray-400">{{ language.short }}</span>
          </li>
        }
      </ul>
    }
  `,
})
export class LanguageSwitcher {
  i18n = inject(I18nService);
  languages = LANGUAGES;
  open = signal(false);

  current() {
    return LANGUAGES.find((l) => l.code === this.i18n.lang())!;
  }

  select(lang: Lang) {
    this.i18n.setLang(lang);
    this.open.set(false);
  }
}
