import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { AuthService } from '../../account/auth.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserData, UserDetailsResponse, UserProfile } from '../../shared/models/auth';
import { UserService } from '../../shared/services/user.service';
import { ToastrService } from 'ngx-toastr';
import { MediaService } from '../../shared/services/media.service';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { I18nService } from '../../shared/i18n/i18n.service';

/** The avatar upload is async server-side; poll the profile this many times, once a second. */
const AVATAR_POLL_ATTEMPTS = 9;
const AVATAR_POLL_MS = 1000;

@Component({
  selector: 'app-settings',
  imports: [CommonModule, ReactiveFormsModule, TranslatePipe],
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings {
  /** The public 6-digit profile code shown in the header chip. */
  profileId!: number;
  /**
   * The profile row id, which is what GET /api/profile/v1/{id} looks up. It is not the same number
   * as the displayed profile code, and sending the code returns "profile not found".
   */
  private profilePk = 0;
  profileImageUrl = 'https://via.placeholder.com/150';
  avatarUploading = false;
  /** The blob: preview currently on screen, kept so it can be revoked when replaced. */
  private previewUrl: string | null = null;

  private authService = inject(AuthService);
  private userService = inject(UserService);
  private mediaService = inject(MediaService);
  private toastr = inject(ToastrService);
  private i18n = inject(I18nService);
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
    this.profilePk = this.authService.getUserDataFromStorage()?.profile?.id || 0;
    this.profileImageUrl =
      this.authService.getUserDataFromStorage()?.profile?.profileImageUrl || this.profileImageUrl;
    // The stored copy can predate the current avatar, so the profile is re-read on every open.
    this.loadProfile();
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
        // The auth response carries no profile, so the stored one is kept and then re-read.
        this.storeAccountDetails(response);
        this.loadProfile();
        this.toastr.success(this.i18n.t('settings.saved'));
      },
      error: () => {
        this.toastr.error(this.i18n.t('settings.saveError'));
      },
    });
  }

  /** Merges the account fields into the stored user data, leaving profile and authorities intact. */
  private storeAccountDetails(response: UserDetailsResponse) {
    const stored = this.authService.getUserDataFromStorage();
    if (!stored) return;
    this.authService.setUserData({
      ...stored,
      id: response.id,
      username: response.username,
      email: response.email,
    });
  }

  /** The profile module is the only endpoint that returns the absolute minio avatar URL. */
  private loadProfile() {
    if (!this.profilePk) return;
    this.userService.getProfile(this.profilePk).subscribe({
      next: (profile) => {
        if (!profile) return;
        this.storeProfile(profile);
        if (profile.profileImageUrl) this.setPreview(profile.profileImageUrl);
        this.userForm.patchValue({
          phoneNumber: profile.phoneNumber || '',
          fullName: profile.firstName || '',
        });
      },
      error: () => {
        // The stored copy stays on screen; nothing to correct.
      },
    });
  }

  private storeProfile(profile: UserProfile) {
    const stored = this.authService.getUserDataFromStorage();
    if (!stored) return;
    this.authService.setUserData({ ...stored, profile });
  }

  updateUserAvatar(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    // Clear now so picking the very same file again still fires `change`.
    input.value = '';
    if (!file) return;
    const userId = this.authService.getUserDataFromStorage()?.profile?.userId as number;
    if (userId == null) {
      this.toastr.error(this.i18n.t('settings.imageError'));
      return;
    }
    const previous = this.profileImageUrl;
    this.avatarUploading = true;
    this.setPreview(URL.createObjectURL(file));
    this.mediaService.uploadUserAvatar(userId, file).subscribe({
      next: () => this.refreshAvatarFromServer(previous),
      error: () => {
        this.avatarUploading = false;
        this.setPreview(previous);
        this.toastr.error(this.i18n.t('settings.imageError'));
      },
    });
  }

  private setPreview(url: string) {
    if (this.previewUrl) URL.revokeObjectURL(this.previewUrl);
    this.previewUrl = url.startsWith('blob:') ? url : null;
    this.profileImageUrl = url;
    this.cdr.detectChanges();
  }

  /**
   * The upload endpoint only queues the file: the minio upload and the profile update happen
   * asynchronously server-side and the response carries no URL. The auth endpoints do not return
   * the profile at all, so the final absolute avatar URL has to be polled from the profile module,
   * and the stored user data refreshed with it — otherwise the old avatar comes back on reload.
   */
  private refreshAvatarFromServer(previous: string, attempt = 0) {
    const profilePk = this.authService.getUserDataFromStorage()?.profile?.id ?? this.profilePk;
    if (!profilePk) {
      this.avatarUploading = false;
      this.toastr.success(this.i18n.t('settings.imageUploaded'));
      return;
    }
    this.userService.getProfile(profilePk).subscribe({
      next: (profile) => {
        const url = profile?.profileImageUrl;
        if (url && url !== previous) {
          this.avatarUploading = false;
          this.setPreview(url);
          this.storeAvatarUrl(url);
          this.toastr.success(this.i18n.t('settings.imageUploaded'));
        } else if (attempt < AVATAR_POLL_ATTEMPTS) {
          setTimeout(() => this.refreshAvatarFromServer(previous, attempt + 1), AVATAR_POLL_MS);
        } else {
          // The upload succeeded; keep the local preview rather than flashing the old image.
          this.avatarUploading = false;
          this.toastr.success(this.i18n.t('settings.imageUploaded'));
        }
      },
      error: () => {
        this.avatarUploading = false;
        this.toastr.success(this.i18n.t('settings.imageUploaded'));
      },
    });
  }

  /** Keeps the rest of the stored user data and swaps in the fresh avatar URL. */
  private storeAvatarUrl(url: string) {
    const stored = this.authService.getUserDataFromStorage();
    if (!stored?.profile) return;
    this.storeProfile({ ...stored.profile, profileImageUrl: url });
  }
}
