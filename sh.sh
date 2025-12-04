#!/bin/bash

echo "🔧 Correction : Remplacement de 'isOperational' par 'active'"
echo "==========================================================="

# Fichier à corriger
FILE="src/app/components/car-management/car-management.component.html"

if [ -f "$FILE" ]; then
    # Remplacement de car.isOperational par car.active
    # On utilise sed. Sur Mac (BSD sed), l'option -i nécessite une extension (ex: -i '').
    # Sur Linux (GNU sed), -i suffit.
    # Cette syntaxe est compatible avec les deux environnements les plus courants si on accepte un fichier backup.
    
    sed -i.bak 's/car\.isOperational/car.active/g' "$FILE"
    
    echo "✅ Remplacé 'car.isOperational' par 'car.active' dans $FILE"
    echo "🗑️ Suppression du fichier de backup (.bak)..."
    rm "${FILE}.bak"
else
    echo "❌ Erreur : Le fichier $FILE n'existe pas."
fi

echo ""
echo "🚀 Relance 'ng serve' pour vérifier."
