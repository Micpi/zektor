<#
.SYNOPSIS
  Publication automatique de tous les drivers (custom cards + integrations) avec commit versionne, tag et release GitHub.
.DESCRIPTION
  Decouvre automatiquement:
  - toutes les cartes sous custom_cards/
  - toutes les integrations sous integrations/

  Pour chaque driver, delegue a:
  - scripts/publish_current_js.ps1
  - scripts/publish_current_integration.ps1

  Ce script est donc applicable aux drivers existants et a tout futur driver ajoute dans ces dossiers.
.PARAMETER GitHubUsername
  Proprietaire GitHub cible.
.PARAMETER GitHubToken
  Token GitHub optionnel. Si absent, les scripts delegates tenteront GITHUB_TOKEN puis gh auth token.
.PARAMETER MessagePrefix
  Prefixe optionnel pour le message de commit (la version vX.Y.Z est ajoutee automatiquement).
.PARAMETER OnlyCards
  Publie uniquement les custom cards.
.PARAMETER OnlyIntegrations
  Publie uniquement les integrations.
.PARAMETER NoPush
  Commit/tag local uniquement.
.PARAMETER NoTag
  Commit/push sans tag ni release.
.PARAMETER ContinueOnError
  Continue meme si un driver echoue.
#>
[CmdletBinding()]
param(
  [string]$GitHubUsername = "Micpi",
  [string]$GitHubToken,
  [string]$MessagePrefix,
  [switch]$OnlyCards,
  [switch]$OnlyIntegrations,
  [switch]$NoPush,
  [switch]$NoTag,
  [switch]$ContinueOnError
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$Message) { Write-Host "[INFO] $Message" -ForegroundColor Blue }
function Write-OK([string]$Message) { Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-WarnMsg([string]$Message) { Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Fail([string]$Message) { Write-Host "[KO] $Message" -ForegroundColor Red }

if ($OnlyCards -and $OnlyIntegrations) {
  Write-Fail "OnlyCards et OnlyIntegrations ne peuvent pas etre utilises ensemble."
  exit 1
}

$root = (Resolve-Path "$PSScriptRoot\..").Path
$cardsRoot = Join-Path $root "custom_cards"
$integrationsRoot = Join-Path $root "integrations"
$publishCardScript = Join-Path $root "scripts\publish_current_js.ps1"
$publishIntegrationScript = Join-Path $root "scripts\publish_current_integration.ps1"

if (-not (Test-Path $publishCardScript)) {
  Write-Fail "Script introuvable: $publishCardScript"
  exit 1
}
if (-not (Test-Path $publishIntegrationScript)) {
  Write-Fail "Script introuvable: $publishIntegrationScript"
  exit 1
}

function Get-CardEntryFile {
  param([string]$CardPath)

  $hacsPath = Join-Path $CardPath "hacs.json"
  if (Test-Path $hacsPath) {
    try {
      $hacs = Get-Content $hacsPath -Raw | ConvertFrom-Json
      if ($hacs.filename) {
        $candidate = Join-Path $CardPath ([string]$hacs.filename)
        if (Test-Path $candidate) {
          return $candidate
        }
      }
    }
    catch {
      Write-WarnMsg "hacs.json invalide pour $(Split-Path $CardPath -Leaf), fallback detection JS."
    }
  }

  $folderName = Split-Path $CardPath -Leaf
  $defaultJs = Join-Path $CardPath "$folderName.js"
  if (Test-Path $defaultJs) {
    return $defaultJs
  }

  $jsFiles = @(Get-ChildItem -Path $CardPath -Filter "*.js" -File)
  if ($jsFiles.Count -gt 0) {
    return $jsFiles[0].FullName
  }

  return $null
}

function Get-IntegrationAnchorFile {
  param([string]$IntegrationPath)

  $manifestCandidates = @(
    Get-ChildItem -Path $IntegrationPath -Recurse -Filter "manifest.json" -File -ErrorAction SilentlyContinue
  ) | Where-Object { $_.FullName -match "custom_components[\\/][^\\/]+[\\/]manifest\.json$" }

  if ($manifestCandidates.Count -gt 0) {
    return $manifestCandidates[0].FullName
  }

  return $null
}

$drivers = @()

if (-not $OnlyIntegrations -and (Test-Path $cardsRoot)) {
  $cardDirs = @(Get-ChildItem -Path $cardsRoot -Directory)
  foreach ($card in $cardDirs) {
    if ($card.Name.StartsWith("_")) { continue }
    $entry = Get-CardEntryFile -CardPath $card.FullName
    if ($entry) {
      $drivers += [pscustomobject]@{
        Kind = "card"
        Name = $card.Name
        AnchorFile = $entry
      }
    }
    else {
      Write-WarnMsg "Carte ignoree (aucun JS d'entree detecte): $($card.Name)"
    }
  }
}

if (-not $OnlyCards -and (Test-Path $integrationsRoot)) {
  $integrationDirs = @(Get-ChildItem -Path $integrationsRoot -Directory)
  foreach ($integration in $integrationDirs) {
    $anchor = Get-IntegrationAnchorFile -IntegrationPath $integration.FullName
    if ($anchor) {
      $drivers += [pscustomobject]@{
        Kind = "integration"
        Name = $integration.Name
        AnchorFile = $anchor
      }
    }
    else {
      Write-WarnMsg "Integration ignoree (manifest custom_components introuvable): $($integration.Name)"
    }
  }
}

if ($drivers.Count -eq 0) {
  Write-Info "Aucun driver detecte a publier."
  exit 0
}

$drivers = $drivers | Sort-Object Kind, Name
Write-Info "Drivers detectes: $($drivers.Count)"

$success = New-Object System.Collections.Generic.List[string]
$failed = New-Object System.Collections.Generic.List[string]

foreach ($driver in $drivers) {
  $scope = "$($driver.Kind):$($driver.Name)"
  Write-Host ""
  Write-Host "========================================" -ForegroundColor DarkGray
  Write-Host "Publish $scope" -ForegroundColor Cyan
  Write-Host "========================================" -ForegroundColor DarkGray

  $msg = if ([string]::IsNullOrWhiteSpace($MessagePrefix)) {
    $null
  }
  else {
    "$MessagePrefix ($scope)"
  }

  try {
    if ($driver.Kind -eq "card") {
      & pwsh -NoProfile -ExecutionPolicy Bypass -File $publishCardScript `
        -CurrentFile $driver.AnchorFile `
        -Message $msg `
        -GitHubUsername $GitHubUsername `
        -GitHubToken $GitHubToken `
        -NoPush:$NoPush `
        -NoTag:$NoTag
    }
    else {
      & pwsh -NoProfile -ExecutionPolicy Bypass -File $publishIntegrationScript `
        -CurrentFile $driver.AnchorFile `
        -Message $msg `
        -GitHubUsername $GitHubUsername `
        -GitHubToken $GitHubToken `
        -NoPush:$NoPush `
        -NoTag:$NoTag
    }

    if ($LASTEXITCODE -ne 0) {
      throw "Publication en echec (exit code $LASTEXITCODE)"
    }

    $success.Add($scope)
    Write-OK "Publication OK: $scope"
  }
  catch {
    $failed.Add($scope)
    Write-Fail "Publication KO: $scope - $($_.Exception.Message)"

    if (-not $ContinueOnError) {
      Write-Fail "Arret sur erreur (utiliser -ContinueOnError pour poursuivre)."
      break
    }
  }
}

Write-Host ""
Write-Host "============== Resume ==============" -ForegroundColor Cyan
Write-Host "Succes: $($success.Count)"
$success | ForEach-Object { Write-Host "  - $_" -ForegroundColor Green }
Write-Host "Echecs: $($failed.Count)"
$failed | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }

if ($failed.Count -gt 0) {
  exit 1
}

exit 0
