import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../account/auth.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  @Output() changeAuth = new EventEmitter<string>();

  registerForm: FormGroup;
  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toast: ToastrService,
  ) {
    this.registerForm = this.fb.group({
      username: [''],
      email: [''],
      password: [''],
      confirmPassword: [''],
    });
  }

  switchToLogin() {
    this.changeAuth.emit('login');
  }
  register() {
    this.authService
      .registerAgent(
        this.registerForm.value.username,
        this.registerForm.value.email,
        this.registerForm.value.password,
      )
      .subscribe({
        next: (response) => {
          this.toast.info('Registrated', 'Success');
          this.changeAuth.emit('login');
        },
        error: (error) => {
          this.toast.error('Something went wrong', 'Login Failed');
        },
      });
  }
}
