import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { InputText } from 'primeng/inputtext';
import { Button } from 'primeng/button';
import { Select } from 'primeng/select';
import { Toast } from 'primeng/toast';
import { TableModule } from 'primeng/table';
import { Dialog } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { LayoutComponent } from '../../layout/layout.component';
import { ApiService } from '../../services/api.service';
import { AuthStore } from '../../stores/auth.store';

@Component({
  selector: 'app-users',
  imports: [CommonModule, FormsModule, InputText, Button, Select, Toast, TableModule, Dialog, LayoutComponent],
  providers: [MessageService],
  templateUrl: './users.component.html',
  styleUrl: './users.component.scss',
})
export class UsersComponent implements OnInit {
  authStore = inject(AuthStore);
  private api = inject(ApiService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  users: any[] = [];
  showCreateDialog = false;
  newUsername = '';
  newPassword = '';
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

  createUser(): void {
    this.api.createUser(this.newUsername, this.newPassword, this.newRole).subscribe({
      next: () => {
        this.showCreateDialog = false;
        this.newUsername = '';
        this.newPassword = '';
        this.newRole = 'user';
        this.loadUsers();
        this.messageService.add({ severity: 'success', summary: 'Created', detail: 'User created successfully' });
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'Failed to create user' });
        this.cdr.markForCheck();
      }
    });
  }

  deleteUser(user: any): void {
    this.api.deleteUser(user.id).subscribe({
      next: () => {
        this.loadUsers();
        this.messageService.add({ severity: 'success', summary: 'Deleted', detail: `User ${user.username} deleted` });
      },
      error: (err) => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err.error?.error || 'Failed to delete user' });
        this.cdr.markForCheck();
      }
    });
  }
}
