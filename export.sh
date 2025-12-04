#!/bin/sh

# Dossier Angular à concaténer
SRC_DIR="./src"

# Fichier de sortie
OUTPUT_FILE="src-concat.txt"

# On réinitialise le fichier de sortie
> "$OUTPUT_FILE"

# Parcours récursif de tous les fichiers
find "$SRC_DIR" -type f | while read FILE; do
  echo "====== Fichier : $FILE ======" >> "$OUTPUT_FILE"
  cat "$FILE" >> "$OUTPUT_FILE"
  echo "\n" >> "$OUTPUT_FILE"
done

echo "Concaténation terminée dans $OUTPUT_FILE"

