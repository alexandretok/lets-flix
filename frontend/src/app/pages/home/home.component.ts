import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-home',
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
})
export class HomeComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  trendingMovies: any[] = [];
  trendingTv: any[] = [];
  loading = true;

  ngOnInit(): void {
    this.api.getTrending().subscribe({
      next: (res) => {
        this.trendingMovies = res.movies;
        this.trendingTv = res.tv;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  openSearch(title: string): void {
    this.router.navigate(['/search'], { queryParams: { q: title } });
  }
}
