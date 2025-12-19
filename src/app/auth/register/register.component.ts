import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Role, TypeCompagnie, TypeEtablissement } from '../../models/enums.model';
import { UserServiceApi } from '../../services/user.service';
import { CompagnieServiceApi } from '../../services/compagnie.service';
import { EtablissementServiceApi } from '../../services/etablissement.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  isLoading = false;
  showPassword = false;
  showConfirmPassword = false;
  selectedRole: Role = Role.CLIENT;
  errorMessage: string = '';

  roles = [
    { value: Role.CLIENT, label: 'Client' },
    { value: Role.COMPAGNIE_BUS, label: 'Compagnie de bus' },
    { value: Role.COMPAGNIE_AERIEN, label: 'Compagnie aérienne' },
    { value: Role.ETABLISSEMENT, label: 'Hébergement' }
  ];

  typesCompagnie = [
    { value: TypeCompagnie.STATION, label: 'Station' },
    { value: TypeCompagnie.AEROPORT, label: 'Aéroport' }
  ];

  typesEtablissement = [
    { value: TypeEtablissement.Hotel, label: 'Hôtel' },
    { value: TypeEtablissement.Motel, label: 'Motel' },
    { value: TypeEtablissement.Appartement, label: 'Appartement' }
  ];

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private userService: UserServiceApi,
    private compagnieService: CompagnieServiceApi,
    private etablissementService: EtablissementServiceApi
  ) {
    this.registerForm = this.fb.group({
      nom: ['', [Validators.required, Validators.minLength(2)]],
      prenom: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telephone: ['', [Validators.required, Validators.pattern(/^[0-9+\-\s()]{8,}$/)]],
      password: ['', [Validators.required, Validators.minLength(8), this.passwordValidator]],
      confirmPassword: ['', [Validators.required]],
      role: [Role.CLIENT, [Validators.required]],
      acceptTerms: [false, [Validators.requiredTrue]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  ngOnInit(): void {
    // Surveiller les changements du rôle pour ajouter/supprimer les champs dynamiquement
    this.registerForm.get('role')?.valueChanges.subscribe(role => {
      this.selectedRole = role;
      this.updateFormFields(role);
    });
  }

  updateFormFields(role: Role): void {
    // Supprimer tous les champs conditionnels
    ['nomCompagnie', 'typeCompagnie', 'adresse', 'typeEtablissement', 'siteWeb', 'description', 'numeroLicence', 'nomEtablissement'].forEach(field => {
      if (this.registerForm.get(field)) {
        this.registerForm.removeControl(field);
      }
    });

    // Ajouter les champs selon le rôle
    const isCompanyRole = role === Role.COMPAGNIE_BUS || role === Role.COMPAGNIE_AERIEN;

    if (isCompanyRole) {
      const defaultType = role === Role.COMPAGNIE_AERIEN ? TypeCompagnie.AEROPORT : TypeCompagnie.STATION;

      this.registerForm.addControl('nomCompagnie', this.fb.control('', [Validators.required, Validators.minLength(2)]));
      this.registerForm.addControl('typeCompagnie', this.fb.control(defaultType, [Validators.required]));
      this.registerForm.addControl('numeroLicence', this.fb.control('', [Validators.required, Validators.minLength(3)]));
      this.registerForm.addControl('siteWeb', this.fb.control(''));
      this.registerForm.addControl('adresse', this.fb.control(''));
      this.registerForm.addControl('description', this.fb.control(''));
    } else if (role === Role.ETABLISSEMENT) {
      this.registerForm.addControl('nomEtablissement', this.fb.control('', [Validators.required, Validators.minLength(2)]));
      this.registerForm.addControl('adresse', this.fb.control('', [Validators.required, Validators.minLength(5)]));
      this.registerForm.addControl('typeEtablissement', this.fb.control(TypeEtablissement.Hotel, [Validators.required]));
      this.registerForm.addControl('description', this.fb.control(''));
    }
  }

  isCompagnie(): boolean {
    return this.selectedRole === Role.COMPAGNIE_BUS || this.selectedRole === Role.COMPAGNIE_AERIEN;
  }

  isHebergement(): boolean {
    return this.selectedRole === Role.ETABLISSEMENT;
  }

  isClient(): boolean {
    return this.selectedRole === Role.CLIENT;
  }

  get isOrganisation(): boolean {
    return this.isCompagnie() || this.isHebergement();
  }

  get prenomLabel(): string {
    return this.isOrganisation ? 'Prénom du gérant' : 'Prénom';
  }

  get nomLabel(): string {
    return this.isOrganisation ? 'Nom du gérant' : 'Nom';
  }

  get telephoneLabel(): string {
    return this.isOrganisation ? 'Téléphone du gérant' : 'Téléphone';
  }

  get infoNote(): string {
    if (this.isCompagnie()) {
      return 'Les informations Nom / Prénom concernent le gérant de la compagnie. Veillez à renseigner également les détails officiels de la structure.';
    }
    if (this.isHebergement()) {
      return 'Les informations Nom / Prénom concernent le gérant de l’hébergement. Renseignez ensuite les détails de l’établissement.';
    }
    return 'Renseignez vos informations personnelles pour accéder aux services VoyageExpress en tant que client.';
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
    if (this.isLoading) {
      return;
    }

    this.markFormGroupTouched();

    if (this.registerForm.invalid) {
      this.errorMessage = 'Veuillez vérifier les champs en rouge et accepter les conditions d\'utilisation.';
      console.warn('[Register] Formulaire invalide', {
        errors: this.registerForm.errors,
        controls: this.registerForm.value
      });
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const formValue = this.registerForm.getRawValue();

    const userRequest = {
      nom: formValue.nom,
      prenom: formValue.prenom,
      email: formValue.email,
      password: formValue.password,
      role: formValue.role,
      telephone: formValue.telephone
    };

    console.debug('[Register] Envoi requête inscription', userRequest);

    this.userService.inscription(userRequest).subscribe({
      next: (userResponse) => {
        console.debug('[Register] Réponse inscription reçue', userResponse);

        if (this.isCompagnie()) {
          this.createCompagnie(formValue, userResponse.trackingId);
        } else if (this.isHebergement()) {
          this.createEtablissement(formValue, userResponse);
        } else {
          this.handleRegistrationSuccess(this.selectedRole);
        }
      },
      error: (error) => {
        console.error('[Register] Erreur inscription utilisateur', error);
        this.isLoading = false;
        this.errorMessage = error.error?.message || error.message || 'Erreur lors de l\'inscription.';
      }
    });
  }

  private createCompagnie(formValue: any, proprietaireId: string) {
    const compagnieRequest = {
      nom: formValue.nomCompagnie,
      type: formValue.typeCompagnie,
      telephone: formValue.telephone,
      proprietaireId,
      email: formValue.email,
      adresse: formValue.adresse || '',
      siteWeb: formValue.siteWeb || '',
      description: formValue.description || '',
      numeroLicence: formValue.numeroLicence || ''
    };

    console.debug('[Register] Création compagnie', compagnieRequest);

    this.compagnieService.create(compagnieRequest).subscribe({
      next: () => {
        console.debug('[Register] Compagnie créée');
        this.handleRegistrationSuccess(this.selectedRole);
      },
      error: (error) => this.handleCompagnieCreationError(error)
    });
  }

  private createEtablissement(formValue: any, userResponse: any) {
    const etablissementRequest = {
      nom: formValue.nomEtablissement,
      adresse: formValue.adresse,
      type: formValue.typeEtablissement,
      proprietaireId: userResponse.trackingId,
      description: formValue.description || ''
    };

    console.debug('[Register] Création établissement', etablissementRequest);

    this.etablissementService.create(etablissementRequest).subscribe({
      next: () => {
        console.debug('[Register] Établissement créé');
        this.handleRegistrationSuccess(this.selectedRole);
      },
      error: (error) => this.handleEtablissementCreationError(error)
    });
  }

  private handleRegistrationSuccess(role: Role) {
    this.isLoading = false;
    this.errorMessage = '';
    const queryParams: Record<string, string> = { registered: 'true' };

    if (role === Role.COMPAGNIE_AERIEN || role === Role.COMPAGNIE_BUS || role === Role.ETABLISSEMENT) {
      queryParams['pendingRole'] = role;
    }

    this.router.navigate(['/auth/login'], { queryParams });
  }

  private handleCompagnieCreationError(error: any) {
    this.isLoading = false;
    console.error('[Register] Erreur création compagnie', error);
    this.errorMessage = error.error?.message || error.message || 'Erreur lors de la création de la compagnie.';
  }

  private handleEtablissementCreationError(error: any) {
    this.isLoading = false;
    console.error('[Register] Erreur création établissement', error);
    this.errorMessage = error.error?.message || error.message || 'Erreur lors de la création de l\'établissement.';
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
