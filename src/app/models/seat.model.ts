export interface SeatAvailabilityResponse {
  seatTrackingId: string;
  code: string;
  classe: string | null;
  seatType: string | null;
  rowNumber: number | null;
  columnLabel: string | null;
  deck: string | null;
  reserved: boolean;
  generatedLayout: boolean;
}
