import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ItineraireServiceApi } from '../../services/itineraire.service';
import { LocalServiceApi } from '../../services/local.service';
import {
  ItineraireResponse,
  LocalResponse,
  ReservationRequest,
  ReservationResponse,
  SeatAvailabilityResponse,
  SeatSelectionRequest,
  TypeCompagnie,
  CompagnieResponse
} from '../../models';
import { ReservationServiceApi } from '../../services/reservation.service';
import { AuthService } from '../../services/auth.service';
import { ReservationWizardStep } from './reservation-wizard-step.enum';
import { CompagnieServiceApi } from '../../services/compagnie.service';
import { PaymentCheckoutDialogComponent } from '../../shared/components/payment-checkout-dialog/payment-checkout-dialog.component';

type SearchType = 'tous' | 'vol' | 'bus' | 'hebergement';

@Component({
  selector: 'app-recherche',
  standalone: true,
  imports: [CommonModule, FormsModule, PaymentCheckoutDialogComponent],
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
  sortByPrice = false;
  sortOrder: 'asc' | 'desc' = 'asc';
  
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

  compagnies: CompagnieResponse[] = [];
  selectedCompagnieId = '';
  compagnieNomQuery = '';

  creatingReservation = false;

  showReservationModal = false;
  selectedItem: ItineraireResponse | LocalResponse | null = null;
  selectedSeats = 1;
  selectedClass: string = 'ECONOMIQUE';
  currentUnitPrice: number | null = null;
  reservationModalError = '';
  bagageSupplementaireKg: number | null = null;
  freightPricePreview: number | null = null;
  freightError: string | null = null;
  seatAvailability: SeatAvailabilityResponse[] = [];
  seatAvailabilityLoading = false;
  seatAvailabilityError: string | null = null;
  hasGeneratedSeatLayout = false;
  selectedSeatIds: string[] = [];
  currentStep: ReservationWizardStep = ReservationWizardStep.DETAILS;
  readonly ReservationWizardStep = ReservationWizardStep;

  showPaymentDialog = false;
  paymentDialogReservation: ReservationResponse | null = null;
  paymentDialogUrl: string | null = null;

  readonly flightClassOptions = [
    { value: 'ECONOMIQUE', label: 'Économique', multiplier: 1.0 },
    { value: 'ECONOMIQUE_PREMIUM', label: 'Économique premium', multiplier: 1.2 },
    { value: 'AFFAIRES', label: 'Affaires', multiplier: 1.6 },
    { value: 'PREMIERE', label: 'Première classe', multiplier: 2.0 }
  ];

  constructor(
    private itineraireService: ItineraireServiceApi,
    private localService: LocalServiceApi,
    private reservationService: ReservationServiceApi,
    private authService: AuthService,
    private router: Router,
    private compagnieService: CompagnieServiceApi
  ) {}

  ngOnInit() {
    // Charger résultats initiaux
    this.search();
    this.loadCompagnies();
  }

  private loadCompagnies(): void {
    this.compagnieService.list().subscribe({
      next: (list) => {
        this.compagnies = list ?? [];
        if (this.itineraires.length) {
          this.itineraires = this.decorateWithCompagnieNames(this.itineraires);
        }
      },
      error: (error) => {
        console.error('Erreur lors du chargement des compagnies', error);
        this.compagnies = [];
      }
    });
  }

  goToNextStep(): void {
    if (!this.showReservationModal) {
      return;
    }

    if (this.currentStep === ReservationWizardStep.DETAILS) {
      if (!this.validateDetailsStep()) {
        return;
      }

      this.currentStep = this.isFlightSelection() ? ReservationWizardStep.SEAT_PLAN : ReservationWizardStep.BAGGAGE;
      this.reservationModalError = '';
      return;
    }

    if (this.currentStep === ReservationWizardStep.SEAT_PLAN) {
      if (!this.validateSeatStep()) {
        return;
      }

      this.currentStep = ReservationWizardStep.BAGGAGE;
      this.reservationModalError = '';
      return;
    }
  }

  goToPreviousStep(): void {
    if (!this.showReservationModal) {
      return;
    }

    const steps = this.getStepSequence();
    const currentIndex = steps.indexOf(this.currentStep);
    if (currentIndex > 0) {
      this.currentStep = steps[currentIndex - 1];
    }
  }

  get wizardSteps(): { key: ReservationWizardStep; label: string }[] {
    return this.getStepSequence().map((step) => ({
      key: step,
      label: this.getStepLabel(step)
    }));
  }

  get hasPreviousStep(): boolean {
    const steps = this.getStepSequence();
    return steps.indexOf(this.currentStep) > 0;
  }

  get hasNextStep(): boolean {
    const steps = this.getStepSequence();
    const currentIndex = steps.indexOf(this.currentStep);
    return currentIndex >= 0 && currentIndex < steps.length - 1;
  }

  get isLastStep(): boolean {
    return !this.hasNextStep;
  }

  isStepCompleted(step: ReservationWizardStep): boolean {
    const steps = this.getStepSequence();
    const stepIndex = steps.indexOf(step);
    const currentIndex = steps.indexOf(this.currentStep);
    return stepIndex >= 0 && stepIndex < currentIndex;
  }

  private getStepSequence(): ReservationWizardStep[] {
    const steps = [ReservationWizardStep.DETAILS];
    if (this.isFlightSelection()) {
      steps.push(ReservationWizardStep.SEAT_PLAN);
    }
    steps.push(ReservationWizardStep.BAGGAGE);
    return steps;
  }

  private getStepLabel(step: ReservationWizardStep): string {
    switch (step) {
      case ReservationWizardStep.DETAILS:
        return 'Classe & passagers';
      case ReservationWizardStep.SEAT_PLAN:
        return 'Plan cabine';
      case ReservationWizardStep.BAGGAGE:
        return this.isFlightSelection() ? 'Bagages' : 'Résumé';
      default:
        return '';
    }
  }

  private validateDetailsStep(): boolean {
    this.reservationModalError = '';

    const seats = Number(this.selectedSeats);
    if (!Number.isInteger(seats) || seats <= 0) {
      this.reservationModalError = 'Veuillez saisir un nombre de places valide.';
      return false;
    }

    const itinerary = this.currentItinerary;
    if (itinerary && itinerary.placeDisponible != null && seats > itinerary.placeDisponible) {
      this.reservationModalError = `Nombre de places demandé supérieur aux places disponibles (${itinerary.placeDisponible}).`;
      return false;
    }

    const unitPrice = this.calculateUnitPrice();
    if (unitPrice <= 0) {
      this.reservationModalError = 'Le prix est indisponible pour cette sélection de classe.';
      return false;
    }

    return true;
  }

  private validateSeatStep(): boolean {
    this.reservationModalError = '';

    if (!this.isFlightSelection()) {
      return true;
    }

    if (this.seatAvailabilityLoading) {
      this.reservationModalError = 'Veuillez patienter, chargement des sièges en cours.';
      return false;
    }

    if (this.seatAvailabilityError) {
      this.reservationModalError = this.seatAvailabilityError;
      return false;
    }

    const expectedSeats = Math.max(1, Number(this.selectedSeats) || 0);
    if (this.selectedSeatIds.length !== expectedSeats) {
      this.reservationModalError = `Veuillez sélectionner ${expectedSeats} siège(s) correspondant à la classe choisie.`;
      return false;
    }

    return true;
  }

  private calculateUnitPrice(): number {
    const itinerary = this.currentItinerary;
    if (!itinerary) {
      this.currentUnitPrice = 0;
      return 0;
    }

    let price = itinerary.prix ?? 0;

    if (this.isFlightSelection()) {
      const normalizedClass = this.normalizeClass(this.selectedClass);
      price = this.resolveFlightClassPrice(itinerary, normalizedClass);
    }

    const rounded = price > 0 ? Number(price.toFixed(2)) : 0;
    this.currentUnitPrice = rounded;
    return rounded;
  }

  getUnitPriceForSelection(): number {
    if (this.currentUnitPrice != null && this.currentUnitPrice > 0) {
      return this.currentUnitPrice;
    }
    return this.calculateUnitPrice();
  }

  private resolveFlightClassPrice(itinerary: ItineraireResponse, normalizedClass: string): number {
    const baseEconomy = this.firstPositive(itinerary.prixEconomique, itinerary.prix ?? 0);
    const multiplierFallback = baseEconomy * this.getMultiplierForClass(normalizedClass);

    switch (normalizedClass) {
      case 'ECONOMIQUE':
        return baseEconomy;
      case 'ECONOMIQUE_PREMIUM':
        return this.firstPositive(itinerary.prixEconomiquePremium, multiplierFallback);
      case 'AFFAIRES':
        return this.firstPositive(itinerary.prixAffaires, multiplierFallback);
      case 'PREMIERE':
        return this.firstPositive(itinerary.prixPremiere, multiplierFallback);
      default:
        return baseEconomy;
    }
  }

  private firstPositive(value: number | null | undefined, fallback: number): number {
    if (value != null && value > 0) {
      return value;
    }
    return fallback;
  }

  private getMultiplierForClass(normalizedClass: string): number {
    if (normalizedClass === 'ECONOMIQUE') {
      return 1;
    }

    const option = this.flightClassOptions.find((opt) => opt.value === normalizedClass);
    return option?.multiplier ?? 1;
  }

  private normalizeClass(classe?: string | null): string {
    if (!classe) {
      return 'ECONOMIQUE';
    }

    return classe
      .trim()
      .toUpperCase()
      .replace(/\s+/g, '_');
  }

  getSelectedClassLabel(): string {
    const normalized = this.normalizeClass(this.selectedClass);
    return this.flightClassOptions.find((opt) => opt.value === normalized)?.label ?? 'Classe inconnue';
  }

  get seatDeckLayouts(): { deckLabel: string; rows: { label: string; seats: SeatAvailabilityResponse[] }[] }[] {
    if (!this.seatAvailability?.length) {
      return [];
    }

    const deckMap = new Map<string, SeatAvailabilityResponse[]>();

    for (const seat of this.seatAvailability) {
      const deckLabel = seat.deck?.trim() || 'Pont principal';
      if (!deckMap.has(deckLabel)) {
        deckMap.set(deckLabel, []);
      }
      deckMap.get(deckLabel)!.push(seat);
    }

    return Array.from(deckMap.entries())
      .map(([deckLabel, seats]) => ({
        deckLabel,
        rows: this.groupSeatsByRow(seats)
      }))
      .sort((a, b) => a.deckLabel.localeCompare(b.deckLabel));
  }

  private groupSeatsByRow(seats: SeatAvailabilityResponse[]): { label: string; seats: SeatAvailabilityResponse[] }[] {
    const rowMap = new Map<string, SeatAvailabilityResponse[]>();

    for (const seat of seats) {
      const rowKey = seat.rowNumber != null ? seat.rowNumber.toString() : this.extractRowKeyFromCode(seat.code);
      const safeKey = rowKey || 'NR';
      if (!rowMap.has(safeKey)) {
        rowMap.set(safeKey, []);
      }
      rowMap.get(safeKey)!.push(seat);
    }

    return Array.from(rowMap.entries())
      .map(([key, rowSeats]) => ({
        label: this.buildRowLabel(key, rowSeats),
        seats: rowSeats.sort((a, b) => this.compareSeatColumns(a, b))
      }))
      .sort((a, b) => this.compareRowLabels(a.label, b.label));
  }

  splitSeatsByAisle(
    seats: SeatAvailabilityResponse[] | null | undefined
  ): { left: SeatAvailabilityResponse[]; right: SeatAvailabilityResponse[] } | null {
    if (!seats || !seats.length) {
      return null;
    }

    const sortedSeats = seats
      .slice()
      .map((seat) => ({ ...seat, columnLabel: seat.columnLabel ?? '' }))
      .sort((a, b) => a.columnLabel.localeCompare(b.columnLabel));

    const midpoint = Math.ceil(sortedSeats.length / 2);
    return {
      left: sortedSeats.slice(0, midpoint),
      right: sortedSeats.slice(midpoint)
    };
  }

  getRowCabinClass(row: { seats: SeatAvailabilityResponse[] }): string | null {
    if (!row?.seats?.length) {
      return null;
    }

    const classes = row.seats
      .map((seat) => this.normalizeClass(seat.classe))
      .filter((classe) => !!classe);

    const priority = ['PREMIERE', 'AFFAIRES', 'ECONOMIQUE_PREMIUM', 'ECONOMIQUE'];
    const matched = priority.find((target) => classes.includes(target));
    return matched ? `cabin-zone cabin-zone--${matched.toLowerCase()}` : null;
  }

  private extractRowKeyFromCode(code?: string): string | null {
    if (!code) {
      return null;
    }
    const match = code.match(/\d+/);
    return match ? match[0] : null;
  }

  private buildRowLabel(key: string, seats: SeatAvailabilityResponse[]): string {
    const rowNumber = seats.find((seat) => seat.rowNumber != null)?.rowNumber;
    if (rowNumber != null) {
      return rowNumber.toString();
    }

    const numericKey = key && key !== 'NR' ? key : this.extractRowKeyFromCode(seats[0]?.code);
    return numericKey ?? '—';
  }

  private compareSeatColumns(a: SeatAvailabilityResponse, b: SeatAvailabilityResponse): number {
    const colA = a.columnLabel?.trim() || a.code || '';
    const colB = b.columnLabel?.trim() || b.code || '';
    return colA.localeCompare(colB, undefined, { numeric: true, sensitivity: 'base' });
  }

  private compareRowLabels(labelA: string, labelB: string): number {
    const numericA = parseInt(labelA, 10);
    const numericB = parseInt(labelB, 10);

    const isNumericA = !isNaN(numericA);
    const isNumericB = !isNaN(numericB);

    if (isNumericA && isNumericB) {
      return numericA - numericB;
    }

    if (isNumericA) {
      return -1;
    }

    if (isNumericB) {
      return 1;
    }

    return labelA.localeCompare(labelB, undefined, { numeric: true, sensitivity: 'base' });
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
    if (this.selectedCompagnieId) {
      params.compagnieId = this.selectedCompagnieId;
    } else if (this.compagnieNomQuery) {
      params.compagnieNom = this.compagnieNomQuery;
    }
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

        let compagnieFiltered = typedResults;
        if (this.selectedCompagnieId) {
          compagnieFiltered = compagnieFiltered.filter((itinerary) => itinerary.compagnieTrackingId === this.selectedCompagnieId);
        } else if (this.compagnieNomQuery) {
          const normalized = this.compagnieNomQuery.trim().toLowerCase();
          compagnieFiltered = compagnieFiltered.filter((itinerary) =>
            (itinerary.compagnieNom ?? '').toLowerCase().includes(normalized)
          );
        }

        this.itineraires = this.decorateWithCompagnieNames(compagnieFiltered);
        this.loading = false;
        if (compagnieFiltered.length === 0) {
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

  resetFilters(): void {
    this.villeDepart = '';
    this.villeArrivee = '';
    this.nombrePassagers = 1;
    this.dateDepart = '';
    this.dateRetour = '';
    this.typeLocal = '';
    this.selectedCompagnieId = '';
    this.compagnieNomQuery = '';
    this.search();
  }

  private searchHebergements() {
    const params: any = {};
    if (this.typeLocal) params.type = this.typeLocal;

    this.localService.search(params).subscribe({
      next: (results) => {
        this.locaux = results;
        this.sortAccommodationsByPrice();
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

  private sortAccommodationsByPrice(): void {
    if (!this.sortByPrice) return;
    
    this.locaux.sort((a, b) => {
      const priceA = a.tarifPrixTtc ?? 0;
      const priceB = b.tarifPrixTtc ?? 0;
      return this.sortOrder === 'asc' ? priceA - priceB : priceB - priceA;
    });
  }

  togglePriceSort(): void {
    this.sortByPrice = !this.sortByPrice;
    if (this.sortByPrice) {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    }
    this.sortAccommodationsByPrice();
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

    this.selectedClass = 'ECONOMIQUE';
    this.currentUnitPrice = null;
    this.calculateUnitPrice();
    this.resetSeatSelections();
    this.resetFreightInputs();
    this.currentStep = ReservationWizardStep.DETAILS;

    if (this.isFlightSelection()) {
      this.loadSeatAvailability();
    } else {
      this.seatAvailability = [];
      this.seatAvailabilityError = null;
      this.seatAvailabilityLoading = false;
    }

    this.showReservationModal = true;
  }

  confirmReservation() {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser || !this.selectedItem) {
      this.showReservationModal = false;
      return;
    }

    this.reservationModalError = '';
    this.freightError = null;

    const itinerary = this.currentItinerary;
    if (!this.validateDetailsStep()) {
      this.currentStep = ReservationWizardStep.DETAILS;
      return;
    }

    const nombrePlaces = Math.max(1, this.selectedSeats || 0);
    if (!Number.isInteger(nombrePlaces) || nombrePlaces <= 0) {
      this.reservationModalError = 'Nombre de places invalide. Veuillez saisir un entier positif.';
      return;
    }

    if (this.isFlightSelection() && !this.validateSeatStep()) {
      this.currentStep = ReservationWizardStep.SEAT_PLAN;
      return;
    }

    const placesDisponibles = itinerary?.placeDisponible ?? 0;
    if (itinerary && placesDisponibles > 0 && nombrePlaces > placesDisponibles) {
      this.reservationModalError = `Nombre de places demandé supérieur aux places disponibles (${placesDisponibles}).`;
      return;
    }

    const freightEvaluation = this.computeFreightForReservation(itinerary, { emitError: true });
    if (!freightEvaluation) {
      return;
    }

    const { cost: freightCost, weight: extraWeight } = freightEvaluation;
    this.freightPricePreview = freightCost > 0 ? freightCost : null;

    const seatPayload = this.buildSeatPayload(nombrePlaces);
    const unitPrice = this.getUnitPriceForSelection();
    if (!unitPrice || unitPrice <= 0) {
      this.reservationModalError = "Impossible de calculer le prix de la réservation.";
      this.currentStep = ReservationWizardStep.DETAILS;
      return;
    }

    const montantTotal = unitPrice * nombrePlaces + freightCost;

    const payload: ReservationRequest = {
      statut: 'EN_ATTENTE_PAIEMENT',
      dateReservation: new Date().toISOString(),
      userTrackingId: currentUser.trackingId,
      itineraireTrackingId: itinerary ? itinerary.trackingId : undefined,
      montantTotal,
      description: this.buildDescription(this.selectedItem, nombrePlaces)
    };

    if (extraWeight && extraWeight > 0) {
      payload.bagageSupplementaireKg = extraWeight;
    }

    if (seatPayload.length > 0) {
      payload.seatSelections = seatPayload;
    }

    if (this.isFlightSelection()) {
      payload.classeVoyage = this.normalizeClass(this.selectedClass);
    }

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
    this.freightError = null;
    this.resetSeatSelections();
    this.resetFreightInputs();
    this.seatAvailability = [];
    this.selectedSeatIds = [];
    this.seatAvailabilityError = null;
    this.seatAvailabilityLoading = false;
    this.currentStep = ReservationWizardStep.DETAILS;
    this.currentUnitPrice = null;
  }

  private handleReservationSuccess(reservation: ReservationResponse) {
    this.creatingReservation = false;
    this.resetSeatSelections();
    this.resetFreightInputs();

    if (reservation.paymentUrl) {
      this.paymentDialogReservation = reservation;
      this.paymentDialogUrl = reservation.paymentUrl;
      this.showPaymentDialog = true;
    } else {
      this.errorMessage = "Réservation créée mais aucun lien de paiement n'a été fourni.";
    }
  }

  private handleReservationError(err: unknown) {
    console.error('Erreur lors de la création de la réservation :', err);
    this.creatingReservation = false;
    this.errorMessage = "Impossible de créer la réservation. Veuillez réessayer.";
  }

  closePaymentDialog(): void {
    this.showPaymentDialog = false;
  }

  openPaymentInNewTab(): void {
    if (!this.paymentDialogUrl) {
      return;
    }

    window.open(this.paymentDialogUrl, '_blank', 'noopener');
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

  private buildSeatPayload(expectedSeats: number): SeatSelectionRequest[] {
    if (this.isFlightSelection()) {
      const validSeatIds = this.selectedSeatIds
        .map((seatId) => ({
          seatId,
          seat: this.seatAvailability.find((s) => s.seatTrackingId === seatId)
        }))
        .filter((entry) => entry.seat && !entry.seat.generatedLayout)
        .map((entry) => entry.seatId)
        .slice(0, expectedSeats);

      if (!validSeatIds.length) {
        return [];
      }

      return validSeatIds.map((seatId) => ({ seatTrackingId: seatId } as SeatSelectionRequest));
    }

    return [];
  }

  onFreightChange(value: number | null) {
    this.bagageSupplementaireKg = value;
    this.freightPricePreview = null;
    this.freightError = null;

    const itinerary = this.currentItinerary;
    if (!itinerary) {
      return;
    }

    const result = this.computeFreightForReservation(itinerary, { emitError: false });
    if (!result) {
      this.freightPricePreview = null;
      return;
    }

    this.freightPricePreview = result.cost > 0 ? result.cost : null;
  }

  getItineraryBadge(itinerary: ItineraireResponse): string {
    const name = itinerary.compagnieNom?.trim();
    if (name) {
      return name;
    }
    if (itinerary.compagnieType === TypeCompagnie.AEROPORT) {
      return 'Compagnie aérienne';
    }
    if (itinerary.compagnieType === TypeCompagnie.STATION) {
      return 'Compagnie de bus';
    }
    return 'Transport';
  }

  private decorateWithCompagnieNames(itineraires: ItineraireResponse[]): ItineraireResponse[] {
    const lookup = new Map<string, string>(
      (this.compagnies ?? []).map((compagnie) => [compagnie.trackingId, compagnie.nom])
    );

    return (itineraires ?? []).map((itinerary) => {
      const explicit = itinerary.compagnieNom?.trim();
      const resolved = explicit || (itinerary.compagnieTrackingId ? lookup.get(itinerary.compagnieTrackingId) : undefined);
      return {
        ...itinerary,
        compagnieNom: resolved ?? itinerary.compagnieNom ?? null
      };
    });
  }

  get seatsCount(): number {
    return Math.max(1, this.selectedSeats || 0);
  }

  get reservationTotal(): number {
    const seatsCount = this.seatsCount;
    const unitPrice = this.getUnitPriceForSelection();
    const base = unitPrice > 0 ? Number((unitPrice * seatsCount).toFixed(2)) : 0;
    const freight = this.freightPricePreview ?? 0;
    return Number((base + freight).toFixed(2));
  }

  get currentItinerary(): ItineraireResponse | null {
    return this.isTransportSelection(this.selectedItem) ? this.selectedItem : null;
  }

  isTransportSelected(): boolean {
    return this.isTransportSelection(this.selectedItem);
  }

  private resetSeatSelections(): void {
    this.selectedSeatIds = [];
  }

  private resetFreightInputs(): void {
    this.bagageSupplementaireKg = null;
    this.freightPricePreview = null;
    this.freightError = null;
  }

  private computeFreightForReservation(
    itinerary: ItineraireResponse | null,
    options: { emitError: boolean }
  ): { cost: number; weight?: number } | null {
    if (!itinerary) {
      return { cost: 0 };
    }

    const weight = this.bagageSupplementaireKg ?? 0;
    if (!weight || weight <= 0) {
      return { cost: 0 };
    }

    if (itinerary.bagageSupplementaireMaxKg != null && weight > itinerary.bagageSupplementaireMaxKg) {
      if (options.emitError) {
        this.freightError = `Vous pouvez ajouter au maximum ${itinerary.bagageSupplementaireMaxKg} kg de bagage supplémentaire.`;
      }
      return null;
    }

    if (!itinerary.prixFreightParKg || itinerary.prixFreightParKg <= 0) {
      if (options.emitError) {
        this.freightError = "Le tarif fret n'est pas disponible pour cet itinéraire.";
      }
      return null;
    }

    const roundedWeight = Number(weight.toFixed(2));
    const cost = Number((roundedWeight * itinerary.prixFreightParKg).toFixed(2));

    return {
      cost,
      weight: roundedWeight
    };
  }

  private isTransportSelection(item: ItineraireResponse | LocalResponse | null): item is ItineraireResponse {
    return !!item && 'villeDepart' in item && 'villeArrivee' in item;
  }

  private hasPrice(item: ItineraireResponse | LocalResponse | null): item is ItineraireResponse {
    return !!item && typeof (item as any).prix !== 'undefined';
  }

  isFlightSelection(): boolean {
    return this.isTransportSelection(this.selectedItem) && this.currentItinerary?.compagnieType === TypeCompagnie.AEROPORT;
  }

  onSelectedSeatsChange(): void {
    if (!this.isFlightSelection()) {
      return;
    }

    if (this.selectedSeatIds.length > this.selectedSeats) {
      this.selectedSeatIds = this.selectedSeatIds.slice(0, this.selectedSeats);
    }
  }

  onClassChange(): void {
    if (!this.isFlightSelection()) {
      return;
    }

    // Filtrer les sièges incompatibles avec la classe sélectionnée
    const normalized = this.selectedClass.trim().toUpperCase();
    this.selectedSeatIds = this.selectedSeatIds.filter((seatId) => {
      const seat = this.seatAvailability.find((s) => s.seatTrackingId === seatId);
      return !seat || (seat.classe?.trim().toUpperCase() ?? 'ECONOMIQUE') === normalized;
    });

    this.calculateUnitPrice();
  }

  loadSeatAvailability(): void {
    const itinerary = this.currentItinerary;
    if (!itinerary) {
      this.seatAvailability = [];
      return;
    }

    this.seatAvailabilityLoading = true;
    this.seatAvailabilityError = null;
    this.itineraireService.seatAvailability(itinerary.trackingId).subscribe({
      next: (seats) => {
        this.seatAvailability = seats;
        this.hasGeneratedSeatLayout = seats.some((seat) => seat.generatedLayout);
        this.selectedSeatIds = [];
        this.seatAvailabilityLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des sièges', err);
        this.seatAvailability = [];
        this.seatAvailabilityLoading = false;
        this.seatAvailabilityError = "Impossible de charger les sièges disponibles. Veuillez réessayer.";
      }
    });
  }

  toggleSeatSelection(seat: SeatAvailabilityResponse): void {
    if (seat.reserved) {
      return;
    }

    if (!this.seatMatchesSelectedClass(seat)) {
      return;
    }

    const index = this.selectedSeatIds.indexOf(seat.seatTrackingId);

    if (index >= 0) {
      this.selectedSeatIds.splice(index, 1);
      this.selectedSeatIds = [...this.selectedSeatIds];
      return;
    }

    if (this.selectedSeatIds.length >= this.selectedSeats) {
      return;
    }

    this.selectedSeatIds = [...this.selectedSeatIds, seat.seatTrackingId];
  }

  isSeatSelected(seat: SeatAvailabilityResponse): boolean {
    return this.selectedSeatIds.includes(seat.seatTrackingId);
  }

  seatMatchesSelectedClass(seat: SeatAvailabilityResponse | null | undefined): boolean {
    if (!seat) {
      return false;
    }

    const seatClasse = this.normalizeClass(seat.classe);
    const selectedClasse = this.normalizeClass(this.selectedClass);
    return seatClasse === selectedClasse;
  }

  getSeatClassModifiers(seat: SeatAvailabilityResponse | null | undefined): Record<string, boolean> {
    if (!seat) {
      return { 'seat-btn--default': true };
    }

    const normalized = this.normalizeClass(seat.classe);

    const classMapping: Record<string, string> = {
      'ECONOMIQUE': 'seat-btn--economique',
      'ECONOMIE': 'seat-btn--economique',
      'ECONOMY': 'seat-btn--economique',
      'ECONOMIQUE_PREMIUM': 'seat-btn--premium-economy',
      'PREMIUM_ECONOMIQUE': 'seat-btn--premium-economy',
      'PREMIUM': 'seat-btn--premium-economy',
      'AFFAIRES': 'seat-btn--business',
      'BUSINESS': 'seat-btn--business',
      'PRENIUM': 'seat-btn--premium-economy',
      'PREMIERE': 'seat-btn--first',
      'FIRST': 'seat-btn--first'
    };

    const cssClass = classMapping[normalized] ?? 'seat-btn--default';

    return {
      'seat-btn--default': true,
      [cssClass]: true
    };
  }

}
