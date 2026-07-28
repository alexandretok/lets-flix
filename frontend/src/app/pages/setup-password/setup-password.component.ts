import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthStore } from '../../stores/auth.store';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-setup-password',
  imports: [FormsModule, Password, Button, Toast],
  providers: [MessageService],
  templateUrl: './setup-password.component.html',
  styleUrl: './setup-password.component.scss',
})
export class SetupPasswordComponent {
  private authStore = inject(AuthStore);
  private api = inject(ApiService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  newPassword = '';
  confirmPassword = '';
  loading = false;

  onChangePassword(): void {
    if (!this.newPassword || this.newPassword.length < 4) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Password must be at least 4 characters' });
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Passwords do not match' });
      return;
    }

    this.loading = true;
    this.api.changePassword(this.newPassword).subscribe({
      next: (res) => {
        this.authStore.passwordChanged(res.token);
        this.messageService.add({ severity: 'success', summary: 'Success', detail: 'Password changed!' });
        this.cdr.markForCheck();
        setTimeout(() => this.router.navigate(['/browse']), 1000);
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'Failed to change password' });
        this.cdr.markForCheck();
      }
    });
  }
}
