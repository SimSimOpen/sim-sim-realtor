import { Component, EventEmitter, inject, Output } from '@angular/core';
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
  @Output() changeAuth = new EventEmitter<string>();
  showPassword: boolean = false;

  public common = inject(Common);
  private authService = inject(AuthService);
  private fb = inject(FormBuilder);
  private toastr = inject(ToastrService);

  loginForm: FormGroup = this.buildLoginForm();

  login() {
    this.authService
      .authenticate(this.loginForm.value.username, this.loginForm.value.password)
      .subscribe({
        next: (response) => {
          this.authService.storeToken(response.token);
          this.authService.setUsername(response.username);
          this.authService.setUserData(response);
          this.common.navigateTo('/dashboard');
        },
        error: (error) => {
          this.toastr.error('Invalid username or password', 'Login Failed');
        },
      });
  }
  swithToRegister() {
    this.changeAuth.emit('register');
  }
  buildLoginForm() {
    return this.fb.group({
      username: [''],
      password: [''],
    });
  }
}
