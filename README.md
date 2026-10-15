# Véto+ — aide au diagnostic vétérinaire mixte

Web app (PWA) installable sur iPhone. Tout fonctionne **hors ligne**, sur l’appareil : aucun service externe, aucune clé, aucune donnée envoyée.
Conçue pour un exercice mixte : canine, bovins, ovins, caprins, équins, porcins, faune de parc zoologique et primates (magots).

## Fonctions

- **Saisie du cas en questions successives** : motif, âge, sexe et stade, température, signes, questions ciblées, examen, race, poids. Un choix fait passer à la suite, les valeurs normales de l’espèce sont affichées, l’hypothèse en tête s’affiche en direct
- Compte rendu d’analyses scanné avec « Analyser le texte » de l’iPhone (texte en direct d’iOS, hors ligne) ou collé → valeurs et intervalles
- Interprétation, intervalles par espèce, conversions d’unités
- **Alertes vitales** (K⁺, glycémie, Ca, Mg, lactates, Ht, BHB…)
- Diagnostic différentiel classé (≈ 110 maladies, sources citées), avec un avertissement quand les éléments sont insuffisants et les **signes à rechercher** pour départager les hypothèses (un toucher les ajoute et met à jour le classement)
- **Conduite à tenir et quantités calculées pour le poids** pour une quarantaine d’affections fréquentes
- Médicaments ANMV (3 200+), **temps d’attente**, RCP, calcul de dose
- Calculateurs : fluides, veau diarrhéique, transfusion, électrolytes, RER, dose, unités, gestation
- Maladies réglementées, contacts DDETSPP / GDS / CNITV, fiches faune et herpès B
- Historique sur l’iPhone, PDF partageable (avec la conduite à tenir)

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
3. Ouvrir l’appli une fois avec du réseau : tout est mis en cache (environ 10 Mo), puis elle fonctionne hors ligne.

Les mises à jour sont proposées par un bandeau « Nouvelle version disponible », jamais imposées en pleine consultation.

## À faire valider par le vétérinaire

- **Intervalles de référence** : Réglages → Intervalles de la clinique, pour les adapter aux automates de la clinique. L’intervalle imprimé sur un compte rendu reste toujours prioritaire.
- **Contacts** : dans Réglages, saisir les numéros de la DDETSPP, du GDS et du laboratoire départemental. Ils restent sur l’iPhone.
- Relire la base de maladies (`src/data/diseases.ts`), les seuils d’alerte (`src/engine/alerts.ts`) et les protocoles et posologies (`src/data/treatments.ts`).

## Développement

```bash
npm install
npm run dev          # serveur local
npm test             # tests du moteur, des cas de référence, des doses, du PDF
npm run build        # version de production dans dist/
npm run data:anmv    # retélécharge la base ANMV (nécessite 7z)
```

Structure : `src/data` (espèces, analytes, intervalles, signes, maladies, réglementation, faune), `src/data/wizard.ts` (étapes du parcours), `src/data/treatments.ts` (conduite à tenir), `src/engine` (interprétation, lecture des comptes rendus, alertes, diagnostic différentiel, calculs), `src/screens` (écrans). Les cas de référence (`tests/cases.test.ts`) bloquent la publication en cas de régression.

## Sources

Merck Veterinary Manual ; Kaneko, *Clinical Biochemistry of Domestic Animals* ; Ettinger, *Textbook of Veterinary Internal Medicine* ; Constable, *Veterinary Medicine* (Radostits) ; Smith, *Large Animal Internal Medicine* ; consensus ACVIM, IRIS, ISFM, AAHA, WSAVA, ESCCAP ; Fowler, *Zoo and Wild Animal Medicine* ; CDC (B virus) ; base publique des médicaments vétérinaires ANMV / Anses (data.gouv.fr, licence ouverte) ; DGAL, règlement (UE) 2016/429 et règlement d’exécution 2018/1882.

> Outil d’aide à la décision destiné aux vétérinaires. Il ne remplace ni l’examen clinique ni le jugement professionnel. Vérifier toute posologie dans le RCP.
