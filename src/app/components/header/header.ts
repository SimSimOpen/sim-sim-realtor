import { Component } from '@angular/core';
import { AuthService } from '../../account/auth.service';

@Component({
  selector: 'app-header',
  imports: [],
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
