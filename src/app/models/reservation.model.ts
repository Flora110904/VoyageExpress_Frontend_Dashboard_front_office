export interface SeatSelectionRequest {
  seatTrackingId: string;
  passagerNom?: string | null;
  passagerPrenom?: string | null;
  numeroDocument?: string | null;
}

export interface SeatSelectionResponse {
  seatTrackingId: string;
  seatCode: string;
  seatClasse?: string | null;
  passagerNom?: string | null;
  passagerPrenom?: string | null;
  numeroDocument?: string | null;
}

export interface ReservationRequest {
  statut: string;
  dateReservation: string; // ISO LocalDateTime
  userTrackingId: string; // UUID as string
  itineraireTrackingId?: string; // UUID as string, for transport reservations
  bagageSupplementaireKg?: number | null;
  classeVoyage?: string | null;
  seatSelections?: SeatSelectionRequest[] | null;
  montantTotal: number;
  description?: string;
}

export interface ReservationResponse {
  trackingId: string;
  numeroReservation: string;
  statut: string;
  dateReservation: string; // LocalDateTime
  montantTotal: number;
  bagageInclusKg: number;
  bagageSupplementaireKg?: number | null;
  bagageSupplementaireMontant?: number | null;
  classeVoyage?: string | null;
  itineraireTrackingId?: string | null;
  seatSelections?: SeatSelectionResponse[] | null;
  ticketHebergementUrl: string;
  utilisateurTrackingId: string;
  localTrackingId: string;
  paymentUrl?: string;
  clientNom?: string | null;
  clientPrenom?: string | null;
  clientEmail?: string | null;
  quantite?: number | null;
  itineraire?: {
    trackingId?: string | null;
    villeDepart?: string | null;
    villeArrivee?: string | null;
    dateDepart?: string | null;
    heureDepart?: string | null;
  } | null;
  compagnieNom?: string | null;
}

export interface ReservationDetailResponse {
  trackingId: string;
  numeroReservation: string;
  statut: string;
  dateReservation: string;
  dateDebut?: string | null;
  dateFin?: string | null;
  nombrePersonnes?: number | null;
  montantTotal: number;
  montantAvance?: number | null;
  montantRestant?: number | null;
  modePaiement?: string | null;
  bagageInclusKg: number;
  bagageSupplementaireKg?: number | null;
  bagageSupplementaireMontant?: number | null;
  classeVoyage?: string | null;
  notes?: string | null;
  seatSelections: SeatSelectionResponse[];
  client?: {
    trackingId: string;
    nom: string;
    prenom: string;
    email: string;
    telephone: string;
    genre?: string | null;
    dateNaissance?: string | null;
    adresse?: string | null;
    paysResidence?: string | null;
    villeResidence?: string | null;
    typeDocument?: string | null;
    numeroDocument?: string | null;
  } | null;
  compagnie?: {
    trackingId: string;
    nom: string;
    type: string | null;
  } | null;
  itineraire?: {
    trackingId: string;
    villeDepart: string | null;
    villeArrivee: string | null;
    pointDepart: string | null;
    pointArrivee: string | null;
    dateDepart: string | null;
    heureDepart: string | null;
    heureArrivee: string | null;
    prix: number | null;
    prixEconomique: number | null;
    prixEconomiquePremium: number | null;
    prixAffaires: number | null;
    prixPremiere: number | null;
  } | null;
  local?: {
    trackingId: string;
    numero: string | null;
    description: string | null;
    type: string | null;
    capacite: number | null;
    nombreLits: number | null;
    equipements: string | null;
  } | null;
}
