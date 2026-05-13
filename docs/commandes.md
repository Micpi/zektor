# Guide detaille des commandes

Ce document reference les commandes du workspace Home Assistant-AI.
Objectif: execution fiable, automatisation, et comportement attendu.

## 1) Scripts PowerShell

### 1.1 Verifier la configuration YAML

- Script: `scripts/check_yaml.ps1`
- But: verifier tous les fichiers YAML du workspace.
- Etapes internes:
  - Lance `yamllint` si disponible.
  - Sinon, fait une verification basique (ex: tabulations).
  - Tente une validation Home Assistant via `hass --script check_config` si `hass` est installe.

Commande:

```powershell
pwsh -File scripts/check_yaml.ps1
```

Avec chemin custom:

```powershell
pwsh -File scripts/check_yaml.ps1 -Path "C:\mon\projet"
```

Parametres:

- `-Path` (optionnel): racine a analyser. Par defaut: racine du repo.

Codes retour:

- `0`: validation OK (aucune erreur detectee).
- `1`: erreurs YAML/Home Assistant detectees.

Prerequis:

- `yamllint` (recommande): `pip install yamllint`
- `hass` (optionnel pour validation HA complete)

---

### 1.2 Lancer les tests d integration

- Script: `scripts/test_integration.ps1`
- But: executer la suite pytest sur `tests/` ou sur une integration cible.

Commande (tous les tests):

```powershell
pwsh -File scripts/test_integration.ps1
```

Commande (integration cible):

```powershell
pwsh -File scripts/test_integration.ps1 -Integration "nom_integration"
```

Commande (avec couverture):

```powershell
pwsh -File scripts/test_integration.ps1 -Coverage
```

Parametres:

- `-Integration` (optionnel): sous-dossier cible dans `tests/`.
- `-Coverage` (switch): active `--cov=integrations` + rapport HTML dans `logs/coverage_html`.

Codes retour:

- `0`: tous les tests passent.
- `!= 0`: au moins un test en echec.

Prerequis:

- `pytest`
- `pytest-homeassistant-custom-component`

Installation rapide:

```powershell
pip install pytest pytest-homeassistant-custom-component
```

---

### 1.3 Build d une custom card

- Script: `scripts/build_card.ps1`
- But: builder une carte dans `custom_cards/<CardName>`.
- Comportement:
  - Verifie l existence du dossier carte.
  - Verifie la presence de `package.json`.
  - Lance `npm install` si `node_modules` absent.
  - Lance `npm run build` ou `npm run watch`.
  - Copie le build vers `examples/cartes Lovelace/` si le fichier `dist/<CardName>.js` existe.

Commande:

```powershell
pwsh -File scripts/build_card.ps1 -CardName "naive-flex-card"
```

Mode watch:

```powershell
pwsh -File scripts/build_card.ps1 -CardName "naive-flex-card" -Watch
```

Parametres:

- `-CardName` (obligatoire): nom du dossier carte sous `custom_cards/`.
- `-Watch` (switch): mode watch.

Codes retour:

- `0`: build OK.
- `1`: carte introuvable, `package.json` absent, ou erreur npm.

Prerequis:

- Node.js + npm
- Script `build` defini dans le `package.json` de la carte

---

### 1.4 Auto commit / versionning / tag

- Script: `scripts/auto_commit.ps1`
- But: automatiser commit Git cible HA, version patch, tag, push.
- Scope versionne:
  - `custom_cards/`
  - `integrations/`
- Comportement:
  - Lit les changements dans le scope uniquement.
  - Calcule la prochaine version depuis le dernier tag `vX.Y.Z`.
  - Met a jour `version` dans:
    - `package.json`
    - `hacs.json`
    - `manifest.json`
    des composants modifies.
  - Commit avec message auto ou personnalise.
  - Cree un tag `v<version>` (sauf `-NoTag`).
  - Push branche + tag (sauf `-NoPush`).

Commande standard:

```powershell
pwsh -File scripts/auto_commit.ps1
```

Message personnalise:

```powershell
pwsh -File scripts/auto_commit.ps1 -Message "feat: mise a jour cartes"
```

Commit local sans push:

```powershell
pwsh -File scripts/auto_commit.ps1 -NoPush
```

Commit/push sans tag:

```powershell
pwsh -File scripts/auto_commit.ps1 -NoTag
```

Mode surveillance continue:

```powershell
pwsh -File scripts/auto_commit.ps1 -Watch -IntervalSeconds 10
```

