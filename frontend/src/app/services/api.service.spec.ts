import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { ApiService } from './api.service';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('login', () => {
    it('should POST to /api/auth/login', () => {
      const mockResponse = { token: 'abc', user: { id: 1, username: 'admin' } };
      service.login('admin', 'pass').subscribe((res) => {
        expect(res.token).toBe('abc');
        expect(res.user.username).toBe('admin');
      });

      const req = httpMock.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'admin', password: 'pass' });
      req.flush(mockResponse);
    });
  });

  describe('changePassword', () => {
    it('should POST to /api/auth/change-password', () => {
      const mockResponse = { token: 'newtoken', message: 'Password changed successfully' };
      service.changePassword('newpass').subscribe((res) => {
        expect(res.message).toBe('Password changed successfully');
      });

      const req = httpMock.expectOne('/api/auth/change-password');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ newPassword: 'newpass' });
      req.flush(mockResponse);
    });
  });

  describe('searchTMDB', () => {
    it('should GET /api/search with query param', () => {
      const mockResponse = { results: [{ id: 1, title: 'Fight Club' }] };
      service.searchTMDB('fight').subscribe((res) => {
        expect(res.results.length).toBe(1);
        expect(res.results[0].title).toBe('Fight Club');
      });

      const req = httpMock.expectOne('/api/search?query=fight');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should encode special characters in query', () => {
      service.searchTMDB('hello world').subscribe();
      const req = httpMock.expectOne('/api/search?query=hello%20world');
      req.flush({ results: [] });
    });
  });

  describe('catalog operations', () => {
    it('should GET catalog', () => {
      service.getCatalog().subscribe((res) => {
        expect(res.catalog).toEqual([]);
      });
      const req = httpMock.expectOne('/api/catalog');
      expect(req.request.method).toBe('GET');
      req.flush({ catalog: [] });
    });

    it('should POST add to catalog', () => {
      service.addToCatalog(550, 'movie').subscribe();
      const req = httpMock.expectOne('/api/catalog/add');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ tmdb_id: 550, type: 'movie' });
      req.flush({ media: { id: 1 } });
    });

    it('should DELETE from catalog', () => {
      service.removeFromCatalog(1).subscribe();
      const req = httpMock.expectOne('/api/catalog/1');
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });

  describe('progress', () => {
    it('should POST save progress', () => {
      service.saveProgress(1, undefined, 120, 8000).subscribe();
      const req = httpMock.expectOne('/api/progress');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ mediaId: 1, episodeId: undefined, stoppedAtSeconds: 120, duration: 8000 });
      req.flush({ saved: true });
    });

    it('should GET progress for media', () => {
      service.getProgress(1).subscribe((res) => {
        expect(res.progress).toBeDefined();
      });
      const req = httpMock.expectOne('/api/progress/1');
      expect(req.request.method).toBe('GET');
      req.flush({ progress: { stopped_at_seconds: 200 } });
    });
  });

  describe('settings', () => {
    it('should GET settings', () => {
      service.getSettings().subscribe((res) => {
        expect(res.settings).toBeDefined();
      });
      const req = httpMock.expectOne('/api/settings');
      req.flush({ settings: { subtitle_language: ['en'] } });
    });

    it('should PUT settings', () => {
      const settings = { subtitle_language: ['en', 'pt'] };
      service.updateSettings(settings).subscribe();
      const req = httpMock.expectOne('/api/settings');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ settings });
      req.flush({ success: true });
    });
  });

  describe('downloads', () => {
    it('should POST start download', () => {
      service.startDownload(1).subscribe();
      const req = httpMock.expectOne('/api/download/start/1');
      expect(req.request.method).toBe('POST');
      req.flush({ started: true });
    });

    it('should GET download status', () => {
      service.getDownloadStatus().subscribe((res) => {
        expect(res.downloads).toBeDefined();
      });
      const req = httpMock.expectOne('/api/download/status');
      req.flush({ downloads: [] });
    });
  });

  describe('users', () => {
    it('should GET users', () => {
      service.getUsers().subscribe((res) => {
        expect(res.length).toBe(1);
      });
      const req = httpMock.expectOne('/api/users');
      req.flush([{ id: 1, username: 'admin' }]);
    });

    it('should POST create user', () => {
      service.createUser('test', 'pass', 'user').subscribe();
      const req = httpMock.expectOne('/api/users');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ username: 'test', password: 'pass', role: 'user' });
      req.flush({ id: 2, username: 'test' });
    });

    it('should DELETE user', () => {
      service.deleteUser(2).subscribe();
      const req = httpMock.expectOne('/api/users/2');
      expect(req.request.method).toBe('DELETE');
      req.flush({ success: true });
    });
  });
});
