import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ReservationServiceApi } from '../../services/reservation.service';
import { AuthService } from '../../services/auth.service';
import { ReservationResponse } from '../../models';
import { FooterComponent } from '../../shared/components/footer/footer.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-dashboard-client',
  standalone: true,
  imports: [CommonModule, RouterModule, FooterComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardClientComponent implements OnInit, OnDestroy {
  loading = true;
  error: string | null = null;
  reservations: ReservationResponse[] = [];
  reservationsAVenir: ReservationResponse[] = [];
  reservationsPassees: ReservationResponse[] = [];
  
  stats = {
    total: 0,
    aVenir: 0,
    terminees: 0,
    annulees: 0
  };

  userInfo: any = null;

  private subscriptions = new Subscription();

  constructor(
    private reservationService: ReservationServiceApi,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.subscriptions.add(
      this.authService.currentUser.subscribe((user: any) => {
        this.userInfo = user;
        if (user && user.trackingId) {
          this.loadReservations(user.trackingId);
        } else {
          this.loading = false;
          this.error = "Impossible de récupérer les informations de l'utilisateur.";
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadReservations(userTrackingId: string) {
    this.loading = true;
    this.error = null;
    this.reservationService.listByUser(userTrackingId).subscribe({
      next: (reservations) => {
        this.reservations = reservations;
        this.calculateStats();
        this.filterReservations();
        this.loading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des réservations:', err);
        this.loading = false;
        this.error = "Impossible de charger vos réservations. Merci de réessayer.";
      }
    });
  }

  calculateStats() {
    this.stats.total = this.reservations.length;
    this.stats.aVenir = this.reservations.filter(r => 
      r.statut === 'EN_ATTENTE' || r.statut === 'CONFIRMEE' || r.statut === 'EN_ATTENTE_PAIEMENT'
    ).length;
    this.stats.terminees = this.reservations.filter(r => 
      r.statut === 'TERMINEE'
    ).length;
    this.stats.annulees = this.reservations.filter(r => 
      r.statut === 'ANNULEE'
    ).length;
  }

  filterReservations() {
    const now = new Date();
    
    this.reservationsAVenir = this.reservations
      .filter(r => {
        const dateRes = new Date(r.dateReservation);
        return dateRes >= now && (r.statut === 'EN_ATTENTE' || r.statut === 'CONFIRMEE' || r.statut === 'EN_ATTENTE_PAIEMENT');
      })
      .sort((a, b) => new Date(a.dateReservation).getTime() - new Date(b.dateReservation).getTime())
      .slice(0, 5);

    this.reservationsPassees = this.reservations
      .filter(r => {
        const dateRes = new Date(r.dateReservation);
        return dateRes < now || r.statut === 'TERMINEE';
      })
      .sort((a, b) => new Date(b.dateReservation).getTime() - new Date(a.dateReservation).getTime())
      .slice(0, 5);
  }

  getStatutClass(statut: string): string {
    switch (statut) {
      case 'CONFIRMEE': return 'badge-success';
      case 'EN_ATTENTE':
      case 'EN_ATTENTE_PAIEMENT':
        return 'badge-warning';
      case 'ANNULEE': return 'badge-danger';
      case 'TERMINEE': return 'badge-secondary';
      default: return 'badge-info';
    }
  }

  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'CONFIRMEE': return 'Confirmée';
      case 'EN_ATTENTE': return 'En attente';
      case 'EN_ATTENTE_PAIEMENT': return 'En attente de paiement';
      case 'ANNULEE': return 'Annulée';
      case 'TERMINEE': return 'Terminée';
      default: return statut;
    }
  }

  get userGreeting(): string {
    if (!this.userInfo) {
      return 'Voyageur';
    }
    const { prenom, nom } = this.userInfo;
    return [prenom, nom].filter(Boolean).join(' ') || this.userInfo.email || 'Voyageur';
  }

  viewReservation(reservation: ReservationResponse) {
    this.router.navigate(['/client/reservation', reservation.trackingId]);
  }

  rechercherVoyage() {
    this.router.navigate(['/client/recherche']);
  }

  voirToutesReservations() {
    this.router.navigate(['/client/mes-reservations']);
  }

  downloadTicket(reservation: ReservationResponse) {
    this.reservationService.downloadTicketHebergement(reservation.trackingId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ticket-${reservation.trackingId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('Erreur lors du téléchargement du ticket:', err);
      }
    });
  }

  trackReservation(_index: number, reservation: ReservationResponse): string {
    return reservation?.trackingId ?? `${_index}`;
  }
}
