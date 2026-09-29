#!/bin/bash

# Charger nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Se placer dans le répertoire de l'app
cd "$(dirname "$0")" || exit 1

# Démarrer le serveur de dev en arrière-plan
npm run dev &
DEV_PID=$!

# Attendre que le serveur soit prêt (max 30 secondes)
for i in {1..30}; do
  if curl -sf http://localhost:5173 > /dev/null 2>&1; then
    echo "✅ Serveur démarré! Ouverture dans le navigateur..."
    open http://localhost:5173
    break
  fi
  sleep 1
done

# Si on tue ce script (Ctrl+C), arrêter aussi le serveur de dev
trap "kill $DEV_PID" EXIT

# Garder le script en vie
wait $DEV_PID
