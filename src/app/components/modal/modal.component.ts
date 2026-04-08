import { CommonModule } from '@angular/common';
import { Component, EventEmitter, HostListener, inject, Input, Output } from '@angular/core';
import { GlobalService } from '../../shared/services/global.service';
import { ProductStateService } from '../../shared/services/product/state/product-state.service';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
  host: {
    '(document:keydown.escape)': 'handleEscape($event)',
  },
})
export class ModalComponent {
  @Input() isVisible: boolean = false;
  @Output() close = new EventEmitter<void>();
  @Input() closeOnBackdropClick = true;
  @Input() showCloseButton = true;

  private global = inject(GlobalService);
  private productStateService = inject(ProductStateService);

  openModal() {
    this.isVisible = true;
  }

  closeModal() {
    this.isVisible = false;
    this.close.emit();
    this.global.mobilesessionStarted.set(false); // Reset mobile session state when modal closes
    this.productStateService.clearEditing(); // Clear editing state when modal closes
  }

  onBackdropClick(event: MouseEvent) {
    if (this.closeOnBackdropClick && event.target === event.currentTarget) {
      this.closeModal();
    }
    this.global.mobilesessionStarted.set(false); // Reset mobile session state when modal closes
    this.productStateService.clearEditing(); // Clear editing state when modal closes
  }
  // ✅ Close modal on Escape key
  handleEscape(event: Event) {
    if (this.isVisible && event instanceof KeyboardEvent && !this.global.ProductImageOpened) {
      this.closeModal();
    }
    this.global.mobilesessionStarted.set(false); // Reset mobile session state when modal closes
    this.productStateService.clearEditing(); // Clear editing state when modal closes
  }
}
