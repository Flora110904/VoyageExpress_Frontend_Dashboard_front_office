import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-compagnie-bus-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './compagnie-bus-navbar.component.html',
  styleUrls: ['./compagnie-bus-navbar.component.css']
})
export class CompagnieBusNavbarComponent {
  constructor(private readonly authService: AuthService) {}

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

  logout(): void {
    this.authService.logout();
  }
}
