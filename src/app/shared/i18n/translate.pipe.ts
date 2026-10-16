import { inject, Pipe, PipeTransform } from '@angular/core';
import { I18nService } from './i18n.service';
import { TranslationKey } from './translations';

/** `{{ 'header.signIn' | t }}` — impure so it re-renders when the language changes. */
@Pipe({ name: 't', pure: false })
export class TranslatePipe implements PipeTransform {
  private i18n = inject(I18nService);

  transform(key: TranslationKey | string, params?: Record<string, string | number>): string {
    return this.i18n.t(key as TranslationKey, params);
  }
}
