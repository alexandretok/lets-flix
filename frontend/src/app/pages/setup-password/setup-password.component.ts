import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthStore } from '../../stores/auth.store';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-setup-password',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './setup-password.component.html',
  styleUrl: './setup-password.component.scss',
})
export class SetupPasswordComponent {
  private authStore = inject(AuthStore);
  private api = inject(ApiService);
  private router = inject(Router);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  newPassword = '';
  confirmPassword = '';
  loading = false;
  hideNew = true;
  hideConfirm = true;

  onChangePassword(): void {
    if (!this.newPassword || this.newPassword.length < 4) {
      this.notify.error('Password must be at least 4 characters');
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.notify.error('Passwords do not match');
      return;
    }

    this.loading = true;
    this.api.changePassword(this.newPassword).subscribe({
      next: (res) => {
        this.authStore.passwordChanged(res.token);
        this.notify.success('Password changed!');
        this.cdr.markForCheck();
        setTimeout(() => this.router.navigate(['/home']), 1000);
      },
      error: (err) => {
        this.loading = false;
        this.notify.error(err.error?.error || 'Failed to change password');
        this.cdr.markForCheck();
      }
    });
  }
}
