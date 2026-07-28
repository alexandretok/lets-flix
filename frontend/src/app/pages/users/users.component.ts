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
  template: `
    <app-layout>
      <p-toast />
      <div class="users-container">
        <div class="users-header">
          <h1>User Management</h1>
          <p-button label="Create User" icon="pi pi-user-plus" severity="danger" (onClick)="showCreateDialog = true" />
        </div>

        <p-table [value]="users" [tableStyle]="{'min-width': '50rem'}">
          <ng-template #header>
            <tr>
              <th>Username</th>
              <th>Role</th>
              <th>Password Change Required</th>
              <th>Actions</th>
            </tr>
          </ng-template>
          <ng-template #body let-user>
            <tr>
              <td>{{ user.username }}</td>
              <td><span class="role-badge" [class.admin]="user.role === 'admin'">{{ user.role }}</span></td>
              <td>{{ user.requires_password_change ? 'Yes' : 'No' }}</td>
              <td>
                @if (user.id !== authStore.user()?.id) {
                  <p-button icon="pi pi-trash" [text]="true" severity="danger" (onClick)="deleteUser(user)" />
                }
              </td>
            </tr>
          </ng-template>
        </p-table>
      </div>

      <p-dialog header="Create User" [(visible)]="showCreateDialog" [modal]="true" [style]="{width: '400px'}">
        <div class="create-form">
          <div class="field">
            <label>Username</label>
            <input pInputText [(ngModel)]="newUsername" class="w-full" />
          </div>
          <div class="field">
            <label>Password</label>
            <input pInputText [(ngModel)]="newPassword" type="password" class="w-full" />
          </div>
          <div class="field">
            <label>Role</label>
            <p-select [options]="roleOptions" [(ngModel)]="newRole" optionLabel="label" optionValue="value" [style]="{width: '100%'}" />
          </div>
          <p-button label="Create" icon="pi pi-check" severity="danger" (onClick)="createUser()" [disabled]="!newUsername || !newPassword" styleClass="w-full" />
        </div>
      </p-dialog>
    </app-layout>
  `,
  styles: [`
    .users-container { max-width: 800px; }
    .users-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
    }
    .users-header h1 { color: #e0e0e0; margin: 0; }
    .role-badge {
      padding: 0.25rem 0.75rem;
      border-radius: 20px;
      font-size: 0.8rem;
      background: rgba(255,255,255,0.1);
      color: #ccc;
    }
    .role-badge.admin { background: rgba(233,69,96,0.2); color: #e94560; }
    .create-form .field { margin-bottom: 1rem; }
    .create-form .field label {
      display: block;
      margin-bottom: 0.5rem;
      color: #ccc;
    }
    .w-full { width: 100%; }
  `]
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
