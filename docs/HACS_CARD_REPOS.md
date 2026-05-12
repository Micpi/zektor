# 📦 Guide: Publier les 5 cartes sur GitHub + HACS

## Structure actuelle

Les 5 repos séparés sont générés dans `card-repos/` :

```
card-repos/
├── thermo-halo-card/
│   ├── thermo-halo-card.js
│   ├── hacs.json (conforme HACS)
│   ├── README.md
│   ├── .gitignore
│   └── .git/ (initialisé, main, tag: v0.1.0)
├── naive-flex-card/
├── alpha-area-card/
├── activity-select-card/
└── ios-popup-card/
```

Chaque repo est **complètement indépendant** et prêt à être poussé.

---

## Étape 1: Créer les repos GitHub

**Option A: Manuellement (interface web)**

Pour chaque carte:
1. Allez sur https://github.com/new
2. Repository name: `<card-name>` (ex: `thermo-halo-card`)
3. Owner: `Micpi`
4. Description: Récupérez depuis le README.md généré
5. Public
6. **Initialize empty** (NE PAS cocher "Add README")
7. Créer

**Option B: Via CLI GitHub (gh)**

```powershell
# Installer GitHub CLI: https://cli.github.com/
gh auth login

# Créer chaque repo
gh repo create Micpi/thermo-halo-card --public --remote=origin --source=card-repos/thermo-halo-card
gh repo create Micpi/naive-flex-card --public --remote=origin --source=card-repos/naive-flex-card
# ... etc
```

---

## Étape 2: Pousser les cartes vers GitHub

**Option A: Automatisé (avec token)**

```powershell
# Générer un token: https://github.com/settings/tokens/new
# Sélectionner: repo (full control of private repositories)

.\scripts\push-card-repos-github.ps1
# Vous sera demandé le token GitHub
```

Ou:

```powershell
.\scripts\push-card-repos-github.ps1 -GitHubToken "ghp_xxxx..."
```

**Option B: Manuellement (pour chaque repo)**

```powershell
cd card-repos/thermo-halo-card

git remote add origin https://github.com/Micpi/thermo-halo-card.git
git push -u origin main
git push origin v0.1.0

# Répéter pour chaque carte
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
  # ... etc pour chaque carte
```

---

## Troubleshooting

### Les cartes n'apparaissent pas dans HACS après ajout du repo

- Attendre 1-2 minutes (cache HACS)
- Ctrl+Shift+R pour hard refresh dans Home Assistant
- Supprimer/ré-ajouter le repo custom

### "Repository structure is not compliant" dans HACS

- Vérifier que `hacs.json` existe dans chaque repo
- Vérifier le contenu (doit avoir `filename`, `name`)
- Vérifier que le tag `v0.1.0` existe: `git tag -l`

### Erreur de push "Permission denied"

- Vérifier que le token GitHub a accès `repo` (full)
- Vérifier que les repos existent sur GitHub
- Regénérer le token si nécessaire

---

## Fichiers de configuration générés

### hacs.json (chaque repo)

```json
{
  "name": "Thermo Halo Card",
  "content_in_root": false,
  "filename": "thermo-halo-card.js",
  "render_readme": true,
  "homeassistant": "2024.1.0"
}
```

### README.md (chaque repo)

- Description de la carte
- Installation depuis HACS
- Code d'ajout à Lovelace

### .gitignore

Standard pour JS/Node:
```
node_modules/
*.log
.npm/
dist/
.DS_Store
```

---

## Prochaines étapes

**Après publication HACS:**

1. **Versionning**: Chaque fois qu'une carte est modifiée:
   - Modifier la carte
   - `cd card-repos/<card-name>`
   - `git add .`
   - `git commit -m "feat: description"`
   - `git push origin main`
   - `git tag vX.Y.Z` (SemVer)
   - `git push origin vX.Y.Z`

2. **Maintenance du workspace principal**:
   - Les cartes restent dans `custom_cards/` pour dev
   - Les repos GitHub sont la source de vérité pour HACS
   - Syncer manuellement si changements majeurs

---

## Questions / Support

- Vérifier `scripts/` pour les scripts d'automatisation
- Consulter la doc HACS officielle: https://hacs.xyz/
- Consulter les instructions VS Code dans `.vscode/copilot-instructions.md`
