import { Component } from '@angular/core';
import { flatMap } from 'rxjs';

@Component({
  selector: 'app-auth',
  imports: [],
  templateUrl: './auth.html',
  styleUrl: './auth.scss',
})
export class Auth {
  showPassword: boolean = false;
}
