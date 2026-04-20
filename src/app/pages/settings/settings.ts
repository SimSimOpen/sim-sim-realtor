import { Component, inject } from '@angular/core';
import { AuthService } from '../../account/auth.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserData } from '../../shared/models/auth';
import { UserService } from '../../shared/services/user.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  profileId!: number;

  private authService = inject(AuthService);
  private userService = inject(UserService);
  private toastr = inject(ToastrService);
  private fb = inject(FormBuilder);

  userForm: FormGroup = this.buildForm();

  ngOnInit() {
    this.userForm.patchValue({
      username: this.authService.getUserDataFromStorage()?.username || '',
      email: this.authService.getUserDataFromStorage()?.email || '',
      phoneNumber: this.authService.getUserDataFromStorage()?.profile?.phoneNumber || '',
      fullName: this.authService.getUserDataFromStorage()?.profile?.firstName || '',
    });
    this.profileId = this.authService.getUserDataFromStorage()?.profile?.profileId || 0;
  }
  private buildForm(): FormGroup {
    return this.fb.group({
      username: [''],
      email: [''],
      phoneNumber: [''],
      fullName: [''],
    });
  }

  updateUserData() {
    const updatedData: Omit<UserData, 'description'> = {
      username: this.userForm.value.username,
      email: this.userForm.value.email,
      phoneNumber: this.userForm.value.phoneNumber,
      fullName: this.userForm.value.fullName,
    };
    this.userService.updateUserData(updatedData).subscribe({
      next: (response) => {
        this.authService.setUserData(response);
        this.toastr.success('User data updated successfully');
      },
      error: () => {
        this.toastr.error('Error updating user data');
      },
    });
  }
}
