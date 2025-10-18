import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Role } from '../../models/enums.model';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;

  roles = [
    { value: Role.CLIENT, label: 'Client' },
    { value: Role.COMPAGNIE_BUS, label: 'Compagnie de Bus' },
    { value: Role.COMPAGNIE_AERIEN, label: 'Compagnie Aérienne' },
    { value: Role.ETABLISSEMENT, label: 'Établissement' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{8,}$/)]],
      password: ['', [Validators.required, Validators.minLength(8), this.passwordValidator]],
      confirmPassword: ['', [Validators.required]],
      role: [Role.CLIENT, [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  passwordValidator(control: any) {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);
    const hasSpecial = /[#?!@$%^&*-]/.test(value);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric && hasSpecial;
    return !passwordValid ? { invalidPassword: true } : null;
  }

  passwordMatchValidator(group: FormGroup) {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');

    if (password?.value !== confirmPassword?.value) {
      confirmPassword?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    if (confirmPassword?.hasError('passwordMismatch')) {
      confirmPassword.setErrors(null);
    }

    return null;
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      // Ici vous ajouteriez la logique d'inscription
      setTimeout(() => {
        this.isLoading = false;
        this.router.navigate(['/auth/login']);
      }, 2000);
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched() {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  goToLogin() {
    this.router.navigate(['/auth/login']);
  }

  getPasswordStrength() {
    const password = this.registerForm.get('password')?.value || '';
    let strength = 0;

    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[#?!@$%^&*-]/.test(password)) strength += 25;

    return strength;
  }

  getPasswordStrengthText() {
    const strength = this.getPasswordStrength();
    if (strength < 50) return 'Faible';
    if (strength < 75) return 'Moyen';
    if (strength < 100) return 'Fort';
    return 'Très Fort';
  }

  getPasswordStrengthColor() {
    const strength = this.getPasswordStrength();
    if (strength < 50) return '#dc3545';
    if (strength < 75) return '#ffc107';
    if (strength < 100) return '#fd7e14';
    return '#28a745';
  }
}
