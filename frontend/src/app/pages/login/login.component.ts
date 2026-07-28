import { Component, inject, ChangeDetectorRef } from '@angular/core';
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
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  authStore = inject(AuthStore);
  private api = inject(ApiService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

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
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        this.authStore.loginFailure(err.error?.error || 'Login failed');
        this.messageService.add({ severity: 'error', summary: 'Login Failed', detail: err.error?.error || 'Invalid credentials' });
        this.cdr.markForCheck();
      }
    });
  }
}
