import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ReservationResponse } from '../../../models';

@Component({
  selector: 'app-payment-checkout-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-checkout-dialog.component.html',
  styleUrls: ['./payment-checkout-dialog.component.css']
})
export class PaymentCheckoutDialogComponent {
  private _paymentUrl: string | null = null;

  @Input() visible = false;
  @Input() reservation: ReservationResponse | null = null;
  @Input() loading = false;

  @Input()
  set paymentUrl(value: string | null) {
    this._paymentUrl = value ?? null;
    this.safePaymentUrl = value ? this.sanitizer.bypassSecurityTrustResourceUrl(value) : null;
  }

  get paymentUrl(): string | null {
    return this._paymentUrl;
  }

  @Output() closed = new EventEmitter<void>();
  @Output() openPaymentRequest = new EventEmitter<void>();

  safePaymentUrl: SafeResourceUrl | null = null;
  copyFeedback: 'copied' | 'error' | null = null;

  constructor(private readonly sanitizer: DomSanitizer) {}

  get clientFullName(): string | null {
    const nom = this.reservation?.clientNom?.trim();
    const prenom = this.reservation?.clientPrenom?.trim();
    if (!nom && !prenom) {
      return null;
    }
    return [prenom, nom].filter(Boolean).join(' ').trim();
  }

  get hasIframe(): boolean {
    return !!this.safePaymentUrl;
  }

  get montant(): number | null {
    return this.reservation?.montantTotal ?? null;
  }

  onClose(): void {
    this.closed.emit();
  }

  onLaunchPayment(): void {
    if (!this.paymentUrl) {
      return;
    }
    this.openPaymentRequest.emit();
  }

  async copyLink(): Promise<void> {
    if (!this.paymentUrl || !navigator?.clipboard) {
      this.copyFeedback = 'error';
      return;
    }

    try {
      await navigator.clipboard.writeText(this.paymentUrl);
      this.copyFeedback = 'copied';
      setTimeout(() => (this.copyFeedback = null), 2000);
    } catch (error) {
      console.error('Impossible de copier le lien de paiement', error);
      this.copyFeedback = 'error';
      setTimeout(() => (this.copyFeedback = null), 2000);
    }
  }
}
