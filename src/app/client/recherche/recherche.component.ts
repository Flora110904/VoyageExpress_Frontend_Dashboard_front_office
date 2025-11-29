import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ItineraireServiceApi } from '../../services/itineraire.service';
import { LocalServiceApi } from '../../services/local.service';
import { ItineraireResponse, LocalResponse, ReservationRequest, ReservationResponse, TypeCompagnie } from '../../models';
import { ReservationServiceApi } from '../../services/reservation.service';
import { AuthService } from '../../services/auth.service';

type SearchType = 'tous' | 'vol' | 'bus' | 'hebergement';

@Component({
  selector: 'app-recherche',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recherche.component.html',
  styleUrls: ['./recherche.component.css']
})
export class RechercheComponent implements OnInit {
  searchType: SearchType = 'tous';
  
  // Critères de recherche
  villeDepart = '';
  villeArrivee = '';
  nombrePassagers = 1;
  dateDepart = '';
  dateRetour = '';
  typeLocal = '';
  
  // Résultats
  itineraires: ItineraireResponse[] = [];
  locaux: LocalResponse[] = [];
  loading = false;
  errorMessage = '';
  
  // Liste des villes populaires pour autocomplete
  villesPopulaires = [
    'Yaoundé', 'Douala', 'Bafoussam', 'Garoua', 'Maroua',
    'Bamenda', 'Ngaoundéré', 'Bertoua', 'Ebolowa', 'Kribi'
  ];

  creatingReservation = false;

  showReservationModal = false;
  selectedItem: ItineraireResponse | LocalResponse | null = null;
  selectedSeats = 1;
  reservationModalError = '';

  constructor(
    private itineraireService: ItineraireServiceApi,
    private localService: LocalServiceApi,
    private reservationService: ReservationServiceApi,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    // Charger résultats initiaux
    this.search();
  }

  selectSearchType(type: SearchType) {
    this.searchType = type;
    this.search();
  }

  search() {
    this.loading = true;
    this.errorMessage = '';
    this.resetResults();

    if (this.searchType === 'hebergement') {
      this.searchHebergements();
    } else {
      this.searchItineraires();
    }
  }

  private searchItineraires() {
    const params: any = {};
    if (this.villeDepart) params.villeDepart = this.villeDepart;
    if (this.villeArrivee) params.villeArrivee = this.villeArrivee;
    this.itineraireService.search(params).subscribe({
      next: (results) => {
        const passengers = Math.max(1, this.nombrePassagers || 1);
        const filteredResults = results.filter((itinerary) => {
          const available = itinerary.placeDisponible ?? 0;
          return available >= passengers;
        });

        let typedResults = filteredResults;
        if (this.searchType === 'vol') {
          typedResults = filteredResults.filter((itinerary) => itinerary.compagnieType === TypeCompagnie.AEROPORT);
        } else if (this.searchType === 'bus') {
          typedResults = filteredResults.filter((itinerary) => itinerary.compagnieType === TypeCompagnie.STATION);
        }

        this.itineraires = typedResults;
        this.loading = false;
        if (typedResults.length === 0) {
          this.errorMessage = 'Aucun itinéraire trouvé pour ces critères.';
        }
      },
      error: (err) => {
        console.error('Erreur de recherche:', err);
        this.errorMessage = 'Erreur lors de la recherche. Veuillez réessayer.';
        this.loading = false;
      }
    });
  }

  private searchHebergements() {
    const params: any = {};
    if (this.typeLocal) params.type = this.typeLocal;

    this.localService.search(params).subscribe({
      next: (results) => {
        this.locaux = results;
        this.loading = false;
        if (results.length === 0) {
          this.errorMessage = 'Aucun hébergement trouvé pour ces critères.';
        }
      },
      error: (err) => {
        console.error('Erreur de recherche:', err);
        this.errorMessage = 'Erreur lors de la recherche. Veuillez réessayer.';
        this.loading = false;
      }
    });
  }

  private resetResults() {
    this.itineraires = [];
    this.locaux = [];
    this.errorMessage = '';
  }

  viewDetails(item: ItineraireResponse | LocalResponse) {
    const trackingId = item.trackingId;
    if (this.searchType === 'hebergement') {
      this.router.navigate(['/client/hebergement', trackingId]);
    } else {
      this.router.navigate(['/client/itineraire', trackingId]);
    }
  }

