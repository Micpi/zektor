# Workspace Agent Rules

## Release HACS apres modification

- Apres toute modification touchant `custom_cards/` ou `integrations/`, ne pas considerer la tache terminee tant qu'une release HACS n'a pas ete preparee.
- Verifier et aligner les versions avant release:
  - Cartes: `package.json` + `hacs.json`.
  - Integrations: `manifest.json` + `hacs.json`.
- Mettre a jour le `CHANGELOG.md` du composant quand il existe.
- Pour les cartes, regenerer le build/dist avant publication.
- Utiliser en priorite `scripts/release_hacs.ps1`, qui aligne les versions, regenere le build des cartes, met a jour le changelog detaille, cree le commit, le tag et la release GitHub.
- Pour publier tous les drivers en serie, utiliser `scripts/publish_all_drivers.ps1`.
- Sauf demande explicite de l'utilisateur (`local only`, `pas de release`, `no push`), finir les modifications HACS-ready avec tag/release GitHub afin que HACS voie la mise a jour.
