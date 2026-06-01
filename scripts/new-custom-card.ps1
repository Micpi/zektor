<#
.SYNOPSIS
    Genere une nouvelle custom card Home Assistant prete a publier.
.DESCRIPTION
    Cree un dossier dans custom_cards/ avec:
    - fichier JS principal base sur le template existant
    - package.json avec script build vers dist/
    - hacs.json conforme
    - README.md
    - example.yaml
    - .gitignore

    Le dossier genere peut ensuite etre publie avec scripts/publish_current_js.ps1.
.PARAMETER CardName
    Nom de la carte en kebab-case, idealement termine par -card.
.PARAMETER DisplayName
    Nom lisible affiche dans HACS et la documentation.
.PARAMETER EntityId
    Entite exemple pre-remplie dans le template.
.PARAMETER OutputRoot
    Dossier racine contenant les cartes.
.PARAMETER Force
    Autorise l'ecrasement si le dossier existe deja.
#>
[CmdletBinding()]
param(
  [string]$CardName,
  [string]$DisplayName,
  [string]$EntityId = 'sensor.example',
  [string]$OutputRoot = 'custom_cards',
  [switch]$Force
)

$ErrorActionPreference = 'Stop'

function Write-Info([string]$Message) { Write-Host "[INFO] $Message" -ForegroundColor Blue }
function Write-OK([string]$Message) { Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-Fail([string]$Message) { Write-Host "[KO] $Message" -ForegroundColor Red }

function Convert-KebabToPascalCase {
  param([string]$Value)

  (($Value -split '-') | Where-Object { $_ } | ForEach-Object {
    if ($_.Length -eq 1) { $_.ToUpperInvariant() }
    else { $_.Substring(0, 1).ToUpperInvariant() + $_.Substring(1) }
  }) -join ''
}

function Convert-KebabToDisplayName {
  param([string]$Value)

  (($Value -split '-') | Where-Object { $_ } | ForEach-Object {
    switch ($_.ToLowerInvariant()) {
      'ios' { 'iOS' }
      default {
        if ($_.Length -eq 1) { $_.ToUpperInvariant() }
        else { $_.Substring(0, 1).ToUpperInvariant() + $_.Substring(1) }
      }
    }
  }) -join ' '
}

if ([string]::IsNullOrWhiteSpace($CardName)) {
  $CardName = Read-Host 'Nom de la carte (kebab-case, ex: my-awesome-card)'
}

if ($CardName -notmatch '^[a-z0-9]+(-[a-z0-9]+)*$') {
  Write-Fail 'CardName doit etre en kebab-case (ex: my-awesome-card).'
  exit 1
}

$root = (Resolve-Path "$PSScriptRoot\..").Path
$templatePath = Join-Path $root 'templates\button_cards\my-card-template.js'
if (-not (Test-Path $templatePath)) {
  Write-Fail "Template introuvable: $templatePath"
  exit 1
}

$cardFolder = Join-Path $root $OutputRoot
if (-not (Test-Path $cardFolder)) {
  New-Item -ItemType Directory -Path $cardFolder -Force | Out-Null
}

$cardPath = Join-Path $cardFolder $CardName
if (Test-Path $cardPath) {
  $hasContent = @(Get-ChildItem -Path $cardPath -Force).Count -gt 0
  if ($hasContent -and -not $Force) {
    Write-Fail "Le dossier existe deja et n'est pas vide: $cardPath"
    exit 1
  }
}
else {
  New-Item -ItemType Directory -Path $cardPath -Force | Out-Null
}

if ([string]::IsNullOrWhiteSpace($DisplayName)) {
  $suggestedDisplay = Convert-KebabToDisplayName -Value $CardName
  $displayInput = Read-Host "Display name (laisser vide pour '$suggestedDisplay')"
  $DisplayName = if ([string]::IsNullOrWhiteSpace($displayInput)) { $suggestedDisplay } else { $displayInput }
}

if (-not $DisplayName) {
  $DisplayName = Convert-KebabToDisplayName -Value $CardName
}

$entryFileName = "$CardName.js"
$className = Convert-KebabToPascalCase -Value $CardName
$editorClassName = "${className}Editor"
$editorElementName = "$CardName-editor"
$description = "$DisplayName for Home Assistant"

$existingJsFiles = @()
if (Test-Path $cardPath) {
  $existingJsFiles = @(Get-ChildItem -Path $cardPath -Filter '*.js' -File)
}

if ($existingJsFiles.Count -gt 0) {
  if ($existingJsFiles.Name -contains $entryFileName) {
    Write-Info "Fichier JS existant detecte: $entryFileName (conserve)"
  }
  else {
    $entryFileName = $existingJsFiles[0].Name
    Write-Info "Fichier JS existant detecte: $entryFileName (utilise comme entree)"
  }
}

$templateContent = Get-Content $templatePath -Raw
$templateContent = $templateContent.Replace('MyCardEditor', $editorClassName)
$templateContent = $templateContent.Replace('MyCard', $className)
$templateContent = $templateContent.Replace('my-card-editor', $editorElementName)
$templateContent = $templateContent.Replace('my-card', $CardName)
$templateContent = $templateContent.Replace('My Card', $DisplayName)
$templateContent = $templateContent.Replace('sensor.example', $EntityId)
$templateContent = $templateContent.Replace('Template de custom card Home Assistant.', "$DisplayName custom card for Home Assistant.")

$jsPath = Join-Path $cardPath $entryFileName
if (-not (Test-Path $jsPath)) {
  Set-Content -Path $jsPath -Value $templateContent
  Write-OK "Fichier JS cree: $entryFileName"
}
else {
  Write-Info "Fichier JS conserve sans ecrasement: $entryFileName"
}

$buildCommand = 'node -e "const fs=require(''fs'');fs.mkdirSync(''dist'',{recursive:true});fs.copyFileSync(''' + $entryFileName + ''',''dist/' + $entryFileName + ''');console.log(''dist/' + $entryFileName + ' generated'');"'
$watchCommand = 'node -e "console.log(''Watch mode: use your editor/terminal watcher tooling for this card.'');"'

