import { Injectable, inject } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private snackBar = inject(MatSnackBar);

  success(detail: string, summary = 'Success'): void {
    this.snackBar.open(detail, 'OK', {
      duration: 3000,
      panelClass: ['snackbar-success'],
    });
  }

  error(detail: string, summary = 'Error'): void {
    this.snackBar.open(detail, 'OK', {
      duration: 5000,
      panelClass: ['snackbar-error'],
    });
  }

  info(detail: string, summary = 'Info'): void {
    this.snackBar.open(detail, 'OK', {
      duration: 3000,
      panelClass: ['snackbar-info'],
    });
  }

  warn(detail: string, summary = 'Warning'): void {
    this.snackBar.open(detail, 'OK', {
      duration: 4000,
      panelClass: ['snackbar-warn'],
    });
  }
}
