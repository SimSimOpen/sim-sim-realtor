import { Component, DestroyRef, inject, input, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, map, of, startWith, switchMap, tap } from 'rxjs';
import {
  normalizeTelegramUsername,
  TelegramAccountStatus,
  TelegramService,
} from '../../shared/services/telegram.service';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';

/**
 * The Telegram username clients reach an agent on. Warns when the name cannot receive messages (a
 * channel, group or bot, or nothing at all) but still lets it be saved: the warning is advice.
 */
@Component({
  selector: 'app-telegram-username-field',
  imports: [ReactiveFormsModule, TranslatePipe],
  template: `
    <label [for]="inputId()" class="block text-sm font-medium text-gray-700 mb-1">
      {{ 'telegram.label' | t }}
    </label>
    <input
      [id]="inputId()"
      type="text"
      [formControl]="control()"
      autocomplete="off"
      placeholder="@username"
      class="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 sm:text-sm focus:border-blue-600 focus:outline-none"
      [class.border-red-500]="control().invalid && control().touched"
    />
    @if (control().invalid && control().touched) {
      <p class="mt-1 text-xs text-red-600">{{ 'telegram.invalid' | t }}</p>
    } @else if (checking()) {
      <p class="mt-1 text-xs text-gray-500">{{ 'telegram.checking' | t }}</p>
    } @else if (status() === 'PERSONAL') {
      <p class="mt-1 text-xs text-green-700">{{ 'telegram.personal' | t }}</p>
    } @else if (status() === 'CHANNEL') {
      <p class="mt-1 text-xs text-amber-700" role="alert">{{ 'telegram.warnChannel' | t }}</p>
    } @else if (status() === 'GROUP') {
      <p class="mt-1 text-xs text-amber-700" role="alert">{{ 'telegram.warnGroup' | t }}</p>
    } @else if (status() === 'BOT') {
      <p class="mt-1 text-xs text-amber-700" role="alert">{{ 'telegram.warnBot' | t }}</p>
    } @else if (status() === 'NOT_FOUND') {
      <p class="mt-1 text-xs text-amber-700" role="alert">{{ 'telegram.warnNotFound' | t }}</p>
    } @else if (status() === 'UNKNOWN') {
      <p class="mt-1 text-xs text-amber-700" role="alert">{{ 'telegram.warnUnknown' | t }}</p>
    }
    <p class="mt-1 text-xs text-gray-500">{{ 'telegram.privacyNote' | t }}</p>
  `,
})
export class TelegramUsernameField implements OnInit {
  readonly control = input.required<FormControl<string>>();
  readonly inputId = input('telegram-username');

  readonly status = signal<TelegramAccountStatus | null>(null);
  readonly checking = signal(false);

  private telegram = inject(TelegramService);
  private destroyRef = inject(DestroyRef);

  ngOnInit() {
    const control = this.control();
    control.valueChanges
      .pipe(
        startWith(control.value),
        debounceTime(500),
        map(() => (control.valid ? normalizeTelegramUsername(control.value) : '')),
        distinctUntilChanged(),
        tap(() => this.status.set(null)),
        switchMap((username) => {
          if (!username) return of(null);
          this.checking.set(true);
          return this.telegram.check(username).pipe(
            map((check) => check.status),
            catchError(() => of<TelegramAccountStatus>('UNKNOWN')),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((status) => {
        this.checking.set(false);
        this.status.set(status);
      });
  }
}
