import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, Router } from '@angular/router';
import { LoginComponent } from './login.component';
import { AuthStore } from '../../stores/auth.store';
import { provideAnimations } from '@angular/platform-browser/animations';

describe('LoginComponent', () => {
  let component: LoginComponent;
  let fixture: ComponentFixture<LoginComponent>;
  let httpMock: HttpTestingController;
  let router: Router;
  let store: InstanceType<typeof AuthStore>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [LoginComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideAnimations(),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(LoginComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
    router = TestBed.inject(Router);
    store = TestBed.inject(AuthStore);
    vi.spyOn(router, 'navigate');
    fixture.detectChanges();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should not call API when fields are empty', () => {
    component.username = '';
    component.password = '';
    component.onLogin();
    httpMock.expectNone('/api/auth/login');
  });

  it('should call API and navigate on successful login', () => {
    component.username = 'admin';
    component.password = 'admin';
    component.onLogin();

    const req = httpMock.expectOne('/api/auth/login');
    req.flush({
      token: 'jwt_token',
      user: { id: 1, username: 'admin', role: 'admin', requires_password_change: false },
    });

    expect(store.isAuthenticated()).toBe(true);
    expect(router.navigate).toHaveBeenCalledWith(['/home']);
  });

  it('should navigate to /setup-password if password change required', () => {
    component.username = 'admin';
    component.password = 'admin';
    component.onLogin();

    const req = httpMock.expectOne('/api/auth/login');
    req.flush({
      token: 'jwt_token',
      user: { id: 1, username: 'admin', role: 'admin', requires_password_change: true },
    });

    expect(router.navigate).toHaveBeenCalledWith(['/setup-password']);
  });

  it('should show error on login failure', () => {
    component.username = 'admin';
    component.password = 'wrong';
    component.onLogin();

    const req = httpMock.expectOne('/api/auth/login');
    req.flush({ error: 'Invalid credentials' }, { status: 401, statusText: 'Unauthorized' });

    expect(store.error()).toBe('Invalid credentials');
    expect(store.loading()).toBe(false);
  });
});
