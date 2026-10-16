import { CommonModule } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { finalize } from 'rxjs';
import { AuthService } from '../../account/auth.service';
import { ModalComponent } from '../../components/modal/modal.component';
import { AgentResponse, AgentService } from '../../shared/services/agent.service';
import { MediaService } from '../../shared/services/media.service';
import { formatPhone, PHONE_PATTERN, PhoneMask } from '../../shared/utils/phone-mask.directive';
import { TranslatePipe } from '../../shared/i18n/translate.pipe';
import { I18nService } from '../../shared/i18n/i18n.service';

interface Agent {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  phone: string;
  properties: number;
  status: 'active' | 'inactive';
  dateJoined: string;
  avatarUrl: string | null;
  raw: AgentResponse;
}

const passwordsMatch = (group: AbstractControl): ValidationErrors | null => {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  return password && confirm && password !== confirm ? { passwordMismatch: true } : null;
};

@Component({
  selector: 'app-agents',
  imports: [CommonModule, ReactiveFormsModule, ModalComponent, PhoneMask, TranslatePipe],
  templateUrl: './agents.html',
  styleUrl: './agents.scss',
})
export class Agents implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private toast = inject(ToastrService);
  private i18n = inject(I18nService);
  private agentService = inject(AgentService);
  private mediaService = inject(MediaService);

  isLoading = signal(false);
  loadError = signal<string | null>(null);

  isAddAgentOpen = signal(false);
  isSubmitting = signal(false);
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  editingAgent = signal<Agent | null>(null);
  isUpdating = signal(false);
  avatarFile = signal<File | null>(null);
  avatarPreview = signal<string | null>(null);

  viewingAgent = signal<Agent | null>(null);

  deletingAgent = signal<Agent | null>(null);
  isDeleting = signal(false);
  reactivatingId = signal<number | null>(null);

  addAgentForm = this.fb.nonNullable.group(
    {
      username: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [Validators.required, Validators.pattern(PHONE_PATTERN)]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

  editAgentForm = this.fb.nonNullable.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    firstName: [''],
    lastName: [''],
    phoneNumber: ['', [Validators.pattern(PHONE_PATTERN)]],
  });

  agents = signal<Agent[]>([]);

  ngOnInit() {
    this.loadAgents();
  }

  loadAgents() {
    this.isLoading.set(true);
    this.loadError.set(null);
    this.agentService
      .getAgents()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (agents) => {
          this.agents.set(agents.map((a) => this.toAgent(a)));
        },
        error: (err) => {
          this.agents.set([]);
          this.loadError.set(
            err?.status === 403
              ? this.i18n.t('agents.err.forbiddenView')
              : err?.status === 404
                ? this.i18n.t('agents.err.notFound')
                : this.i18n.t('agents.err.load'),
          );
        },
      });
  }

  private toAgent(a: AgentResponse): Agent {
    const fullName = [a.profile?.firstName, a.profile?.lastName].filter(Boolean).join(' ').trim();
    const joined = a.createdAt ?? a.profile?.createdAt;
    return {
      id: a.id,
      username: a.username,
      firstName: a.profile?.firstName ?? '',
      lastName: a.profile?.lastName ?? '',
      name: fullName || a.username,
      email: a.email,
      phone: a.phoneNumber || a.profile?.phoneNumber || '-',
      properties: a.propertiesCount ?? 0,
      status: a.enabled === false ? 'inactive' : 'active',
      dateJoined: joined ? joined.slice(0, 10) : '-',
      avatarUrl: a.profile?.profileImageUrl || null,
      raw: a,
    };
  }

  openAddAgent() {
    this.addAgentForm.reset();
    this.showPassword.set(false);
    this.showConfirmPassword.set(false);
    this.isAddAgentOpen.set(true);
  }

  closeAddAgent() {
    this.isAddAgentOpen.set(false);
  }

  isInvalid(name: string, form: FormGroup = this.addAgentForm): boolean {
    const control = form.get(name);
    return !!control && control.invalid && (control.touched || control.dirty);
  }

  submitAddAgent() {
    if (this.addAgentForm.invalid || this.isSubmitting()) {
      this.addAgentForm.markAllAsTouched();
      return;
    }

    const { username, email, phoneNumber, password } = this.addAgentForm.getRawValue();
    this.isSubmitting.set(true);

    this.authService
      .registerAgent(username.trim(), email.trim(), password, phoneNumber.trim())
      .pipe(finalize(() => this.isSubmitting.set(false)))
      .subscribe({
        next: () => {
          this.loadAgents();
          this.toast.success(this.i18n.t('agents.created', { name: username }), this.i18n.t('common.success'));
          this.closeAddAgent();
        },
        error: (err) => {
          const message =
            err?.error?.message ??
            (typeof err?.error === 'string' ? err.error : null) ??
            (err?.status === 403 ? this.i18n.t('agents.err.forbiddenAdd') : this.i18n.t('agents.err.create'));
          this.toast.error(message, this.i18n.t('agents.err.addTitle'));
        },
      });
  }

  openEditAgent(agent: Agent) {
    this.editAgentForm.reset({
      username: agent.username,
      email: agent.email,
      firstName: agent.firstName,
      lastName: agent.lastName,
      phoneNumber: agent.phone === '-' ? '' : formatPhone(agent.phone),
    });
    this.setAvatarFile(null);
    this.avatarPreview.set(agent.avatarUrl);
    this.editingAgent.set(agent);
  }

  closeEditAgent() {
    this.setAvatarFile(null);
    this.editingAgent.set(null);
  }

  onAvatarSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    input.value = '';
    if (!file) {
      return;
    }
    if (!file.type.startsWith('image/')) {
      this.toast.error(this.i18n.t('agents.err.imageOnly'), this.i18n.t('agents.err.invalidFile'));
      return;
    }
    this.setAvatarFile(file);
  }

  setAvatarFile(file: File | null) {
    const previous = this.avatarPreview();
    if (previous?.startsWith('blob:')) {
      URL.revokeObjectURL(previous);
    }
    this.avatarFile.set(file);
    this.avatarPreview.set(file ? URL.createObjectURL(file) : (this.editingAgent()?.avatarUrl ?? null));
  }

  openViewAgent(agent: Agent) {
    this.viewingAgent.set(agent);
  }

  closeViewAgent() {
    this.viewingAgent.set(null);
  }

  editFromView(agent: Agent) {
    this.closeViewAgent();
    this.openEditAgent(agent);
  }

  submitEditAgent() {
    const agent = this.editingAgent();
    if (!agent || this.isUpdating()) {
      return;
    }
    if (this.editAgentForm.invalid) {
      this.editAgentForm.markAllAsTouched();
      return;
    }

    const { username, email, firstName, lastName, phoneNumber } = this.editAgentForm.getRawValue();
    this.isUpdating.set(true);

    this.agentService
      .updateAgent(agent.id, {
        username: username.trim(),
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim(),
      })
      .pipe(finalize(() => this.isUpdating.set(false)))
      .subscribe({
        next: (updated) => {
          const next = this.toAgent(updated);
          this.agents.update((list) => list.map((a) => (a.id === next.id ? next : a)));
          const avatar = this.avatarFile();
          if (avatar) {
            this.uploadAgentAvatar(next, avatar);
          } else {
            this.toast.success(this.i18n.t('agents.updated', { name: next.name }), this.i18n.t('common.success'));
          }
          this.closeEditAgent();
        },
        error: (err) => {
          const message =
            err?.error?.message ??
            (typeof err?.error === 'string' ? err.error : null) ??
            (err?.status === 403 ? this.i18n.t('agents.err.forbiddenEdit') : this.i18n.t('agents.err.update'));
          this.toast.error(message, this.i18n.t('agents.err.editTitle'));
        },
      });
  }

  openDeleteAgent(agent: Agent) {
    this.deletingAgent.set(agent);
  }

  closeDeleteAgent() {
    this.deletingAgent.set(null);
  }

  confirmDeleteAgent() {
    const agent = this.deletingAgent();
    if (!agent || this.isDeleting()) {
      return;
    }
    this.isDeleting.set(true);
    this.agentService
      .deactivateAgent(agent.id)
      .pipe(finalize(() => this.isDeleting.set(false)))
      .subscribe({
        next: (updated) => {
          this.replaceAgent(updated);
          this.toast.success(this.i18n.t('agents.deactivated', { name: agent.name }), this.i18n.t('common.success'));
          this.closeDeleteAgent();
        },
        error: (err) => {
          this.toast.error(
            this.errorMessage(err, this.i18n.t('agents.err.forbiddenDelete'), this.i18n.t('agents.err.delete')),
            this.i18n.t('agents.err.deleteTitle'),
          );
        },
      });
  }

  reactivateAgent(agent: Agent) {
    if (this.reactivatingId() !== null) {
      return;
    }
    this.reactivatingId.set(agent.id);
    this.agentService
      .reactivateAgent(agent.id)
      .pipe(finalize(() => this.reactivatingId.set(null)))
      .subscribe({
        next: (updated) => {
          this.replaceAgent(updated);
          this.toast.success(this.i18n.t('agents.reactivated', { name: agent.name }), this.i18n.t('common.success'));
        },
        error: (err) => {
          this.toast.error(
            this.errorMessage(err, this.i18n.t('agents.err.forbiddenReactivate'), this.i18n.t('agents.err.reactivate')),
            this.i18n.t('agents.err.reactivateTitle'),
          );
        },
      });
  }

  private replaceAgent(updated: AgentResponse) {
    const next = this.toAgent(updated);
    this.agents.update((list) => list.map((a) => (a.id === next.id ? next : a)));
    if (this.viewingAgent()?.id === next.id) {
      this.viewingAgent.set(next);
    }
  }

  private errorMessage(err: any, forbidden: string, fallback: string): string {
    return (
      err?.error?.message ??
      (typeof err?.error === 'string' ? err.error : null) ??
      (err?.status === 403 ? forbidden : fallback)
    );
  }

  // The profile row must exist before the avatar is attached to it, so this runs after the agent update.
  private uploadAgentAvatar(agent: Agent, file: File) {
    this.mediaService.uploadUserAvatar(agent.id, file).subscribe({
      next: () => {
        this.toast.success(this.i18n.t('agents.updated', { name: agent.name }), this.i18n.t('common.success'));
        this.loadAgents();
      },
      error: () => {
        this.toast.warning(this.i18n.t('agents.avatarFailed'), this.i18n.t('agents.partialUpdate'));
      },
    });
  }

  getStatusClass(agent: Agent) {
    if (agent.status === 'active') {
      return 'bg-green-50 text-green-700 py-0.5 px-2.5 rounded-full border border-green-200';
    }
    if (agent.status === 'inactive') {
      return 'bg-gray-50 text-gray-700 py-0.5 px-2.5 rounded-full border border-gray-200';
    }
    return '';
  }
}
