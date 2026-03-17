import { Directive, HostListener, ElementRef } from '@angular/core';

@Directive({
  selector: '[areaFormat]',
  standalone: true,
})
export class AreaFormatDirective {
  private readonly suffix = ' m²';

  constructor(private el: ElementRef<HTMLInputElement>) {}

  @HostListener('input', ['$event'])
  onInput(event: any): void {
    const input = this.el.nativeElement;

    // Remove suffix before processing
    let value = input.value.replace(this.suffix, '');

    // Keep only digits
    value = value.replace(/\D/g, '');

    if (!value) {
      input.value = '';
      return;
    }

    const formatted = this.formatWithSpaces(value) + this.suffix;

    input.value = formatted;

    // Move cursor before suffix
    this.setCaretBeforeSuffix();
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const input = this.el.nativeElement;

    // Prevent deleting suffix
    if (
      event.key === 'Backspace' &&
      input.selectionStart! > input.value.length - this.suffix.length
    ) {
      event.preventDefault();
    }
  }

  @HostListener('blur')
  onBlur(): void {
    const input = this.el.nativeElement;
    let value = input.value.replace(this.suffix, '').replace(/\D/g, '');

    if (value) {
      input.value = this.formatWithSpaces(value) + this.suffix;
    }
  }

  private formatWithSpaces(value: string): string {
    return value.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  }

  private setCaretBeforeSuffix() {
    const input = this.el.nativeElement;
    const position = input.value.length - this.suffix.length;
    input.setSelectionRange(position, position);
  }
}
