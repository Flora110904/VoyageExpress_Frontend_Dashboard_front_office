import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ItineraireResponse, TypeCompagnie } from '../../models';
import { AuthService, CompagnieServiceApi, ItineraireServiceApi } from '../../services';
import { CompagnieVolNavbarComponent } from '../shared/compagnie-vol-navbar/compagnie-vol-navbar.component';
import { ItineraireFormModalComponent } from '../../compagnie-bus/itineraires/itineraire-form-modal.component';

@Component({
  selector: 'app-vols',
  standalone: true,
  imports: [CommonModule, FormsModule, CompagnieVolNavbarComponent, ItineraireFormModalComponent],
  templateUrl: './vols.html',
  styleUrl: './vols.css'
})
export class Vols implements OnInit, OnDestroy {
  isLoading = false;
  error: string | null = null;

  itineraires: ItineraireResponse[] = [];
  filteredItineraires: ItineraireResponse[] = [];
  isCreateModalOpen = false;

  searchTerm = '';
  filterType: 'all' | 'upcoming' | 'past' = 'all';

  private subscriptions = new Subscription();

  constructor(
    private readonly itineraireService: ItineraireServiceApi,
    private readonly authService: AuthService,
    private readonly compagnieService: CompagnieServiceApi
  ) {}

  ngOnInit(): void {
    this.loadItineraires();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn;
  }

  logout(): void {
    this.authService.logout();
  }

  get totalItineraries(): number {
    return this.itineraires.length;
  }

  get upcomingItineraryCount(): number {
    return this.itineraires.filter((itinerary) => this.isUpcoming(itinerary)).length;
  }

  get pastItineraryCount(): number {
    return this.itineraires.filter((itinerary) => this.isPast(itinerary)).length;
  }

  trackItinerary(_index: number, itinerary: ItineraireResponse): string {
    return itinerary?.trackingId ?? `${_index}`;
  }

  onSearch(term: string): void {
    this.searchTerm = term;
    this.applyFilters();
  }

  setFilter(type: 'all' | 'upcoming' | 'past'): void {
    if (this.filterType === type) {
      return;
    }
    this.filterType = type;
    this.applyFilters();
  }

  retry(): void {
    this.subscriptions.unsubscribe();
    this.subscriptions = new Subscription();
    this.loadItineraires();
  }

  refresh(): void {
    this.loadItineraires();
  }

  openCreateItinerary(): void {
    this.isCreateModalOpen = true;
  }

  onItineraryModalClosed(): void {
    this.isCreateModalOpen = false;
  }

  onItinerarySaved(): void {
    this.isCreateModalOpen = false;
    this.loadItineraires();
  }

  formatRoute(itinerary: ItineraireResponse): string {
    return `${itinerary.villeDepart} → ${itinerary.villeArrivee}`;
  }

  formatDate(itinerary: ItineraireResponse): string {
    const departure = this.getItineraryDateTime(itinerary);
    if (!departure) {
      return 'Date à confirmer';
    }
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(departure);
  }

  formatTime(itinerary: ItineraireResponse): string {
    const departure = this.getItineraryDateTime(itinerary);
    if (!departure) {
      return '--:--';
    }
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }).format(departure);
  }

  formatPrice(itinerary: ItineraireResponse): string {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(itinerary.prix ?? 0);
  }

  getAvailabilityBadgeClass(itinerary: ItineraireResponse): string {
    const seats = itinerary.placeDisponible ?? 0;
    if (seats === 0) {
      return 'bg-danger';
    }

    if (seats <= 5) {
      return 'bg-warning text-dark';
    }

    return 'bg-success';
  }

  getAvailabilityLabel(itinerary: ItineraireResponse): string {
    const seats = itinerary.placeDisponible ?? 0;
    if (seats === 0) {
      return 'Complet';
    }
    return `${seats} place${seats > 1 ? 's' : ''} restantes`;
  }

  private loadItineraires(): void {
    this.isLoading = true;
    this.error = null;

    const currentUser = this.authService.currentUserValue;
    if (!currentUser?.trackingId) {
      this.error = "Impossible d'identifier la compagnie connectée.";
      this.resetItineraries();
      return;
    }

    const compagnieSub = this.compagnieService.getByProprietaire(currentUser.trackingId).subscribe({
      next: (compagnie) => {
        const compagnieTrackingId = compagnie?.trackingId;
        if (!compagnieTrackingId) {
          this.error = "Aucune compagnie aérienne associée à ce compte.";
          this.resetItineraries();
          return;
        }

        const itinerairesSub = this.itineraireService.listByCompagnie(compagnieTrackingId).subscribe({
          next: (response) => {
            const onlyFlights = (response ?? []).filter((itinerary) => itinerary.compagnieType === TypeCompagnie.AEROPORT);
            this.itineraires = onlyFlights;
            this.applyFilters();
            this.isLoading = false;
          },
          error: (err) => {
            console.error('Erreur lors du chargement des itinéraires:', err);
            this.error = 'Impossible de récupérer la liste des vols pour le moment.';
            this.resetItineraries();
          }
        });

        this.subscriptions.add(itinerairesSub);
      },
      error: (err) => {
        console.error('Erreur lors de la récupération de la compagnie:', err);
        this.error = "Impossible de déterminer la compagnie associée.";
        this.resetItineraries();
      }
    });

    this.subscriptions.add(compagnieSub);
  }

  private resetItineraries(): void {
    this.itineraires = [];
    this.filteredItineraires = [];
    this.isLoading = false;
  }

  private applyFilters(): void {
    const term = this.searchTerm.trim().toLowerCase();
    const now = new Date();

    let filtered = [...this.itineraires];

    if (term) {
      filtered = filtered.filter((itinerary) => {
        const depart = itinerary.villeDepart?.toLowerCase() ?? '';
        const arrivee = itinerary.villeArrivee?.toLowerCase() ?? '';
        return depart.includes(term) || arrivee.includes(term);
      });
    }

    if (this.filterType === 'upcoming') {
      filtered = filtered.filter((itinerary) => {
        const departure = this.getItineraryDateTime(itinerary);
        return departure ? departure >= now : false;
      });
    } else if (this.filterType === 'past') {
      filtered = filtered.filter((itinerary) => {
        const departure = this.getItineraryDateTime(itinerary);
        return departure ? departure < now : false;
      });
    }

    this.filteredItineraires = filtered;
  }

  private isUpcoming(itinerary: ItineraireResponse): boolean {
    const departure = this.getItineraryDateTime(itinerary);
    return departure ? departure >= new Date() : false;
  }

  private isPast(itinerary: ItineraireResponse): boolean {
    const departure = this.getItineraryDateTime(itinerary);
    return departure ? departure < new Date() : false;
  }

  private getItineraryDateTime(itinerary: ItineraireResponse): Date | null {
    if (!itinerary?.dateDepart) {
      return null;
    }

    const time = itinerary.heureDepart ? `${itinerary.heureDepart}:00` : '00:00:00';
    const isoString = `${itinerary.dateDepart}T${time}`;
    const date = new Date(isoString);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  }
}
