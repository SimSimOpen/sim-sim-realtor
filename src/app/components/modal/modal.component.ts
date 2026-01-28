import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  HostListener,
  Input,
  Output,
} from '@angular/core';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
})
export class ModalComponent {
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Input() closeOnBackdropClick = true;
  @Input() showCloseButton = true;

  openModal() {
    this.isVisible = true;
  }

  closeModal() {
    this.isVisible = false;
    this.close.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if (this.closeOnBackdropClick && event.target === event.currentTarget) {
      this.closeModal();
    }
  }
}
