# 📦 Guide: Publier une carte ou intégration sur GitHub + HACS

> Liste des dépôts (URL, versions, statut) : voir la source unique
> [`README_WORKSPACE_CATALOG.md`](../README_WORKSPACE_CATALOG.md) à la racine
> du workspace, régénérée par `scripts/generate_workspace_catalog.ps1`.
> Ne pas dupliquer cette liste ici - elle dérive trop vite.

## Structure

Chaque carte (`custom_cards/<nom>/`) et chaque intégration (`integrations/<Nom>/`)
est un repo Git indépendant, avec son propre `hacs.json` à la racine du dossier :

```text
custom_cards/<nom>/
├── <nom>.js
├── hacs.json          (conforme HACS)
├── package.json       (si build npm)
├── README.md
├── .gitignore
└── .git/              ✅ repo independant, push vers GitHub

integrations/<Nom>/
├── custom_components/<domaine>/
├── hacs.json
├── README.md
└── .git/              ✅ repo independant, push vers GitHub
```

**Avantages:**

- Une seule source de vérité par carte/intégration (pas de duplication)
- Versionning local indépendant dans chaque dossier
- Prêt pour HACS immédiatement

---

## Nouveau flux recommandé

Pour une nouvelle carte:

```powershell
.\scripts\new-custom-card.ps1 -CardName my-awesome-card -DisplayName "My Awesome Card"
```

Puis:

1. Ouvrir `custom_cards/my-awesome-card/my-awesome-card.js`
2. Adapter la carte
3. Lancer `Publish HA` depuis VS Code sur ce fichier actif

`Publish HA` sait:

- créer `README.md`, `hacs.json` et `.gitignore` s'ils manquent
- initialiser Git dans le dossier de la carte si besoin
- calculer la prochaine version et mettre à jour `package.json`
- créer le repo GitHub s'il n'existe pas
- pousser `main` et le tag correspondant

Pour une nouvelle intégration, utiliser `scripts/release_hacs.ps1` /
`scripts/publish_current_integration.ps1` (voir `AGENTS.md` pour la règle
de release HACS obligatoire).

---

## Étape 1: Créer le repo GitHub (si pas déjà fait)

### Option A: Manuellement (interface web)

1. Allez sur <https://github.com/new>
2. Repository name: le nom du dossier (voir catalogue pour le nom exact)
3. Owner: `Micpi`
4. Description: récupérez depuis le README.md
5. Public
6. **Initialize empty** (NE PAS cocher "Add README")
7. Créer

### Option B: Via CLI GitHub (gh)

```powershell
gh repo create Micpi/<nom-du-repo> --public --source=custom_cards/<nom>
```

---

## Étape 2: Pousser vers GitHub

**Automatisé (recommandé):**

```powershell
.\scripts\push-custom-cards-github.ps1
# Vous sera demandé le token GitHub
```

Ou avec token directement:

```powershell
.\scripts\push-custom-cards-github.ps1 -GitHubToken "ghp_xxxx..."
```

Ou sans prompt en définissant une variable d'environnement:

```powershell
$env:GITHUB_TOKEN = "ghp_xxxx..."
pwsh -File .\scripts\publish_current_js.ps1 -CurrentFile .\custom_cards\my-awesome-card\my-awesome-card.js
```

**Manuellement (pour une carte):**

```powershell
cd custom_cards/my-awesome-card
git remote add origin https://github.com/Micpi/my-awesome-card.git
git push -u origin main
git push origin v0.1.0
```

---

## Étape 3: Ajouter le dépôt dans HACS

Dans Home Assistant:

1. **HACS** → **Custom repositories**
2. Ajouter:
   - **URL**: l'URL du dépôt GitHub (voir [`README_WORKSPACE_CATALOG.md`](../README_WORKSPACE_CATALOG.md))
   - **Type**: `Lovelace` pour une carte, `Integration` pour une intégration
   - Cliquer **Create**
3. Attendre 30 secondes, puis vérifier que l'élément apparaît
4. **Installer** depuis HACS
5. Pour une carte, ajouter la ressource dans Lovelace:

```yaml
resources:
  - url: /hacsfiles/<nom-du-repo>/<nom-du-repo>.js
    type: module
```

---

## Troubleshooting

### L'élément n'apparaît pas dans HACS après ajout du dépôt

- Attendre 1-2 minutes (cache HACS)
- Ctrl+Shift+R pour hard refresh dans Home Assistant
- Supprimer/ré-ajouter le dépôt custom

### "Repository structure is not compliant" dans HACS

- Vérifier que `hacs.json` existe dans le dossier racine du repo
- Vérifier le contenu de `hacs.json`, exemple pour une carte:

  ```json
  {
    "name": "Ma Carte",
    "content_in_root": false,
    "filename": "ma-carte.js",
    "render_readme": true,
    "homeassistant": "2024.1.0"
  }
  ```

- Vérifier que le tag de version existe: `git tag -l` dans le dossier concerné

### Erreur de push "Permission denied"

- Vérifier que le token GitHub a accès `repo` (full)
- Vérifier que le repo existe sur GitHub
- Régénérer le token si nécessaire

### Le bouton `Publish HA` demande encore un token

- Vérifier que `GITHUB_TOKEN` est défini dans l'environnement VS Code
- Sinon passer `-GitHubToken` au script
- Sinon le prompt interactif s'affiche automatiquement

---

## Maintenance du workspace

- Les cartes/intégrations restent dans `custom_cards/` et `integrations/` pour le développement local
- Les repos GitHub sont la source de vérité pour HACS
- À chaque push, HACS détecte automatiquement la nouvelle version (si tag créé)
- Après toute publication, régénérer le catalogue: `pwsh -File scripts/generate_workspace_catalog.ps1`

## Support

- Générateur de carte: `scripts/new-custom-card.ps1`
- Publication 1 clic (carte): `scripts/publish_current_js.ps1`
- Publication 1 clic (intégration): `scripts/publish_current_integration.ps1`
- Publication globale: `scripts/publish_all_drivers.ps1`
- Script de push (legacy, cartes uniquement): `scripts/push-custom-cards-github.ps1`
- Doc HACS officielle: <https://hacs.xyz/>
- Instructions agents IA: [`AGENTS.md`](../AGENTS.md), [`.github/copilot-instructions.md`](../.github/copilot-instructions.md)
