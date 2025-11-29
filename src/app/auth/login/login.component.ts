import { Component } from '@angular/core';
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
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  showPassword = false;
  errorMessage: string = '';

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
}
