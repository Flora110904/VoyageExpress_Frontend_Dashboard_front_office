import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ClientNavbarComponent } from './shared/client-navbar/client-navbar.component';

@Component({
  selector: 'app-client',
  standalone: true,
  imports: [CommonModule, RouterModule, ClientNavbarComponent],
  templateUrl: './client.html',
  styleUrls: ['./client.css']
})
export class ClientComponent {
  currentPage: string = 'client';

  constructor(private readonly authService: AuthService) {
    this.currentPage = this.getCurrentPageFromRoute();
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

  logout(): void {
    this.authService.logout();
  }

  private getCurrentPageFromRoute(): string {
    return 'client';
  }
}
