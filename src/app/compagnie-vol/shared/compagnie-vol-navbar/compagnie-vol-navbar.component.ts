import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-compagnie-vol-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './compagnie-vol-navbar.component.html',
  styleUrls: ['./compagnie-vol-navbar.component.css']
})
export class CompagnieVolNavbarComponent {
  constructor(private readonly authService: AuthService) {}

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

  logout(): void {
    this.authService.logout();
  }
}
