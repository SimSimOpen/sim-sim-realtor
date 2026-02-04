import { Component } from '@angular/core';
import { navigeteTo } from '../../shared/common-functions';
import { Common } from '../../shared/common';
import { AuthService } from '../../account/auth.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss',
})
export class Login {
  showPassword: boolean = false;

  loginForm: FormGroup;

  constructor(
    public common: Common,
    private authService: AuthService,
    private fb: FormBuilder,
    private toastr: ToastrService,
  ) {
    this.loginForm = this.fb.group({
      username: [''],
      password: [''],
    });
  }
  login() {
    this.authService
      .authenticate(this.loginForm.value.username, this.loginForm.value.password)
      .subscribe({
        next: (response) => {
          this.authService.storeToken(response.token);
          this.authService.setUsername(response.username);
          this.common.navigateTo('/dashboard');
        },
        error: (error) => {
          this.toastr.error('Invalid username or password', 'Login Failed');
        },
      });
  }
}
