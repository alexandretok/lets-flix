import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { AuthStore } from '../../stores/auth.store';

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule, MatSelectModule, MatTableModule, MatTooltipModule],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  authStore = inject(AuthStore);
  private api = inject(ApiService);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  users: any[] = [];
  displayedColumns = ['username', 'role', 'passwordChange', 'actions'];
  showCreateDialog = false;
  showPasswordDialog = false;
  generatedPassword = '';
  generatedForUser = '';
  newUsername = '';
  newRole = 'user';

  roleOptions = [
    { label: 'User', value: 'user' },
    { label: 'Admin', value: 'admin' },
  ];

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.api.getUsers().subscribe({
      next: (users) => { this.users = users; this.cdr.markForCheck(); }
    });
  }

  openCreateDialog(): void {
    this.showCreateDialog = true;
  }

  closeCreateDialog(): void {
    this.showCreateDialog = false;
  }

  closePasswordDialog(): void {
    this.showPasswordDialog = false;
  }

  createUser(): void {
    this.api.createUser(this.newUsername, this.newRole).subscribe({
      next: (res) => {
        this.showCreateDialog = false;
        this.generatedPassword = res.tempPassword;
        this.generatedForUser = this.newUsername;
        this.showPasswordDialog = true;
        this.newUsername = '';
        this.newRole = 'user';
        this.loadUsers();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.notify.error(err.error?.error || 'Failed to create user');
        this.cdr.markForCheck();
      }
    });
  }

  resetPassword(user: any): void {
    this.api.resetPassword(user.id).subscribe({
      next: (res) => {
        this.generatedPassword = res.tempPassword;
        this.generatedForUser = user.username;
        this.showPasswordDialog = true;
        this.loadUsers();
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.notify.error(err.error?.error || 'Failed to reset password');
        this.cdr.markForCheck();
      }
    });
  }

  deleteUser(user: any): void {
    this.api.deleteUser(user.id).subscribe({
      next: () => {
        this.loadUsers();
        this.notify.success(`User ${user.username} deleted`);
      },
      error: (err) => {
        this.notify.error(err.error?.error || 'Failed to delete user');
        this.cdr.markForCheck();
      }
    });
  }

  copyPassword(): void {
    navigator.clipboard.writeText(this.generatedPassword);
    this.notify.info('Password copied to clipboard');
  }
}
