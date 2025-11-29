import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-etablisement-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './etablisement-navbar.component.html',
  styleUrls: ['./etablisement-navbar.component.css']
})
export class EtablisementNavbarComponent {
  constructor(private readonly authService: AuthService) {}

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

  logout(): void {
    this.authService.logout();
  }
}
