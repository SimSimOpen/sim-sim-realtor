import { Directive, inject } from '@angular/core';
import { NgControl } from '@angular/forms';

const COUNTRY_CODE = '998';
const GROUPS = [3, 2, 3, 2, 2]; // +998 90 123 45 67

/** Matches a complete number as produced by formatPhone. */
export const PHONE_PATTERN = /^\+998 \d{2} \d{3} \d{2} \d{2}$/;

/** Formats any input into "+998 90 123 45 67", prepending the country code when it is missing. */
export function formatPhone(value: string | null | undefined): string {
  let digits = (value ?? '').replace(/\D/g, '');
  if (!digits) {
    return '';
  }
  // Leave a partially typed country code alone ("9", "99"), otherwise make sure it is there
  if (!COUNTRY_CODE.startsWith(digits) && !digits.startsWith(COUNTRY_CODE)) {
    digits = COUNTRY_CODE + digits;
  }

  const parts: string[] = [];
  let index = 0;
  for (const size of GROUPS) {
    const part = digits.slice(index, index + size);
    if (!part) {
      break;
    }
    parts.push(part);
    index += size;
  }
  return '+' + parts.join(' ');
}

@Directive({
  selector: '[phoneMask]',
  host: {
    '(input)': 'onInput()',
  },
})
export class PhoneMask {
  private ngControl = inject(NgControl, { self: true });

  onInput() {
    const control = this.ngControl.control;
    if (!control) {
      return;
    }
    const formatted = formatPhone(control.value);
    if (formatted !== control.value) {
      control.setValue(formatted);
    }
  }
}
