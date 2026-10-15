# Véto+ — fiche de test (iPhone)

Adresse de l’appli : **https://theresnobodyheere.github.io/veto-plus/**
Testeur : ……………………… Date : ……/……/…… Version (Réglages → À propos) : ………

> Outil d’aide à la décision en cours de validation. Ne pas l’utiliser seul pour une décision clinique pendant le test.

## 1. Installer l’appli (2 min)

1. Ouvrir l’adresse ci-dessus dans **Safari**, avec du réseau.
2. Toucher **Partager**, puis **Sur l’écran d’accueil**, puis **Ajouter**.
3. Ouvrir Véto+ depuis l’écran d’accueil et attendre 30 secondes : tout est téléchargé (environ 20 Mo). L’appli fonctionne ensuite sans réseau.

## 2. Créer les clés IA gratuites (facultatif, 5 min)

L’appli fonctionne sans IA. L’IA améliore la lecture des photos et ajoute un avis argumenté.

- **Mistral** (entreprise française) : console.mistral.ai/api-keys → si la console demande de « passer à un plan supérieur » : **Mettre à niveau** → offre gratuite **Experiment** (vérification par téléphone, sans carte bancaire ; ne pas choisir Scale, payante) → **API Keys** → **Create new key** → copier. Avec l’offre gratuite, les données envoyées peuvent servir à entraîner les modèles de Mistral.
- **Google Gemini** (le meilleur pour lire les photos) : aistudio.google.com/apikey → **Create API key** → copier. Avec l’offre gratuite, Google peut utiliser les données envoyées.
- Dans Véto+ : **Réglages** → coller la clé → **Tester**. Un message vert indique le modèle trouvé.

Ce qui part vers l’IA : valeurs, signes, commentaire et photos. La voix n’est jamais envoyée à l’IA (dictée du clavier iOS). Jamais la référence de l’animal. **Ne dites ni n’écrivez de nom de propriétaire.**

Dictée : touchez le champ de texte, puis la touche micro en bas à droite du clavier, et parlez (si elle n’apparaît pas : Réglages de l’iPhone → Général → Clavier → Activer la dictée). Le texte s’écrit au fur et à mesure, avec ou sans réseau.

## 3. Cinq scénarios à tester

| # | Scénario | À faire | Points à vérifier |
|---|---|---|---|
| 1 | **Photo d’un bilan IDEXX de la clinique** | Cas → Chien (ou Chat) → Photos → **Analyses** → photographier un vrai compte rendu, bien à plat | Toutes les valeurs lues ? Unités correctes ? Intervalles du compte rendu repris ? Valeurs hors normes en couleur ? |
| 2 | **Vache couchée après vêlage** | Cas → Bovin → signes « Décubitus » + « Mise bas récente » ; ajouter calcémie, Mg, P, BHB si disponibles → **Analyser** | Fièvre de lait en tête ? Alerte vitale si Ca très bas ? Diagnostics différentiels pertinents (paralysie obstétricale, mammite colibacillaire…) ? Temps d’attente des produits proposés dans Médicaments ? |
| 3 | **Chien qui vomit avec bilan rénal** | Cas → Chien → « Vomissements », « Anorexie », « PUPD » ; saisir urée, créatinine, phosphore, K⁺ (ou photo) ; essayer la **dictée** (micro du clavier) dans le commentaire | IRA/MRC, intoxication, Addison proposés ? Alerte si K⁺ élevé ? Interprétation de l’atteinte rénale cohérente ? La dictée fonctionne-t-elle ? |
| 4 | **Colique de cheval** | Cas → Équidé → « Douleur abdominale », « Tachycardie », lactates si disponibles ; Outils → **Fluidothérapie** pour 500 kg | Classement des causes de colique logique ? Seuils lactates / FC pertinents ? Calcul des fluides juste ? |
| 5 | **Mode avion** | Activer le mode avion, rouvrir Véto+, refaire le scénario 2 ; chercher un médicament ; générer le **PDF** et le partager | Bandeau « Hors ligne » visible ? Diagnostic, médicaments et calculateurs disponibles ? PDF lisible et partageable (Mail, AirDrop) ? |

Pour chaque scénario, noter aussi : lisibilité en plein jour et la nuit (mode sombre), taille du texte, rapidité.

## 4. Grille de relevé

**Erreurs médicales** (diagnostic absent ou mal classé, alerte injustifiée ou manquante, conduite à tenir erronée)

| Scénario | Ce que l’appli affiche | Ce qui est attendu | Gravité (1 mineure → 3 dangereuse) |
|---|---|---|---|
| | | | |
| | | | |
| | | | |

**Intervalles de référence à corriger** (selon les automates de la clinique)

| Espèce | Analyte | Intervalle affiché | Intervalle de la clinique | Unité |
|---|---|---|---|---|
| | | | | |
| | | | | |
| | | | | |

**Fonctions manquantes ou gênantes**

| Écran | Ce qui manque ou gêne | Importance (souhaitable / important / indispensable) |
|---|---|---|
| | | |
| | | |

**Contacts à saisir dans Réglages** (ils restent sur l’iPhone) : DDETSPP, GDS et laboratoire départemental.

Merci de renvoyer cette fiche (photo ou PDF) avec, si possible, des captures d’écran des erreurs (bouton latéral + volume haut).
