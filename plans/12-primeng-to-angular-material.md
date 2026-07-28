# Plan 12: Migrate from PrimeNG to Angular Material

## Objective
Replace all PrimeNG components with Angular Material equivalents while maintaining the same dark-theme look, functionality, and UX patterns.

## Pre-Migration: Dependencies & Configuration

### 12.1 Install Angular Material & Remove PrimeNG
- Install `@angular/material` and `@angular/cdk`
- Install `@angular/material-icons` (or use Material Symbols via Google Fonts)
- Remove `primeng`, `@primeng/themes`, `primeicons` from `package.json`
- Update `app.config.ts`: remove `providePrimeNG`, add `provideAnimationsAsync()`
- Update `styles.scss`: remove PrimeIcons import, add Material theme + icon font
- Create custom dark theme using Angular Material's theming system with the same color palette (`--primary-color: #e94560`, dark surfaces)

## Component Migration Map

### 12.2 Global: Notification Service (Toast → Snackbar)
- **Before:** `MessageService` + `<p-toast />` in 7 components
- **After:** Angular Material `MatSnackBar` service (no template element needed)
- Create a shared `NotificationService` wrapping `MatSnackBar` with severity-styled messages
- Remove all `<p-toast />` from templates and `MessageService` from providers
- Components affected: `search`, `login`, `setup-password`, `home`, `users`, `settings`, `content-details`, `downloads`

### 12.3 Buttons (p-button → mat-button)
- **Before:** `<p-button label="X" icon="pi pi-y" severity="danger" />`
- **After:** `<button mat-raised-button color="primary"><mat-icon>y</mat-icon> X</button>` (or `mat-flat-button`, `mat-icon-button`)
- Map PrimeNG severities to Material: `danger` → `primary` (app accent), `secondary` → default, `success` → custom class, `warn` → `warn`
- Map icon-only `[text]="true"` buttons to `mat-icon-button`
- Map `[loading]` → custom `[disabled]` + spinner overlay or `mat-spinner`
- Components affected: ALL (11 files)

### 12.4 Inputs (pInputText → matInput)
- **Before:** `<input pInputText [(ngModel)]="x" class="w-full" />`
- **After:** `<mat-form-field><input matInput [(ngModel)]="x" /></mat-form-field>`
- Components affected: `login`, `search`, `users`

### 12.5 Password (p-password → custom matInput)
- **Before:** `<p-password [(ngModel)]="x" [toggleMask]="true" [feedback]="false" />`
- **After:** `<mat-form-field><input matInput [type]="hidePassword ? 'password' : 'text'" /><button mat-icon-button matSuffix (click)="hidePassword = !hidePassword"><mat-icon>{{hidePassword ? 'visibility_off' : 'visibility'}}</mat-icon></button></mat-form-field>`
- Components affected: `login`, `setup-password`

### 12.6 Dialogs (p-dialog → MatDialog)
- **Before:** Declarative `<p-dialog [(visible)]="x" [modal]="true">` in template
- **After:** Two approaches:
  - **Simple dialogs (confirm, password display):** Keep inline using `<ng-template>` + CDK Dialog or use the `@angular/cdk/dialog`
  - **Complex dialogs:** Use `MatDialog.open(Component, config)` with `MAT_DIALOG_DATA`
- For this project, since dialogs are simple (no separate routing), use `@if` blocks with a custom overlay OR migrate to `MatDialog` service
- **Decision:** Use `MatDialog` service-based approach for consistency
- Components affected: `home`, `users`, `content-details`, `episode-selector`, `downloads`

### 12.7 Table (p-table → mat-table)
- **Before:** `<p-table [value]="users">` with `#header`/`#body` templates
- **After:** `<table mat-table [dataSource]="users">` with `matColumnDef`, `*matHeaderCellDef`, `*matCellDef`
- Only used in: `users` component (simple table, no sorting/filtering needed)

### 12.8 Select / Dropdown (p-select → mat-select)
- **Before:** `<p-select [options]="opts" [(ngModel)]="val" optionLabel="label" optionValue="value" />`
- **After:** `<mat-form-field><mat-select [(ngModel)]="val"><mat-option *ngFor="let o of opts" [value]="o.value">{{o.label}}</mat-option></mat-select></mat-form-field>`
- Components affected: `users`, `content-details`, `downloads`

### 12.9 MultiSelect (p-multiselect → mat-select[multiple])
- **Before:** `<p-multiselect [options]="opts" [(ngModel)]="vals" />`
- **After:** `<mat-form-field><mat-select multiple [(ngModel)]="vals"><mat-option *ngFor="let o of opts" [value]="o.value">{{o.label}}</mat-option></mat-select></mat-form-field>`
- Note: Loses built-in filter/search — for the language list (62 items), add `mat-autocomplete` style filtering or a search input inside the panel
- Components affected: `settings`

### 12.10 ToggleSwitch (p-toggleswitch → mat-slide-toggle)
- **Before:** `<p-toggleswitch [(ngModel)]="val" />`
- **After:** `<mat-slide-toggle [(ngModel)]="val">Label</mat-slide-toggle>`
- Components affected: `settings`

