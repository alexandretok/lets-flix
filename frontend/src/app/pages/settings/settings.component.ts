import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../services/api.service';
import { NotificationService } from '../../services/notification.service';
import { getLanguageOptions } from '../../shared/languages';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatSelectModule, MatSlideToggleModule, MatButtonModule, MatIconModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  private api = inject(ApiService);
  private notify = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef);

  subtitleLanguages: string[] = [];
  allowedResolutions: string[] = [];
  autoDeleteWatched = false;
  saving = false;

  languageOptions = getLanguageOptions();

  resolutionOptions = [
    { label: '720p', value: '720p' },
    { label: '1080p', value: '1080p' },
    { label: '2160p (4K)', value: '2160p' },
  ];

  ngOnInit(): void {
    this.api.getSettings().subscribe({
      next: (res) => {
        const s = res.settings;
        this.subtitleLanguages = s.subtitle_language || ['en'];
        this.allowedResolutions = s.allowed_resolutions || ['720p', '1080p'];
        this.autoDeleteWatched = s.auto_delete_watched === true || s.auto_delete_watched === 'true';
        this.cdr.markForCheck();
      }
    });
  }

  save(): void {
    this.saving = true;
    const settings = {
      subtitle_language: this.subtitleLanguages,
      allowed_resolutions: this.allowedResolutions,
      auto_delete_watched: String(this.autoDeleteWatched),
    };

    this.api.updateSettings(settings).subscribe({
      next: () => {
        this.saving = false;
        this.notify.success('Settings updated successfully');
        this.cdr.markForCheck();
      },
      error: () => {
        this.saving = false;
        this.notify.error('Failed to save settings');
        this.cdr.markForCheck();
      }
    });
  }
}
