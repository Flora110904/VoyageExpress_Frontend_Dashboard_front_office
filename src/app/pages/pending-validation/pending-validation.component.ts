import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { Role } from '../../models/enums.model';

@Component({
  selector: 'app-pending-validation',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-vh-100 d-flex align-items-center justify-content-center" 
         style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
      <div class="container">
        <div class="row justify-content-center">
          <div class="col-md-8 col-lg-6">
            <!-- Card principale -->
            <div class="card shadow-lg border-0 rounded-4 overflow-hidden">
              <!-- Header avec animation -->
              <div class="card-header bg-warning text-white text-center py-5" 
                   style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%) !important;">
                <div class="mb-3">
                  <div class="position-relative d-inline-block">
                    <i class="fa fa-hourglass-half fa-4x opacity-75"></i>
                    <div class="position-absolute top-0 start-100 translate-middle">
                      <span class="badge rounded-pill bg-light text-warning">
                        <i class="fa fa-clock"></i>
                      </span>
                    </div>
                  </div>
                </div>
                <h2 class="fw-bold mb-2">Compte en Attente de Validation</h2>
                <p class="mb-0 opacity-90">Votre inscription a bien été enregistrée</p>
              </div>

              <!-- Corps du message -->
              <div class="card-body p-5">
                <div class="text-center mb-4">
                  <div class="alert alert-info border-0 shadow-sm" role="alert">
                    <div class="d-flex align-items-center justify-content-center">
                      <i class="fa fa-info-circle fa-2x me-3 text-primary"></i>
                      <div class="text-start">
                        <h5 class="alert-heading mb-1 fw-bold">Validation Requise</h5>
                        <p class="mb-0 small">
                          Votre compte <strong>{{ getRoleLabel() }}</strong> doit être validé par un administrateur
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Informations utilisateur -->
                <div class="bg-light rounded-3 p-4 mb-4">
                  <h6 class="text-muted small fw-bold mb-3 text-uppercase">
                    <i class="fa fa-user me-2"></i>Informations du compte
                  </h6>
                  <div class="row g-3">
                    <div class="col-md-6">
                      <div class="d-flex align-items-center">
                        <i class="fa fa-user-circle text-primary me-2"></i>
                        <div>
                          <small class="text-muted d-block">Nom complet</small>
                          <strong>{{ userInfo?.prenom }} {{ userInfo?.nom }}</strong>
                        </div>
                      </div>
                    </div>
                    <div class="col-md-6">
                      <div class="d-flex align-items-center">
                        <i class="fa fa-envelope text-primary me-2"></i>
                        <div>
                          <small class="text-muted d-block">Email</small>
                          <strong>{{ userInfo?.email }}</strong>
                        </div>
                      </div>
                    </div>
                    <div class="col-12">
                      <div class="d-flex align-items-center">
                        <i class="fa fa-tag text-primary me-2"></i>
                        <div>
                          <small class="text-muted d-block">Type de compte</small>
                          <span class="badge bg-primary rounded-pill px-3 py-2">
                            {{ getRoleLabel() }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Étapes suivantes -->
                <div class="mb-4">
                  <h6 class="fw-bold mb-3">
                    <i class="fa fa-list-check me-2 text-success"></i>Prochaines étapes
                  </h6>
                  <div class="timeline">
                    <div class="timeline-item completed">
                      <div class="timeline-marker bg-success">
                        <i class="fa fa-check text-white"></i>
                      </div>
                      <div class="timeline-content">
                        <strong>Inscription complétée</strong>
                        <p class="text-muted small mb-0">Votre compte a été créé avec succès</p>
                      </div>
                    </div>
                    <div class="timeline-item active">
                      <div class="timeline-marker bg-warning">
                        <i class="fa fa-clock text-white"></i>
                      </div>
                      <div class="timeline-content">
                        <strong>Validation en cours</strong>
                        <p class="text-muted small mb-0">
                          Un administrateur examinera votre demande sous 24-48 heures
                        </p>
                      </div>
                    </div>
                    <div class="timeline-item">
                      <div class="timeline-marker bg-secondary">
                        <i class="fa fa-envelope text-white"></i>
                      </div>
                      <div class="timeline-content">
                        <strong>Notification par email</strong>
                        <p class="text-muted small mb-0">
                          Vous recevrez un email dès que votre compte sera validé
                        </p>
                      </div>
                    </div>
                    <div class="timeline-item">
                      <div class="timeline-marker bg-secondary">
                        <i class="fa fa-rocket text-white"></i>
                      </div>
                      <div class="timeline-content">
                        <strong>Accès à votre espace</strong>
                        <p class="text-muted small mb-0">
                          Vous pourrez accéder à toutes les fonctionnalités de votre compte
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Accès temporaire -->
                <div class="alert alert-light border border-primary" role="alert">
                  <div class="d-flex align-items-start">
                    <i class="fa fa-lightbulb fa-2x text-warning me-3 mt-1"></i>
                    <div>
                      <h6 class="fw-bold mb-2">En attendant la validation</h6>
                      <p class="mb-2 small">
                        Vous pouvez accéder à l'espace client pour explorer nos services de réservation.
                      </p>
                      <button 
                        (click)="goToClientSpace()" 
                        class="btn btn-sm btn-outline-primary rounded-pill px-4">
                        <i class="fa fa-arrow-right me-2"></i>Accéder à l'espace client
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Footer -->
              <div class="card-footer bg-light text-center py-4">
                <p class="text-muted mb-3 small">
                  <i class="fa fa-question-circle me-2"></i>
                  Des questions sur votre validation ?
                </p>
                <button (click)="logout()" class="btn btn-outline-secondary rounded-pill px-4 me-2">
                  <i class="fa fa-sign-out me-2"></i>Se déconnecter
                </button>
                <a href="mailto:support@voyageexpress.com" class="btn btn-primary rounded-pill px-4">
                  <i class="fa fa-envelope me-2"></i>Contacter le support
                </a>
              </div>
            </div>

            <!-- Info supplémentaire -->
            <div class="text-center mt-4">
              <p class="text-white small">
                <i class="fa fa-shield-alt me-2"></i>
                Votre sécurité est notre priorité. La validation garantit la qualité de nos partenaires.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .timeline {
      position: relative;
      padding-left: 2rem;
    }
    
    .timeline::before {
      content: '';
      position: absolute;
      left: 1.25rem;
      top: 0;
      bottom: 0;
      width: 2px;
      background: #e9ecef;
    }
    
    .timeline-item {
      position: relative;
      padding-bottom: 2rem;
    }
    
    .timeline-item:last-child {
      padding-bottom: 0;
    }
    
    .timeline-marker {
      position: absolute;
      left: -2rem;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
    }
    
    .timeline-item.completed .timeline-marker {
      animation: pulse 2s infinite;
    }
    
    .timeline-item.active .timeline-marker {
      animation: bounce 2s infinite;
    }
    
    .timeline-content {
      padding-left: 1rem;
    }
    
    @keyframes pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    
    @keyframes bounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-5px); }
    }
  `]
})
export class PendingValidationComponent implements OnInit {
  userInfo: any;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser.subscribe(user => {
      this.userInfo = user;
      
      // Si l'utilisateur est actif, le rediriger vers son espace
      if (user?.actif) {
        this.redirectToUserSpace(user.role);
      }
    });
  }

  getRoleLabel(): string {
    if (!this.userInfo?.role) return '';
    
    const roleLabels: { [key: string]: string } = {
      [Role.COMPAGNIE_BUS]: 'Compagnie de Transport',
      [Role.COMPAGNIE_AERIEN]: 'Compagnie Aérienne',
      [Role.ETABLISSEMENT]: 'Établissement d\'Hébergement',
      [Role.CLIENT]: 'Client'
    };
    
    return roleLabels[this.userInfo.role] || this.userInfo.role;
  }

  goToClientSpace(): void {
    this.router.navigate(['/client']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  private redirectToUserSpace(role: Role): void {
    if (role === Role.CLIENT) {
      this.router.navigate(['/client']);
    } else if (role === Role.COMPAGNIE_BUS || role === Role.COMPAGNIE_AERIEN) {
      this.router.navigate(['/compagnieBus']);
    } else if (role === Role.ETABLISSEMENT) {
      this.router.navigate(['/etablisement']);
    }
  }
}
