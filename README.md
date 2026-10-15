# Véto+ — aide au diagnostic vétérinaire mixte

Web app (PWA) installable sur iPhone. Elle fonctionne **hors ligne** et peut utiliser une IA gratuite quand le réseau est disponible.
Conçue pour un exercice mixte : canine, bovins, ovins, caprins, équins, porcins, faune de parc zoologique et primates (magots).

## Fonctions

| | Hors ligne | En ligne (IA) |
|---|---|---|
| Photo d’un compte rendu d’analyses → valeurs | Tesseract (sur l’iPhone) | Gemini / Mistral (vision) |
| Interprétation, intervalles par espèce, conversions d’unités | ✅ | ✅ |
| **Alertes vitales** (K⁺, glycémie, Ca, Mg, lactates, Ht, BHB…) | ✅ | ✅ |
| Diagnostic différentiel classé (≈ 90 maladies, sources citées) | ✅ | + avis critique de l’IA, questions de suivi |
| Médicaments ANMV (3 200+), **temps d’attente**, RCP, calcul de dose | ✅ | ✅ |
| Calculateurs : fluides, veau diarrhéique, transfusion, électrolytes, RER, dose, unités, gestation | ✅ | ✅ |
| Maladies réglementées, contacts DDETSPP / GDS / CNITV, fiches faune et herpès B | ✅ | ✅ |
| Dictée vocale (touche micro du clavier iOS, sur l’iPhone), historique chiffré sur l’iPhone, PDF partageable | ✅ | ✅ |

Un bandeau indique en permanence l’état **En ligne / Hors ligne** et l’état de chaque IA (quota atteint, clé invalide, panne). Si Gemini échoue, Mistral prend le relais.

## Mise en ligne (gratuite, GitHub Pages) — une seule fois

1. Créer un compte sur [github.com](https://github.com), puis un dépôt **public** vide nommé par exemple `veto-plus`.
2. Envoyer ce dossier dans le dépôt :
   ```bash
   git init && git add . && git commit -m "Véto+" && git branch -M main
   git remote add origin https://github.com/<votre-compte>/veto-plus.git
   git push -u origin main
   ```
3. Sur GitHub : **Settings → Pages → Source : GitHub Actions**.
4. Après 1 à 2 minutes, l’appli est publiée sur `https://<votre-compte>.github.io/veto-plus/`.

Chaque `git push` republie l’appli. La base médicaments est retéléchargée automatiquement le 1er de chaque mois. GitHub suspend les tâches planifiées après 60 jours sans activité sur le dépôt : relancer alors depuis l’onglet **Actions → Publication → Run workflow**.

## Installation sur l’iPhone du vétérinaire

1. Ouvrir l’adresse dans **Safari**.
2. Bouton **Partager** → **Sur l’écran d’accueil**.
3. Ouvrir l’appli une fois avec du réseau : tout est mis en cache (environ 20 Mo), puis elle fonctionne hors ligne.

Les mises à jour sont proposées par un bandeau « Nouvelle version disponible », jamais imposées en pleine consultation.

## Clés IA gratuites (facultatives)

Dans **Réglages**, coller une ou deux clés, puis toucher **Tester** :

- **Google Gemini** (recommandé, le meilleur pour lire les photos) : [aistudio.google.com/apikey](https://aistudio.google.com/apikey). Attention : avec l’offre gratuite, Google peut utiliser les données envoyées pour améliorer ses modèles.
- **Mistral** (entreprise française) : [console.mistral.ai/api-keys](https://console.mistral.ai/api-keys). Si la console affiche « Passez à un plan supérieur », toucher **Mettre à niveau** et choisir l’offre gratuite **Experiment** (vérification par téléphone, sans carte bancaire), pas l’offre payante Scale. Attention : avec l’offre gratuite, les données envoyées peuvent aussi servir à entraîner les modèles de Mistral.

Les modèles les plus récents sont détectés automatiquement. Les clés restent sur l’iPhone. La référence de l’animal ou de l’élevage n’est jamais envoyée.

## À faire valider par le vétérinaire

- **Intervalles de référence** : Réglages → Intervalles de la clinique, pour les adapter aux automates de la clinique. L’intervalle imprimé sur un compte rendu reste toujours prioritaire.
- **Contacts** : dans Réglages, saisir les numéros de la DDETSPP, du GDS et du laboratoire départemental. Ils restent sur l’iPhone.
- Relire la base de maladies (`src/data/diseases.ts`) et les seuils d’alerte (`src/engine/alerts.ts`).

## Développement

```bash
npm install
npm run dev          # serveur local
npm test             # tests du moteur, de l’OCR, du relais IA, du PDF
npm run build        # version de production dans dist/
npm run data:anmv    # retélécharge la base ANMV (nécessite 7z)
```

Structure : `src/data` (espèces, analytes, intervalles, signes, maladies, réglementation, faune), `src/engine` (interprétation, alertes, diagnostic différentiel, calculs), `src/ocr` (Tesseract + analyse du texte), `src/ai` (fournisseurs, relais, consignes), `src/screens` (écrans).

## Sources

Merck Veterinary Manual ; Kaneko, *Clinical Biochemistry of Domestic Animals* ; Ettinger, *Textbook of Veterinary Internal Medicine* ; Constable, *Veterinary Medicine* (Radostits) ; Smith, *Large Animal Internal Medicine* ; consensus ACVIM, IRIS, ISFM, AAHA, WSAVA, ESCCAP ; Fowler, *Zoo and Wild Animal Medicine* ; CDC (B virus) ; base publique des médicaments vétérinaires ANMV / Anses (data.gouv.fr, licence ouverte) ; DGAL, règlement (UE) 2016/429 et règlement d’exécution 2018/1882.

> Outil d’aide à la décision destiné aux vétérinaires. Il ne remplace ni l’examen clinique ni le jugement professionnel. Vérifier toute posologie dans le RCP.
