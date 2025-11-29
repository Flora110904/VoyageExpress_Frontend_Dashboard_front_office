import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-paiement-cancel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './paiement-cancel.html',
  styleUrls: ['./paiement-cancel.css']
})
export class PaiementCancelComponent implements OnInit {
  transactionId: string | null = null;
  errorMessage: string | null = null;

  constructor(private readonly route: ActivatedRoute) {}

  ngOnInit(): void {
    const queryParams = this.route.snapshot.queryParamMap;
    this.transactionId = queryParams.get('transaction_id') || queryParams.get('cpm_trans_id');
    this.errorMessage = queryParams.get('message') || queryParams.get('error');
  }
}