Parametres:

- `-Message` (optionnel): message commit.
- `-NoPush` (switch): pas de push.
- `-NoTag` (switch): pas de tag.
- `-Watch` (switch): boucle de scan + commit auto.
- `-IntervalSeconds` (int, 2..3600): frequence en mode watch.

Codes retour:

- `0`: execution OK.
- `1`: git indisponible, hors repo git, ou erreur commit/tag/push.

Remarques:

- Necessite un repo Git valide (commande refusee hors repo).
- Ne commit pas les autres dossiers hors scope HA.

---

### 1.5 Publication 1 clic depuis le fichier JS actif

- Script: `scripts/publish_current_js.ps1`
- But: partir du fichier JS en cours d edition, detecter la carte, builder, puis publier (commit/version/tag/push).
- Chaine executee:
  - Detection de la carte via le chemin sous `custom_cards/<nom_carte>/...`
  - Build via `scripts/build_card.ps1`
  - Publication Git via `scripts/auto_commit.ps1`

Commande:

```powershell
pwsh -File scripts/publish_current_js.ps1 -CurrentFile "custom_cards/naive-flex-card/naive-flex-card.js"
```

Avec options:

```powershell
pwsh -File scripts/publish_current_js.ps1 -CurrentFile "custom_cards/area-card/alpha-area-card.js" -NoPush
```

Parametres:

- `-CurrentFile` (obligatoire): fichier actif/chemin JS dans `custom_cards/`.
- `-Message` (optionnel): message commit.
- `-NoPush` (switch): commit/tag local uniquement.
- `-NoTag` (switch): commit/push sans tag.

Codes retour:

- `0`: publication OK.
- `!= 0`: echec detection carte, build ou publication Git.

---

## 2) Taches VS Code (tasks.json)

Les taches suivantes sont declarees dans `.vscode/tasks.json`.

### 2.1 HA: Verifier la config YAML

Commande executee:

```powershell
pwsh -File ${workspaceFolder}/scripts/check_yaml.ps1
```

### 2.2 HA: Tests integration (pytest)

Commande executee:

```powershell
pwsh -File ${workspaceFolder}/scripts/test_integration.ps1
```

### 2.3 HA: Build custom card

Commande executee:

```powershell
pwsh -File ${workspaceFolder}/scripts/build_card.ps1 -CardName ${input:cardName}
```

### 2.4 HA: Commit & Push

Commande executee:

```powershell
pwsh -File ${workspaceFolder}/scripts/auto_commit.ps1 -Message ${input:commitMessage}
```

### 2.5 HA: Publish fichier JS courant (1 clic)

Commande executee:

```powershell
pwsh -File ${workspaceFolder}/scripts/publish_current_js.ps1 -CurrentFile ${file}
```

### 2.6 HA: Lint Python (pylint + mypy)

Commande executee:

```powershell
pwsh -Command "pylint integrations/ --rcfile=.pylintrc 2>&1; mypy integrations/ --ignore-missing-imports 2>&1"
```

### 2.7 HA: Pipeline complet (lint + test + yaml)

Tache composee (sequence):

1. HA: Lint Python (pylint + mypy)
2. HA: Verifier la config YAML
3. HA: Tests integration (pytest)

---

## 3) Workflow GitHub Release HACS

- Fichier: `.github/workflows/auto-release-hacs.yml`
- Declencheur:
  - Push sur branche `main`
  - Seulement si changements sous:
    - `custom_cards/**`
    - `integrations/**`
- Etapes:
  - Checkout complet (`fetch-depth: 0`)
  - Calcul du prochain tag (patch) via `mathieudutour/github-tag-action`
  - Creation de release GitHub via `softprops/action-gh-release`

Resultat:

- Release GitHub auto pour installer/mettre a jour via HACS.
- Notes de release generees automatiquement.

---

## 4) Raccourcis pratiques

Executer la verification YAML:

```powershell
pwsh -File scripts/check_yaml.ps1
```

Executer tous les tests:

```powershell
pwsh -File scripts/test_integration.ps1
```

Builder une carte:

```powershell
pwsh -File scripts/build_card.ps1 -CardName "area-card"
```

Auto commit + version + tag + push:

```powershell
pwsh -File scripts/auto_commit.ps1
```

Mode auto continu:

```powershell
pwsh -File scripts/auto_commit.ps1 -Watch -IntervalSeconds 10
```
