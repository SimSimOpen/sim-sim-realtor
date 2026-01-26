import { Component } from '@angular/core';
import { navigeteTo } from '../../shared/common-functions';
import { Common } from '../../shared/common';

@Component({
  selector: 'app-login',
  imports: [],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  showPassword: boolean = false;
  constructor(public common: Common) {}
}
