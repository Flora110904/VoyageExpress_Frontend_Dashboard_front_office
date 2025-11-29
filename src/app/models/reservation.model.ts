export interface ReservationRequest {
  statut: string;
  dateReservation: string; // ISO LocalDateTime
  userTrackingId: string; // UUID as string
  itineraireTrackingId?: string; // UUID as string, for transport reservations
  montantTotal: number;
  description?: string;
}

export interface ReservationResponse {
  trackingId: string;
  numeroReservation: string;
  statut: string;
  dateReservation: string; // LocalDateTime
  montantTotal: number;
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
}
