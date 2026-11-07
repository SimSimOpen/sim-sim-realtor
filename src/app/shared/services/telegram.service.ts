import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AbstractControl, ValidationErrors } from '@angular/forms';
import { Observable } from 'rxjs';
import { AUTH_URL } from '../constants/urls';

export type TelegramAccountStatus =
  | 'PERSONAL'
  | 'CHANNEL'
  | 'GROUP'
  | 'BOT'
  | 'NOT_FOUND'
  | 'UNKNOWN';

export interface TelegramCheck {
  username: string;
  status: TelegramAccountStatus;
}

/** Accepts "name", "@name" or a t.me link, the same forms the backend normalizes. */
export function normalizeTelegramUsername(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .replace(/^(https?:\/\/)?(www\.)?(t\.me|telegram\.me)\//i, '')
    .replace(/^@/, '')
    .replace(/\/$/, '');
}

export function telegramUsernameValidator(control: AbstractControl): ValidationErrors | null {
  const username = normalizeTelegramUsername(control.value);
  const valid = !username || /^[A-Za-z](?!.*__)[A-Za-z0-9_]{2,30}[A-Za-z0-9]$/.test(username);
  return valid ? null : { telegramUsername: true };
}

@Injectable({ providedIn: 'root' })
export class TelegramService {
  private http = inject(HttpClient);

  check(username: string): Observable<TelegramCheck> {
    return this.http.get<TelegramCheck>(`${AUTH_URL}/v1/telegram/check`, { params: { username } });
  }
}
