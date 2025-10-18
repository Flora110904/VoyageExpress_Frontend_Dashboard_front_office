#!/bin/bash

# Script pour démarrer l'application complète VoyageExpress

echo "🚀 Démarrage de l'application VoyageExpress complète..."
echo ""

# Fonction pour vérifier si un processus existe
check_process() {
    if ps aux | grep -v grep | grep "$1" > /dev/null; then
        return 0
    else
        return 1
    fi
}

# Fonction pour attendre qu'un service soit prêt
wait_for_service() {
    local url=$1
    local service_name=$2
    local max_attempts=30
    local attempt=1

    echo "⏳ En attente du démarrage de $service_name..."

    while [ $attempt -le $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            echo "✅ $service_name est prêt !"
            return 0
        fi

        echo "   Tentative $attempt/$max_attempts..."
        sleep 2
        ((attempt++))
    done

    echo "❌ $service_name n'a pas démarré après $max_attempts tentatives"
    return 1
}

# Vérifier si les ports sont déjà utilisés
if netstat -tuln 2>/dev/null | grep :4201 || netstat -tuln 2>/dev/null | grep :3001; then
    echo "⚠️  Ports déjà utilisés. Nettoyage en cours..."
    pkill -f "ng serve" 2>/dev/null || true
    pkill -f "node.*3001" 2>/dev/null || true
    sleep 2
fi

echo "📦 Vérification des dépendances..."

# Vérifier et installer les dépendances du frontend
if [ ! -d "node_modules" ]; then
    echo "📦 Installation des dépendances frontend..."
    npm install
fi

# Vérifier et installer les dépendances du backend
if [ ! -d "backend/node_modules" ]; then
    echo "📦 Installation des dépendances backend..."
    cd backend && npm install && cd ..
fi

echo ""
echo "🚀 Démarrage des services..."
echo ""

# Démarrer le backend en arrière-plan
echo "🔧 Démarrage du serveur backend (port 3001)..."
cd backend
npm run build
npm start &
BACKEND_PID=$!
cd ..

# Attendre que le backend soit prêt
if ! wait_for_service "http://localhost:3001/health" "Backend API"; then
    echo "❌ Échec du démarrage du backend. Arrêt."
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎨 Démarrage du serveur frontend (port 4201)..."
npm start &
FRONTEND_PID=$!

# Attendre que le frontend soit prêt
if ! wait_for_service "http://localhost:4201" "Frontend Angular"; then
    echo "❌ Échec du démarrage du frontend. Arrêt."
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🎉 Application VoyageExpress démarrée avec succès !"
echo ""
echo "📊 URLs d'accès :"
echo "   🌐 Frontend: http://localhost:4201"
echo "   🔗 Backend API: http://localhost:3001"
echo "   💊 Health Check: http://localhost:3001/health"
echo ""
echo "📱 Comptes de test disponibles :"
echo "   👤 Admin: admin@voyageexpress.tg / password"
echo "   👤 Client: marie.koffi@example.com / password"
echo "   🚌 Compagnie Bus: contact@stc-transport.tg / password"
echo "   ✈️  Compagnie Vol: contact@asky-airlines.tg / password"
echo "   🏨 Établissement: info@lomepalace.tg / password"
echo ""
echo "🛑 Pour arrêter l'application, utilisez Ctrl+C"
echo ""

# Attendre les signaux d'interruption
trap "echo '🛑 Arrêt des services...'; kill $BACKEND_PID 2>/dev/null; kill $FRONTEND_PID 2>/dev/null; exit 0" INT TERM

# Garder le script en vie
wait
