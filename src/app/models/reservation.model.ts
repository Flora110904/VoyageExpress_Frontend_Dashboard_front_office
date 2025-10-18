export interface ReservationRequest {
  statut: string;
  dateReservation: string; // ISO LocalDateTime
  userTrakingId: string; // UUID as string (backend spelling)
}

export interface ReservationResponse {
  trackingId: string;
  statut: string;
  dateReservation: string; // LocalDateTime
  ticketHebergementUrl: string;
  utilisateurTrackingId: string;
  localTrackingId: string;
}