### 12.11 Checkbox (p-checkbox → mat-checkbox)
- **Before:** `<p-checkbox [(ngModel)]="val" [binary]="true" [indeterminate]="x" />`
- **After:** `<mat-checkbox [(ngModel)]="val" [indeterminate]="x" />`
- Components affected: `home`, `episode-selector`

### 12.12 ProgressBar (p-progressbar → mat-progress-bar)
- **Before:** `<p-progressbar [value]="x" [showValue]="true" />`
- **After:** `<mat-progress-bar mode="determinate" [value]="x" />` + separate `<span>{{x}}%</span>` for value display
- Components affected: `layout`, `content-details`, `downloads`

### 12.13 Tag (p-tag → custom chip/badge)
- **Before:** `<p-tag [value]="text" [severity]="sev" />`
- **After:** Custom `<span class="status-tag" [class]="severity">{{text}}</span>` or `<mat-chip>{{text}}</mat-chip>`
- Since tags here are just status labels (not interactive chips), use simple styled `<span>` elements
- Components affected: `browse`, `content-details`, `downloads`

### 12.14 Tooltip (pTooltip → matTooltip)
- **Before:** `pTooltip="text"`
- **After:** `matTooltip="text"`
- Components affected: `users`, `content-details`, `downloads`

### 12.15 Icons (PrimeIcons → Material Icons)
- Replace `pi pi-*` class-based icons with `<mat-icon>name</mat-icon>` or Material Symbols
- Create an icon mapping:
  - `pi-home` → `home`
  - `pi-th-large` → `grid_view`
  - `pi-search` → `search`
  - `pi-cog` → `settings`
  - `pi-cloud-download` → `cloud_download`
  - `pi-users` → `group`
  - `pi-user` → `person`
  - `pi-sign-out` → `logout`
  - `pi-plus` → `add`
  - `pi-trash` → `delete`
  - `pi-check` → `check`
  - `pi-key` → `key`
  - `pi-copy` → `content_copy`
  - `pi-download` → `download`
  - `pi-play` → `play_arrow`
  - `pi-pause` → `pause`
  - `pi-refresh` → `refresh`
  - `pi-pencil` → `edit`
  - `pi-times` → `close`
  - `pi-star-fill` → `star`
  - `pi-bolt` → `bolt`
  - `pi-calendar` → `calendar_today`
  - `pi-tag` → `label`
  - `pi-image` → `image`
  - `pi-file` → `description`
  - `pi-arrow-left` → `arrow_back`
  - `pi-arrow-down` → `arrow_downward`
  - `pi-arrow-up` → `arrow_upward`
  - `pi-server` → `dns`
  - `pi-database` → `storage`
  - `pi-clock` → `schedule`
  - `pi-sync` → `sync`
  - `pi-inbox` → `inbox`
  - `pi-list` → `list`
  - `pi-video` → `movie`
  - `pi-external-link` → `open_in_new`
  - `pi-chevron-down` → `expand_more`
  - `pi-chevron-up` → `expand_less`
  - `pi-spin pi-spinner` → `<mat-spinner diameter="20" />`
  - `pi-user-plus` → `person_add`
  - `pi-language` → `subtitles`

### 12.16 Theming & Global Styles
- Create Material custom theme with:
  - Primary: `#e94560` (current brand red)
  - Dark surface colors matching current palette
  - Typography matching current font stack
- Configure dark mode as default (no toggle needed)
- Maintain existing CSS variables for custom styling

## Execution Order

1. **Phase 1 — Setup** (12.1, 12.16): Install deps, configure theme, set up icon font
2. **Phase 2 — Shared services** (12.2): Create NotificationService
3. **Phase 3 — Components** (12.3–12.15): Migrate each component file-by-file
4. **Phase 4 — Cleanup**: Remove all PrimeNG references, verify build, fix any styling issues

## Component Migration Order (by dependency)
1. `app.config.ts` + `styles.scss` (foundation)
2. `layout.component` (shell — buttons, progress bar, icons)
3. `login.component` (standalone page — inputs, password, button, toast)
4. `setup-password.component` (standalone — password, button, toast)
5. `episode-selector.component` (shared component — dialog, checkbox, button)
6. `browse.component` (simple — tag, button)
7. `search.component` (inputs, button, toast)
8. `home.component` (dialog, checkbox, button, toast)
9. `content-details.component` (complex — tag, button, progress, select, dialog, toast)
10. `settings.component` (multiselect, toggle, button, toast)
11. `users.component` (table, dialog, input, select, button, toast)
12. `downloads.component` (select, tag, progressbar, dialog, button, toast)
13. `watch.component` (simple — button only)

## Risks & Mitigations
- **Dialog API change:** Most complex refactoring. Mitigate by creating separate dialog components for: create-user, password-display, confirm-action, episode-subtitle
- **MultiSelect filtering:** Material has no built-in filter. Add a simple text input above the option list
- **Loading buttons:** No built-in `[loading]` prop. Create a reusable directive or use `[disabled]` + inline spinner
- **Toast stacking:** MatSnackBar only shows one message. Accept this limitation or use a third-party snackbar that supports stacking

## Success Criteria
- All PrimeNG packages removed from `package.json`
- App builds without errors
- All pages render and function correctly
- Dark theme looks consistent and polished
- No regressions in functionality
