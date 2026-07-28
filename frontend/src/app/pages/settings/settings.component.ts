import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MultiSelect } from 'primeng/multiselect';
import { ToggleSwitch } from 'primeng/toggleswitch';
import { Button } from 'primeng/button';
import { Toast } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { LayoutComponent } from '../../layout/layout.component';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-settings',
  imports: [CommonModule, FormsModule, MultiSelect, ToggleSwitch, Button, Toast, LayoutComponent],
  providers: [MessageService],
  template: `
    <app-layout>
      <p-toast />
      <div class="settings-container">
        <h1>Settings</h1>

        <div class="settings-section">
          <h3>Subtitles</h3>
          <div class="field">
            <label>Preferred Languages</label>
            <p-multiselect [options]="languageOptions" [(ngModel)]="subtitleLanguages" optionLabel="label" optionValue="value" placeholder="Select languages" [style]="{width: '100%'}" />
          </div>
        </div>

        <div class="settings-section">
          <h3>Downloads</h3>
          <div class="field">
            <label>Allowed Resolutions</label>
            <p-multiselect [options]="resolutionOptions" [(ngModel)]="allowedResolutions" optionLabel="label" optionValue="value" placeholder="Select resolutions" [style]="{width: '100%'}" />
          </div>
        </div>

        <div class="settings-section">
          <h3>Storage</h3>
          <div class="field toggle-field">
            <label>Auto-delete files after watching</label>
            <p-toggleswitch [(ngModel)]="autoDeleteWatched" />
          </div>
        </div>

        <div class="actions">
          <p-button label="Save Settings" icon="pi pi-check" severity="danger" (onClick)="save()" [loading]="saving" />
        </div>
      </div>
    </app-layout>
  `,
  styles: [`
    .settings-container { max-width: 600px; }
    .settings-container h1 { color: #e0e0e0; margin-bottom: 2rem; }
    .settings-section {
      margin-bottom: 2rem;
      padding: 1.5rem;
      background: rgba(255,255,255,0.05);
      border-radius: 12px;
    }
    .settings-section h3 { color: #e0e0e0; margin: 0 0 1rem; }
    .field { margin-bottom: 1rem; }
    .field label {
      display: block;
      margin-bottom: 0.5rem;
      color: #ccc;
      font-size: 0.9rem;
    }
    .toggle-field {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .toggle-field label { margin-bottom: 0; }
    .actions { margin-top: 1.5rem; }
  `]
})
export class SettingsComponent implements OnInit {
  private api = inject(ApiService);
  private messageService = inject(MessageService);
  private cdr = inject(ChangeDetectorRef);

  subtitleLanguages: string[] = [];
  allowedResolutions: string[] = [];
  autoDeleteWatched = false;
  saving = false;

  languageOptions = [
    { label: 'English', value: 'en' },
    { label: 'Portuguese', value: 'pt' },
    { label: 'Spanish', value: 'es' },
    { label: 'French', value: 'fr' },
    { label: 'German', value: 'de' },
    { label: 'Italian', value: 'it' },
    { label: 'Japanese', value: 'ja' },
    { label: 'Korean', value: 'ko' },
  ];

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
