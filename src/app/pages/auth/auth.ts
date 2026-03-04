import { Component } from '@angular/core';
import { Login } from '../../components/login/login';
import { Register } from '../../components/register/register';

@Component({
  selector: 'app-auth',
  imports: [Login, Register],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class Auth {
  auth: 'login' | 'register' = 'login';

  changeAuth(auth: string) {
    this.auth = auth as 'login' | 'register';
  }
}
