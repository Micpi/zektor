# 📦 Guide: Publier les 5 cartes sur GitHub + HACS

## Structure actuelle

Les 5 cartes sont **directement dans `custom_cards/`** et initialisées comme repos Git indépendants:

```
custom_cards/
├── thermo-halo-card/
│   ├── thermo-halo-card.js
│   ├── hacs.json          (conforme HACS)
│   ├── README.md          (optionnel)
│   ├── .gitignore
│   ├── example.yaml       (optionnel)
│   └── .git/              ✅ (initialisé, main, tag: v0.1.0)
├── naive-flex-card/
│   ├── naive-flex-card.js
│   ├── hacs.json
│   ├── package.json       (pour build npm)
│   ├── .gitignore
│   ├── README.md
│   └── .git/              ✅
├── area-card/
│   ├── alpha-area-card.js
│   ├── hacs.json
│   ├── package.json
│   ├── .gitignore
│   └── .git/              ✅
├── activity-select-card/
│   ├── activity-select-card.js
│   ├── hacs.json
│   ├── .gitignore
│   └── .git/              ✅
└── iOS-PopUp-card/
    ├── ios-popup-card.js
    ├── hacs.json
    ├── .gitignore
    └── .git/              ✅
```

**Avantages:**
- Une seule source de vérité (pas de duplication)
- Chaque carte = repo Git indépendant
- Versionning local dans chaque dossier
- Prêt pour HACS immédiatement

---

## Nouveau flux recommande

Pour une nouvelle carte:

```powershell
.\scripts\new-custom-card.ps1 -CardName my-awesome-card -DisplayName "My Awesome Card"
```

Puis:

1. Ouvrir `custom_cards/my-awesome-card/my-awesome-card.js`
2. Adapter la carte
3. Lancer `Publish HA` depuis VS Code sur ce fichier actif

`Publish HA` sait maintenant:
- creer `README.md`, `hacs.json` et `.gitignore` s'ils manquent
- initialiser Git dans le dossier de la carte si besoin
- calculer la prochaine version et mettre a jour `package.json`
- creer le repo GitHub s'il n'existe pas
- pousser `main` et le tag correspondant

---

## Étape 1: Créer les repos GitHub

**Option A: Manuellement (interface web)**

Pour chaque carte:
1. Allez sur https://github.com/new
2. Repository name: `thermo-halo-card` (adapter pour chaque)
3. Owner: `Micpi`
4. Description: récupérez depuis le README.md
5. Public
6. **Initialize empty** (NE PAS cocher "Add README")
7. Créer

Repos à créer:
- `https://github.com/Micpi/thermo-halo-card`
- `https://github.com/Micpi/naive-flex-card`
- `https://github.com/Micpi/alpha-area-card`
- `https://github.com/Micpi/activity-select-card`
- `https://github.com/Micpi/ios-popup-card`

**Option B: Via CLI GitHub (gh)**

```powershell
gh auth login

foreach ($card in @("thermo-halo-card", "naive-flex-card", "alpha-area-card", "activity-select-card", "ios-popup-card")) {
    gh repo create Micpi/$card --public --source=custom_cards/$(Get-ChildItem custom_cards | where {$_.Name -like "*$card*"} | select -ExpandProperty Name)
}
```

---

## Étape 2: Pousser les cartes vers GitHub

**Automatisé (recommandé):**

```powershell
.\scripts\push-custom-cards-github.ps1
# Vous sera demandé le token GitHub
```

Ou avec token directement:

```powershell
.\scripts\push-custom-cards-github.ps1 -GitHubToken "ghp_xxxx..."
```

Ou sans prompt en definissant une variable d'environnement:

```powershell
$env:GITHUB_TOKEN = "ghp_xxxx..."
pwsh -File .\scripts\publish_current_js.ps1 -CurrentFile .\custom_cards\my-awesome-card\my-awesome-card.js
```

**Manuellement (pour une carte):**

```powershell
cd custom_cards/thermo-halo-card

git remote add origin https://github.com/Micpi/thermo-halo-card.git
git push -u origin main
git push origin v0.1.0

# Répéter pour chaque carte
cd ../naive-flex-card
# ...etc
```

---

## Étape 3: Ajouter les cartes dans HACS

Dans Home Assistant:

1. **HACS** → **Custom repositories**
2. Pour chaque carte, ajouter:
   - **URL**: `https://github.com/Micpi/thermo-halo-card` (adapter le nom)
   - **Type**: Lovelace
   - Cliquer **Create**
3. Attendre 30 secondes, puis vérifier que la carte apparaît
4. **Installer** depuis HACS
5. Ajouter la ressource dans Lovelace:

```yaml
resources:
  - url: /hacsfiles/thermo-halo-card/thermo-halo-card.js
    type: module
  - url: /hacsfiles/naive-flex-card/naive-flex-card.js
    type: module
  - url: /hacsfiles/alpha-area-card/alpha-area-card.js
    type: module
  - url: /hacsfiles/activity-select-card/activity-select-card.js
    type: module
  - url: /hacsfiles/ios-popup-card/ios-popup-card.js
    type: module
```

---

## Troubleshooting

### Les cartes n'apparaissent pas dans HACS après ajout du repo

- Attendre 1-2 minutes (cache HACS)
- Ctrl+Shift+R pour hard refresh dans Home Assistant
- Supprimer/ré-ajouter le repo custom

### "Repository structure is not compliant" dans HACS

- Vérifier que `hacs.json` existe dans le dossier racine du repo
- Vérifier le contenu de `hacs.json`:
  ```json
  {
    "name": "Thermo Halo Card",
    "content_in_root": false,
    "filename": "thermo-halo-card.js",
    "render_readme": true,
    "homeassistant": "2024.1.0"
  }
  ```
- Vérifier que le tag `v0.1.0` existe: `cd custom_cards/thermo-halo-card && git tag -l`

### Erreur de push "Permission denied"

- Vérifier que le token GitHub a accès `repo` (full)
- Vérifier que les repos existent sur GitHub
- Regénérer le token si nécessaire

### Le bouton `Publish HA` demande encore un token

- Verifier que `GITHUB_TOKEN` est defini dans l'environnement VS Code
- Sinon passer `-GitHubToken` au script
- Sinon le prompt interactif s'affiche automatiquement

---

---

## Fichiers de configuration

### hacs.json (chaque dossier custom_cards/<card>)

```json
{
  "name": "Thermo Halo Card",
  "content_in_root": false,
  "filename": "thermo-halo-card.js",
  "render_readme": true,
  "homeassistant": "2024.1.0"
}
```

### .gitignore (créé automatiquement dans chaque carte)

```
node_modules/
*.log
.npm/
dist/
.DS_Store
```

---

## Prochaines étapes

### Après publication HACS initiale

**Versionning des cartes:**

Chaque fois qu'une carte est modifiée:

```powershell
cd custom_cards/thermo-halo-card
git add .
git commit -m "feat: description of change"
git push origin main

# Créer une nouvelle version (SemVer)
git tag v0.2.0
git push origin v0.2.0
```

**Maintenance du workspace:**

- Les cartes restent dans `custom_cards/` pour développement local
- Les repos GitHub sont la source de vérité pour HACS
- À chaque push d'une carte, HACS détecte automatiquement la nouvelle version

---

## Support

- Generateur de carte: `scripts/new-custom-card.ps1`
- Publication 1 clic: `scripts/publish_current_js.ps1`
- Script de push: `scripts/push-custom-cards-github.ps1`
- Doc HACS officielle: https://hacs.xyz/
- Instructions Copilot: `.vscode/copilot-instructions.md`
