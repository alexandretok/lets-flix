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
  template: `
    <p-toast />
    <div class="setup-container">
      <div class="setup-card">
        <div class="header-section">
          <h1 class="logo-text">LetsFlix</h1>
          <h2>Change Your Password</h2>
          <p class="info-text">You must set a new password before continuing.</p>
        </div>
        <div class="form-section">
          <div class="field">
            <label for="newPassword">New Password</label>
            <p-password id="newPassword" [(ngModel)]="newPassword" placeholder="Enter new password" styleClass="w-full" [toggleMask]="true" />
          </div>
          <div class="field">
            <label for="confirmPassword">Confirm Password</label>
            <p-password id="confirmPassword" [(ngModel)]="confirmPassword" [feedback]="false" placeholder="Confirm password" styleClass="w-full" [toggleMask]="true" (keydown.enter)="onChangePassword()" />
          </div>
          <p-button label="Set Password" (onClick)="onChangePassword()" [loading]="loading" styleClass="w-full" severity="danger" />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .setup-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    }
    .setup-card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 3rem;
      width: 100%;
      max-width: 400px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .header-section {
      text-align: center;
      margin-bottom: 2rem;
    }
    .logo-text {
      font-size: 2rem;
      color: #e94560;
      margin: 0 0 0.5rem;
    }
    .header-section h2 {
      color: #e0e0e0;
      margin: 0.5rem 0;
    }
    .info-text {
      color: #a0a0a0;
      font-size: 0.9rem;
    }
    .field {
      margin-bottom: 1.5rem;
    }
    .field label {
      display: block;
      margin-bottom: 0.5rem;
      color: #e0e0e0;
      font-size: 0.9rem;
    }
    .w-full { width: 100%; }
  `]
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
