import { Component, input, output } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';

/**
 * Confirmation step shown before a listing is deleted. The parent owns the request: it opens
 * the dialog by setting `visible`, runs the delete on `confirm` and keeps `busy` true meanwhile.
 */
@Component({
  selector: 'app-confirm-delete',
  imports: [ModalComponent, TranslatePipe],
  template: `
    <app-modal [isVisible]="visible()" (close)="cancel.emit()" [showCloseButton]="false">
      @if (visible()) {
        <div class="p-8">
          <h2 class="text-xl font-bold text-gray-900">{{ 'confirmDelete.title' | t }}</h2>
          <p class="mt-2 text-sm text-gray-600">
            @if (name()) {
              <span class="font-semibold text-gray-900">{{ name() }}</span> —
            }
            {{ message() | t }} {{ 'confirmDelete.irreversible' | t }}
          </p>
          <div class="flex justify-end gap-2 pt-6">
            <button
              type="button"
              (click)="cancel.emit()"
              [disabled]="busy()"
              class="rounded-md border border-gray-300 bg-white px-5 py-2 font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              {{ 'common.cancel' | t }}
            </button>
            <button
              type="button"
              (click)="confirm.emit()"
              [disabled]="busy()"
              class="rounded-md bg-red-600 px-5 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {{ (busy() ? 'confirmDelete.deleting' : 'confirmDelete.delete') | t }}
            </button>
          </div>
        </div>
      }
    </app-modal>
  `,
})
export class ConfirmDelete {
  visible = input(false);
  /** Listing title shown in bold so the user sees exactly what goes away. */
  name = input<string | null | undefined>('');
  /** Translation key of the question, e.g. `cars.confirmDelete`. */
  message = input('confirmDelete.body');
  busy = input(false);

  confirm = output<void>();
  cancel = output<void>();
}
