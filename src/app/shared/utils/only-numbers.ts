import { Directive, HostListener } from '@angular/core';

@Directive({
  selector: '[onlyNumbers]',
})
export class OnlyNumbers {
  constructor() {}
  @HostListener('keypress', ['$event'])
  onKeyPress(event: KeyboardEvent) {
    return /[0-9]/.test(event.key);
  }
}
