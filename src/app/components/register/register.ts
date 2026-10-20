import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Output } from '@angular/core';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { I18nService } from '../../shared/i18n/i18n.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../account/auth.service';
import { ToastrService } from 'ngx-toastr';
import { BrandMark } from '../brand-mark';

@Component({
  selector: 'app-register',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe, BrandMark],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  @Output() changeAuth = new EventEmitter<string>();

  registerForm: FormGroup;
  private i18n = inject(I18nService);
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
          this.toast.info(this.i18n.t('auth.registered'), this.i18n.t('common.success'));
          this.changeAuth.emit('login');
        },
        error: (error) => {
          this.toast.error(this.i18n.t('common.genericError'), this.i18n.t('auth.registerFailed'));
        },
      });
  }
}