  reserver(item: ItineraireResponse | LocalResponse) {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }

    this.selectedItem = item;
    this.reservationModalError = '';

    if ('placeDisponible' in item) {
      const placesDisponibles = item.placeDisponible ?? 0;
      this.selectedSeats = Math.max(1, Math.min(this.nombrePassagers || 1, placesDisponibles || 1));
    } else {
      this.selectedSeats = Math.max(1, this.nombrePassagers || 1);
    }

    this.showReservationModal = true;
  }

  confirmReservation() {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !this.selectedItem) {
      this.showReservationModal = false;
      return;
    }

    const itinerary = this.selectedItem as ItineraireResponse;
    const montantUnitaire = itinerary.prix ?? 0;
    if (!montantUnitaire || montantUnitaire <= 0) {
      this.reservationModalError = "Impossible de créer la réservation : montant indisponible.";
      return;
    }

    const placesDisponibles = itinerary.placeDisponible ?? 0;
    const nombrePlaces = this.selectedSeats;

    if (!Number.isInteger(nombrePlaces) || nombrePlaces <= 0) {
      this.reservationModalError = 'Nombre de places invalide. Veuillez saisir un entier positif.';
      return;
    }

    if (placesDisponibles > 0 && nombrePlaces > placesDisponibles) {
      this.reservationModalError = `Nombre de places demandé supérieur aux places disponibles (${placesDisponibles}).`;
      return;
    }

    const montantTotal = montantUnitaire * nombrePlaces;

    const payload: ReservationRequest = {
      statut: 'EN_ATTENTE_PAIEMENT',
      dateReservation: new Date().toISOString(),
      userTrackingId: currentUser.trackingId,
      itineraireTrackingId: 'villeDepart' in this.selectedItem && 'villeArrivee' in this.selectedItem
        ? this.selectedItem.trackingId
        : undefined,
      montantTotal,
      description: this.buildDescription(this.selectedItem, nombrePlaces)
    };

    this.creatingReservation = true;
    this.errorMessage = '';
    this.reservationModalError = '';

    this.reservationService.create(payload).subscribe({
      next: (reservation) => {
        this.showReservationModal = false;
        this.handleReservationSuccess(reservation);
      },
      error: (err) => {
        this.showReservationModal = false;
        this.handleReservationError(err);
      }
    });
  }

  closeReservationModal() {
    this.showReservationModal = false;
    this.selectedItem = null;
    this.selectedSeats = 1;
    this.reservationModalError = '';
  }

  private buildDescription(item: ItineraireResponse | LocalResponse, nombrePlaces?: number): string {
    const suffixePlaces = nombrePlaces && nombrePlaces > 0 ? ` (${nombrePlaces} place(s))` : '';

    if (this.searchType === 'hebergement' && 'description' in item) {
      return `Réservation hébergement ${item.description ?? ''}${suffixePlaces}`;
    }

    if ('villeDepart' in item && 'villeArrivee' in item) {
      return `Réservation trajet ${item.villeDepart} -> ${item.villeArrivee}${suffixePlaces}`;
    }

    return `Réservation VoyageExpress${suffixePlaces}`;
  }

  private handleReservationSuccess(reservation: ReservationResponse) {
    this.creatingReservation = false;
    if (reservation.paymentUrl) {
      window.location.href = reservation.paymentUrl;
    } else {
      this.errorMessage = "Réservation créée mais aucun lien de paiement n'a été fourni.";
    }
  }

  private handleReservationError(err: unknown) {
    console.error('Erreur lors de la création de la réservation :', err);
    this.creatingReservation = false;
    this.errorMessage = "Impossible de créer la réservation. Veuillez réessayer.";
  }

  getItineraryBadge(itinerary: ItineraireResponse): string {
    if (itinerary.compagnieType === TypeCompagnie.AEROPORT) {
      return 'Vol';
    }
    if (itinerary.compagnieType === TypeCompagnie.STATION) {
      return 'Bus';
    }
    return 'Itinéraire';
  }

  resetFilters() {
    this.villeDepart = '';
    this.villeArrivee = '';
    this.nombrePassagers = 1;
    this.dateDepart = '';
    this.dateRetour = '';
    this.typeLocal = '';
    this.search();
  }
}
