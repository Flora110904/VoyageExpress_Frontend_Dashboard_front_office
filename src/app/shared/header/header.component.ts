import { Component, Input, NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

interface NavItem {
  label: string;
  link: string;
  icon: string;
  active?: boolean;
}

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Input() currentPage: string = 'home';

  getNavItems(): NavItem[] {
    const baseItems: NavItem[] = [
      { label: 'Accueil', link: '/', icon: 'fa-home' },
      { label: 'À Propos', link: '/about', icon: 'fa-info-circle' },
      { label: 'Services', link: '/services', icon: 'fa-list' },
      { label: 'Contact', link: '/contact', icon: 'fa-phone' }
    ];

    // Ajouter des éléments spécifiques selon la page
    if (this.currentPage === 'home') {
      return [
        { label: 'Accueil', link: '/', icon: 'fa-home', active: true },
        ...baseItems.slice(1)
      ];
    } else if (this.currentPage === 'about') {
      return [
        { label: 'Accueil', link: '/', icon: 'fa-home' },
        { label: 'À Propos', link: '/about', icon: 'fa-info-circle', active: true },
        { label: 'Services', link: '/services', icon: 'fa-list' },
        { label: 'Contact', link: '/contact', icon: 'fa-phone' }
      ];
    } else if (this.currentPage === 'services') {
      return [
        { label: 'Accueil', link: '/', icon: 'fa-home' },
        { label: 'Services', link: '/services', icon: 'fa-list', active: true },
        { label: 'À Propos', link: '/about', icon: 'fa-info-circle' },
        { label: 'Contact', link: '/contact', icon: 'fa-phone' }
      ];
    } else if (this.currentPage === 'contact') {
      return [
        { label: 'Accueil', link: '/', icon: 'fa-home' },
        { label: 'Contact', link: '/contact', icon: 'fa-phone', active: true }
      ];
    }

    return baseItems;
  }
}
