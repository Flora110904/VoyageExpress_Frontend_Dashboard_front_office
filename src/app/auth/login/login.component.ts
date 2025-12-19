import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models';
import { Role } from '../../models/enums.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;
  errorMessage: string = '';
  registrationSuccess = false;
  registrationMessage = '';

  private readonly pendingValidationRoles = new Set<Role>([
    Role.COMPAGNIE_BUS,
    Role.COMPAGNIE_AERIEN,
    Role.ETABLISSEMENT
  ]);

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });
  }

  ngOnInit(): void {
    this.route.queryParamMap.subscribe(params => {
      const registered = params.get('registered');
      if (registered === 'true') {
        const pendingRoleParam = params.get('pendingRole') as Role | null;
        const pendingRole = pendingRoleParam && Object.values(Role).includes(pendingRoleParam as Role)
          ? pendingRoleParam as Role
          : null;

        this.registrationSuccess = true;
        this.registrationMessage = this.buildRegistrationMessage(pendingRole);

        const remainingParams: Record<string, string> = {};
        params.keys.forEach(key => {
          if (key === 'registered' || key === 'pendingRole') {
            return;
          }
          const value = params.get(key);
          if (value !== null) {
            remainingParams[key] = value;
          }
        });

        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: remainingParams,
          replaceUrl: true
        });
      }
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      
      const loginRequest: LoginRequest = {
        email: this.loginForm.value.email,
        password: this.loginForm.value.password
      };

  const remember = !!this.loginForm.value.rememberMe;
  this.authService.login(loginRequest, remember).subscribe({
        next: (response) => {
          this.isLoading = false;
          console.log('Connexion réussie:', response);

          // Si une route de retour est fournie par le guard, prioriser cette URL
          const returnUrl = this.route.snapshot.queryParams['returnUrl'] as string | undefined;
          if (returnUrl) {
            this.router.navigateByUrl(returnUrl);
            return;
          }

          const role = response.role;
          const isActive = response.actif;

          if (role === Role.CLIENT) {
            this.router.navigate(['/client/dashboard']);
            return;
          }

          const isPendingValidationRole = (
            role === Role.COMPAGNIE_BUS ||
            role === Role.COMPAGNIE_AERIEN ||
            role === Role.ETABLISSEMENT
          );

          if (!isActive && isPendingValidationRole) {
            this.router.navigate(['/client/dashboard']);
            return;
          }

          if (role === Role.COMPAGNIE_BUS) {
            this.router.navigate(['/compagnieBus']);
          } else if (role === Role.COMPAGNIE_AERIEN) {
            this.router.navigate(['/compagnieVol']);
          } else if (role === Role.ETABLISSEMENT) {
            this.router.navigate(['/etablisement']);
          } else {
            this.router.navigate(['/']);
          }
        },
        error: (error) => {
          this.isLoading = false;
          console.error('Erreur de connexion:', error);
          this.errorMessage = error.error?.message || 'Email ou mot de passe incorrect. Veuillez réessayer.';
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  goToRegister() {
    this.router.navigate(['/auth/register']);
  }

  private buildRegistrationMessage(pendingRole: Role | null): string {
    if (pendingRole && this.pendingValidationRoles.has(pendingRole)) {
      const roleLabel = this.getRoleLabel(pendingRole);
      return `Votre compte ${roleLabel} a été créé et est en attente de validation par un administrateur. Vous pouvez déjà vous connecter pour accéder à l'espace client.`;
    }
    return 'Votre compte a été créé avec succès. Vous pouvez maintenant vous connecter.';
  }

  private getRoleLabel(role: Role): string {
    switch (role) {
      case Role.COMPAGNIE_BUS:
        return 'compagnie de bus';
      case Role.COMPAGNIE_AERIEN:
        return 'compagnie aérienne';
      case Role.ETABLISSEMENT:
        return 'hébergement';
      case Role.CLIENT:
      default:
        return 'client';
    }
  }
}
