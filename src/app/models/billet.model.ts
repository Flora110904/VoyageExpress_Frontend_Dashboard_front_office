export interface BilletRequest {
  montant: number;
  statut: string;
  numeroSiege?: string;
  classeVoyage?: string;
  nomPassager: string;
  prenomPassager: string;
  numeroIdentite?: string;
  itineraireTrackingId: string; // UUID as string
  reservationTrackingId?: string; // UUID as string
}

export interface BilletResponse {
  trackingId: string;
  id: number;
  numeroBillet: string;
  montant: number;
  statut: string;
  numeroSiege?: string;
  classeVoyage?: string;
  nomPassager: string;
  prenomPassager: string;
  numeroIdentite?: string;
  dateEmission: string; // LocalDateTime
  dateExpiration: string; // LocalDateTime
  qrCode: string;
  pdfUrl: string;
  utilisateurTrackingId: string;
  reservationId: number;
  itineraireId: number;
}
