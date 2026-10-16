import { Component } from '@angular/core';
import { AuthService } from '../../account/auth.service';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { LanguageSwitcher } from '../../shared/i18n/language-switcher';

@Component({
  selector: 'app-header',
  imports: [TranslatePipe, LanguageSwitcher],
  templateUrl: './header.html',
  styleUrl: './header.scss',
})
export class Header {
  username: string = 'Thomas Anderson';

  constructor(private authService: AuthService) {
    const storedUsername = authService.getUsername();
    if (storedUsername) {
      this.username = storedUsername;
    }
  }
}
