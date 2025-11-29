import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FooterComponent } from '../../shared/components/footer/footer.component';

@Component({
  selector: 'app-recherche',
  standalone: true,
  imports: [CommonModule, RouterModule, FooterComponent],
  templateUrl: './recherche.html',
  styleUrl: './recherche.css'
})
export class Recherche {

}
