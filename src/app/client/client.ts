import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-client',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './client.html',
  styleUrls: ['./client.css']
})
export class ClientComponent {
  currentPage: string = 'client';

  constructor() {
    // Set current page based on route if needed
    this.currentPage = this.getCurrentPageFromRoute();
  }

  private getCurrentPageFromRoute(): string {
    // This could be enhanced to detect the current route
    return 'client';
  }
}
