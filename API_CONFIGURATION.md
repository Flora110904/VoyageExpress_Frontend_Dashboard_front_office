# 🔌 Configuration API - VoyageExpress

## 📋 Configuration Actuelle

### **Frontend (Angular)**
- **Port**: `4200` (http://localhost:4200)
- **Proxy configuré**: `/api` → `http://localhost:8080`

### **Backend (Spring Boot)**
- **Port attendu**: `8080` (http://localhost:8080)
- **Base URL**: `http://localhost:8080`

---

## 🚀 Démarrage de l'Application

### **1. Démarrer le Backend (Spring Boot)**

```bash
# Depuis le dossier backend
cd /path/to/your/backend
./mvnw spring-boot:run

# OU avec Maven installé
mvn spring-boot:run

# OU avec le JAR
java -jar target/voyage-express-backend.jar
```

**Vérifier que le backend démarre sur le port 8080** ✅

### **2. Démarrer le Frontend (Angular)**

```bash
# Depuis le dossier frontend
cd C:\Users\LATITUDE\Documents\soutenance\VoyageExpress_Frontend_Dashboard_front_office

# Installer les dépendances (première fois seulement)
npm install

# Démarrer l'application
npm start
```

**L'application sera accessible sur http://localhost:4200** ✅

---

## 🔧 Configuration Proxy

Le fichier `proxy.conf.json` a été créé pour rediriger les appels API :

```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "logLevel": "debug",
    "changeOrigin": true,
    "pathRewrite": {
      "^/api": ""
    }
  }
}
```

### **Comment ça marche ?**

1. **Frontend fait une requête** : `http://localhost:4200/api/auth/login`
2. **Proxy intercepte** : `/api` → redirige vers `http://localhost:8080`
3. **Requête finale** : `http://localhost:8080/auth/login`

---

## 📡 Endpoints API Utilisés

### **Authentification**
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion

### **Utilisateurs**
- `POST /api/users/inscription` - Inscription
- `POST /api/users/activer/{trackingId}` - Activer un utilisateur
- `POST /api/users/desactiver/{trackingId}` - Désactiver un utilisateur
- `GET /api/users/{trackingId}` - Récupérer un utilisateur
- `GET /api/users/all` - Liste tous les utilisateurs
- `GET /api/users/role/{role}` - Utilisateurs par rôle
- `PUT /api/users/update/{trackingId}` - Modifier un utilisateur
- `DELETE /api/users/delete/{trackingId}` - Supprimer un utilisateur

### **Compagnies**
- `POST /api/compagnies/create` - Créer une compagnie
- `GET /api/compagnies/{trackingId}` - Récupérer une compagnie
- `GET /api/compagnies/all` - Liste toutes les compagnies
- `PUT /api/compagnies/update/{trackingId}` - Modifier une compagnie
- `DELETE /api/compagnies/delete/{trackingId}` - Supprimer une compagnie
- `PUT /api/compagnies/activer/{trackingId}` - Activer une compagnie

### **Établissements**
- `POST /api/etablissements/create` - Créer un établissement
- `GET /api/etablissements/{trackingId}` - Récupérer un établissement
- `GET /api/etablissements/all` - Liste tous les établissements
- `PUT /api/etablissements/update/{trackingId}` - Modifier un établissement
- `DELETE /api/etablissements/delete/{trackingId}` - Supprimer un établissement
- `PUT /api/etablissements/activer/{trackingId}` - Activer un établissement
- `PUT /api/etablissements/desactiver/{trackingId}` - Désactiver un établissement

### **Autres Endpoints**
- Itinéraires : `/api/itineraires/*`
- Véhicules : `/api/vehicules/*`
- Locaux : `/api/locaux/*`
- Réservations : `/api/reservations/*`
- Billets : `/api/billets/*`

---

## 🔍 Vérification de la Communication

### **1. Vérifier que le backend est démarré**

Ouvrez votre navigateur et accédez à :
```
http://localhost:8080/actuator/health
```

Vous devriez voir :
```json
{
  "status": "UP"
}
```

### **2. Tester un endpoint depuis le frontend**

Dans la console du navigateur (F12), vous devriez voir :
```
[HPM] GET /api/auth/login -> http://localhost:8080
```

### **3. Vérifier les logs**

**Dans le terminal du frontend (Angular)**, vous verrez :
```
[HPM] GET /api/users/all -> http://localhost:8080/users/all
[HPM] Rewriting path from "/api/users/all" to "/users/all"
```

---

## ❌ Problèmes Courants

### **Problème 1 : CORS Error**
```
Access to XMLHttpRequest has been blocked by CORS policy
```

**Solution** : Ajouter dans votre backend Spring Boot :

```java
@Configuration
public class CorsConfig {
    @Bean
    public WebMvcConfigurer corsConfigurer() {
        return new WebMvcConfigurer() {
            @Override
            public void addCorsMappings(CorsRegistry registry) {
                registry.addMapping("/**")
                    .allowedOrigins("http://localhost:4200")
                    .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                    .allowedHeaders("*")
                    .allowCredentials(true);
            }
        };
    }
}
```

### **Problème 2 : Backend non démarré**
```
GET http://localhost:8080/api/auth/login net::ERR_CONNECTION_REFUSED
```

**Solution** : Démarrer le backend Spring Boot sur le port 8080

### **Problème 3 : Port 8080 déjà utilisé**

**Changer le port du backend** (application.properties) :
```properties
server.port=8081
```

**Puis modifier** `proxy.conf.json` :
```json
{
  "/api": {
    "target": "http://localhost:8081",
    ...
  }
}
```

### **Problème 4 : 404 Not Found**

Vérifier que :
1. ✅ Le backend expose bien les endpoints à la racine (pas `/api/v1`)
2. ✅ Les routes correspondent exactement (casse comprise)
3. ✅ Le proxy rewrite fonctionne correctement

---

## 🧪 Test Rapide de Connexion

### **Via Postman/Insomnia**

```bash
POST http://localhost:8080/auth/login
Content-Type: application/json

{
  "email": "test@example.com",
  "password": "password123"
}
```

### **Via l'application Angular**

1. Aller sur http://localhost:4200/auth/login
2. Entrer les identifiants
3. Ouvrir la console (F12)
4. Cliquer sur "Se connecter"
5. Vérifier les requêtes dans l'onglet **Network**

---

## 📝 Notes Importantes

1. **Toujours démarrer le backend AVANT le frontend**
2. **Le proxy fonctionne uniquement en mode développement** (`ng serve`)
3. **En production**, vous devrez configurer Nginx ou Apache pour le proxy
4. **Le token JWT est stocké dans localStorage** et ajouté automatiquement à chaque requête

---

## ✅ Checklist de Démarrage

- [ ] Backend Spring Boot démarré sur port 8080
- [ ] Vérifier http://localhost:8080/actuator/health
- [ ] Frontend Angular démarré sur port 4200
- [ ] Vérifier http://localhost:4200
- [ ] Tester la page d'inscription
- [ ] Tester la connexion
- [ ] Vérifier les requêtes dans Network (F12)

---

**🎉 Si tout fonctionne, vous devriez voir les requêtes API passer avec succès dans la console !**
