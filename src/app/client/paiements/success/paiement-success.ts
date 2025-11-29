import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-paiement-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './paiement-success.html',
  styleUrls: ['./paiement-success.css']
})
export class PaiementSuccessComponent implements OnInit {
  transactionId: string | null = null;
  amount: string | null = null;
  paymentMethod: string | null = null;

  constructor(private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    const queryParams = this.route.snapshot.queryParamMap;
    this.transactionId = queryParams.get('transaction_id') || queryParams.get('cpm_trans_id');
    this.amount = queryParams.get('amount');
    this.paymentMethod = queryParams.get('payment_method');
  }
}
