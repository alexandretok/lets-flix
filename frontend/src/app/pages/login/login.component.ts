import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { InputText } from 'primeng/inputtext';
import { Password } from 'primeng/password';
import { Button } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { AuthStore } from '../../stores/auth.store';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, InputText, Password, Button, Toast],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="login-container">
      <div class="login-card">
        <div class="logo-section">
          <h1 class="logo-text">LetsFlix</h1>
          <p class="subtitle">Your personal streaming platform</p>
        </div>
        <div class="form-section">
          <div class="field">
            <label for="username">Username</label>
            <input pInputText id="username" [(ngModel)]="username" placeholder="Enter username" class="w-full" />
          </div>
          <div class="field">
            <label for="password">Password</label>
            <p-password id="password" [(ngModel)]="password" [feedback]="false" placeholder="Enter password" styleClass="w-full" [toggleMask]="true" (keydown.enter)="onLogin()" />
          </div>
          <p-button label="Sign In" (onClick)="onLogin()" [loading]="authStore.loading()" styleClass="w-full" severity="danger" />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
    }
    .login-card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      border-radius: 16px;
      padding: 3rem;
      width: 100%;
      max-width: 400px;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }
    .logo-section {
      text-align: center;
      margin-bottom: 2rem;
    }
    .logo-text {
      font-size: 2.5rem;
      font-weight: bold;
      color: #e94560;
      margin: 0;
    }
    .subtitle {
      color: #a0a0a0;
      margin-top: 0.5rem;
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
export class LoginComponent {
  authStore = inject(AuthStore);
  private api = inject(ApiService);
  private router = inject(Router);
  private messageService = inject(MessageService);

  username = '';
  password = '';

  onLogin(): void {
    if (!this.username || !this.password) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please fill in all fields' });
      return;
    }

    this.authStore.setLoading(true);
    this.api.login(this.username, this.password).subscribe({
      next: (res) => {
        this.authStore.loginSuccess(res.token, res.user);
        if (res.user.requires_password_change) {
          this.router.navigate(['/setup-password']);
        } else {
          this.router.navigate(['/browse']);
        }
      },
      error: (err) => {
        this.authStore.loginFailure(err.error?.error || 'Login failed');
        this.messageService.add({ severity: 'error', summary: 'Login Failed', detail: err.error?.error || 'Invalid credentials' });
      }
    });
  }
}
