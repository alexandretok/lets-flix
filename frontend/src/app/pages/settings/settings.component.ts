import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MultiSelect } from 'primeng/multiselect';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Button } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ApiService } from '../../services/api.service';
import { getLanguageOptions } from '../../shared/languages';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, FormsModule, MultiSelect, ToggleSwitch, Button, Toast],
  providers: [MessageService],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  private api = inject(ApiService);
  private messageService = inject(MessageService);
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
        this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Settings updated successfully' });
        this.cdr.markForCheck();
      },
      error: () => {
        this.saving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save settings' });
        this.cdr.markForCheck();
      }
    });
  }
}
