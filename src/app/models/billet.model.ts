export interface BilletRequest {
  montant: number;
  statut: string;
  fils: string;
}

export interface BilletResponse {
  trackingId: string;
  id: number;
  montant: number;
  statut: string;
  fils: string;
  pdfUrl: string;
  reservationId: number;
  itineraireId: number;
}
