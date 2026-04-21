import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { AuthService } from '../../account/auth.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserData } from '../../shared/models/auth';
import { UserService } from '../../shared/services/user.service';
import { ToastrService } from 'ngx-toastr';
import { MediaService } from '../../shared/services/media.service';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  profileId!: number;
  profileImageUrl = 'https://via.placeholder.com/150';

  private authService = inject(AuthService);
  private userService = inject(UserService);
  private mediaService = inject(MediaService);
  private toastr = inject(ToastrService);
  private fb = inject(FormBuilder);
  private cdr = inject(ChangeDetectorRef);

  userForm: FormGroup = this.buildForm();

  ngOnInit() {
    this.userForm.patchValue({
      username: this.authService.getUserDataFromStorage()?.username || '',
      email: this.authService.getUserDataFromStorage()?.email || '',
      phoneNumber: this.authService.getUserDataFromStorage()?.profile?.phoneNumber || '',
      fullName: this.authService.getUserDataFromStorage()?.profile?.firstName || '',
    });
    this.profileId = this.authService.getUserDataFromStorage()?.profile?.profileId || 0;
    this.profileImageUrl =
      this.authService.getUserDataFromStorage()?.profile?.profileImageUrl || this.profileImageUrl;
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
        this.profileImageUrl = response.profile.profileImageUrl;
        this.toastr.success('User data updated successfully');
      },
      error: () => {
        this.toastr.error('Error updating user data');
      },
    });
  }

  updateUserAvatar(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const files = input.files;
      const user_id = this.authService.getUserDataFromStorage()?.profile?.userId as number;
      this.mediaService.uploadUserAvatar(user_id, files[0]).subscribe({
        next: (response) => {
          this.toastr.success('Image uploaded successfully, user ID: ' + response);
          this.profileImageUrl = URL.createObjectURL(files[0]);
          this.cdr.detectChanges();
        },
        error: (error) => {
          this.toastr.error('Error uploading image');
        },
      });
    }
  }
}
