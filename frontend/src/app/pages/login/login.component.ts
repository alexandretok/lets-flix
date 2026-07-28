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
  selector: 'app-login',
  imports: [FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  authStore = inject(AuthStore);
  private api = inject(ApiService);
  private router = inject(Router);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  username = '';
  password = '';
  hidePassword = true;

  onLogin(): void {
    if (!this.username || !this.password) {
      this.notify.error('Please fill in all fields');
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
        this.notify.error(err.error?.error || 'Invalid credentials', 'Login Failed');
        this.cdr.markForCheck();
      }
    });
  }
}
