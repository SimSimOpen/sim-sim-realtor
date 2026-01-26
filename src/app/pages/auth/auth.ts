import { Component } from '@angular/core';
import { Login } from '../../components/login/login';

@Component({
  selector: 'app-auth',
  imports: [Login],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class Auth {}