$packageJson = @{
  name = $CardName
  version = '0.1.0'
  private = $true
  description = $description
  scripts = @{
    build = $buildCommand
    watch = $watchCommand
  }
  license = 'MIT'
} | ConvertTo-Json -Depth 10
Set-Content -Path (Join-Path $cardPath 'package.json') -Value $packageJson
Write-OK 'package.json cree'

$hacsJson = @{
  name = $DisplayName
  content_in_root = $false
  filename = $entryFileName
  render_readme = $true
  homeassistant = '2024.1.0'
  version = '0.1.0'
} | ConvertTo-Json
Set-Content -Path (Join-Path $cardPath 'hacs.json') -Value $hacsJson
Write-OK 'hacs.json cree'

$gitignore = @(
  'node_modules/'
  '*.log'
  '.npm/'
  'dist/'
  '.DS_Store'
)
Set-Content -Path (Join-Path $cardPath '.gitignore') -Value $gitignore
Write-OK '.gitignore cree'

$readme = @(
  "# $DisplayName"
  ''
  "[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Lovelace-41BDF5?style=for-the-badge&logo=home-assistant&logoColor=white)](https://www.home-assistant.io/)"
  "[![HACS](https://img.shields.io/badge/HACS-Custom%20Card-41BDF5?style=for-the-badge)](https://hacs.xyz)"
  "[![Version](https://img.shields.io/badge/Version-v0.1.0-0EA5E9?style=for-the-badge)](https://github.com/Micpi/$CardName)"
  "[![Type](https://img.shields.io/badge/Type-Custom%20Lovelace%20Card-0284C7?style=for-the-badge)](https://github.com/Micpi/$CardName)"
  "[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=000000)](https://buymeacoffee.com/mickaelpila)"
  ''
  "$DisplayName is a Home Assistant Lovelace custom card."
  ''
  '---'
  ''
  '## Table des matieres'
  ''
  '- Installation'
  '- Fonctionnalites'
  '- Configuration rapide'
  '- Reference configuration'
  '- Exemples'
  '- FAQ'
  ''
  '## Installation'
  ''
  '1. Add this repository to HACS as a custom Lovelace repository.'
  '2. Install the card from HACS.'
  '3. Add the resource below if needed.'
  ''
  '## Ressource Lovelace'
  ''
  '```yaml'
  'resources:'
  "  - url: /hacsfiles/$CardName/$entryFileName"
  '    type: module'
  '```'
  ''
  '## Fonctionnalites'
  ''
  '- Clean badges with strong contrast.'
  '- Concise presentation aligned with the Blaze-style baseline.'
  '- Designed for practical Home Assistant use.'
  ''
  '## Configuration rapide'
  ''
  '```yaml'
  "type: custom:$CardName"
  "entity: $EntityId"
  "name: $DisplayName"
  '```'
  ''
  '## Reference configuration'
  ''
  '| Option | Type | Defaut | Description |'
  '| --- | --- | --- | --- |'
  '| entity | string | requis | Entite controlee |'
  '| name | string | vide | Titre affiche |'
  ''
  '## Exemples'
  ''
  '### Exemple minimal'
  ''
  '```yaml'
  "type: custom:$CardName"
  "entity: $EntityId"
  '```'
  ''
  '## FAQ'
  ''
  '### Comment faire évoluer la carte ?'
  ''
  'Modifier le fichier JS principal puis relancer la publication.'
) -join [Environment]::NewLine
Set-Content -Path (Join-Path $cardPath 'README.md') -Value $readme
Write-OK 'README.md cree'

$exampleYaml = @(
  "type: custom:$CardName"
  "entity: $EntityId"
  "name: $DisplayName"
) -join [Environment]::NewLine
Set-Content -Path (Join-Path $cardPath 'example.yaml') -Value $exampleYaml
Write-OK 'example.yaml cree'

Write-Host ''
Write-Host 'Etapes suivantes:' -ForegroundColor Cyan
Write-Host "1. Ouvrir $jsPath"
Write-Host '2. Adapter le code de la carte'
Write-Host '3. Lancer Publish HA depuis VS Code pour creer/pousser le repo GitHub'
