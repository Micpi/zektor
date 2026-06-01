<#
.SYNOPSIS
  Cree les releases GitHub manquantes pour toutes les cartes publiees.
.DESCRIPTION
  Parcourt custom_cards/*, detecte les repos git, lit le dernier tag semver local (vX.Y.Z),
  puis cree la release correspondante sur GitHub si elle n'existe pas.
.PARAMETER CustomCardsDir
  Dossier contenant les cartes.
.PARAMETER GitHubUsername
  Proprietaire GitHub cible.
.PARAMETER GitHubToken
  Token GitHub optionnel. Si absent, utilise GITHUB_TOKEN.
#>
[CmdletBinding()]
param(
  [string]$CustomCardsDir = "custom_cards",
  [string]$GitHubUsername = "Micpi",
  [string]$GitHubToken
)

$ErrorActionPreference = "Stop"

function Write-Info([string]$Message) { Write-Host "[INFO] $Message" -ForegroundColor Blue }
function Write-OK([string]$Message) { Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-WarnMsg([string]$Message) { Write-Host "[WARN] $Message" -ForegroundColor Yellow }

if (-not $GitHubToken) {
  if ($env:GITHUB_TOKEN) {
    $GitHubToken = $env:GITHUB_TOKEN
  }
}

if (-not $GitHubToken) {
  throw "Token GitHub manquant. Definissez GITHUB_TOKEN ou passez -GitHubToken."
}

$headers = @{
  Authorization          = "Bearer $GitHubToken"
  Accept                 = "application/vnd.github+json"
  "X-GitHub-Api-Version" = "2022-11-28"
}

function Get-RepoNameFromCardDir {
  param([string]$CardPath, [string]$CardFolderName)

  $hacsPath = Join-Path $CardPath "hacs.json"
  if (Test-Path $hacsPath) {
    try {
      $hacs = Get-Content $hacsPath -Raw | ConvertFrom-Json
      $filename = [string]$hacs.filename
      if (-not [string]::IsNullOrWhiteSpace($filename)) {
        return [System.IO.Path]::GetFileNameWithoutExtension($filename).ToLowerInvariant()
      }
    }
    catch {
      Write-WarnMsg "hacs.json invalide dans $CardFolderName, fallback nom dossier."
    }
  }

  return $CardFolderName.ToLowerInvariant()
}

function Get-LatestSemverTag {
  param([string]$CardPath)

  $tags = @(& git -C $CardPath tag --list "v*")
  if (-not $tags -or $tags.Count -eq 0) {
    return $null
  }

  $parsed = @(
    foreach ($tag in $tags) {
      if ($tag -match "^v(\d+)\.(\d+)\.(\d+)$") {
        [pscustomobject]@{
          Tag = $tag
          Major = [int]$Matches[1]
          Minor = [int]$Matches[2]
          Patch = [int]$Matches[3]
        }
      }
    }
  )

  if (-not $parsed -or $parsed.Count -eq 0) {
    return $null
  }

  return ($parsed | Sort-Object Major, Minor, Patch | Select-Object -Last 1).Tag
}

function Ensure-ReleaseForTag {
  param(
    [string]$Owner,
    [string]$Repo,
    [string]$Tag
  )

  try {
    Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$Repo/releases/tags/$Tag" -Headers $headers -Method Get | Out-Null
    Write-Info "${Repo}: release deja presente pour $Tag"
    return $false
  }
  catch {
    $status = $_.Exception.Response.StatusCode.value__
    if ($status -ne 404) {
      throw
    }
  }

  $body = @{
    tag_name = $Tag
    name = $Tag
    target_commitish = "main"
    draft = $false
    prerelease = $false
    generate_release_notes = $true
  } | ConvertTo-Json

  Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$Repo/releases" -Headers $headers -Method Post -Body $body -ContentType "application/json" | Out-Null
  Write-OK "${Repo}: release creee pour $Tag"
  return $true
}

$cardsRoot = Resolve-Path $CustomCardsDir
$cardDirs = Get-ChildItem -Path $cardsRoot -Directory

$created = 0
$existing = 0
$skipped = 0

foreach ($dir in $cardDirs) {
  $cardPath = $dir.FullName
  $cardName = $dir.Name

  if (-not (Test-Path (Join-Path $cardPath ".git"))) {
    Write-WarnMsg "${cardName}: pas un repo git, ignore."
    $skipped += 1
    continue
  }

  $repoName = Get-RepoNameFromCardDir -CardPath $cardPath -CardFolderName $cardName
  $tag = Get-LatestSemverTag -CardPath $cardPath

  if (-not $tag) {
    Write-WarnMsg "${cardName}: aucun tag semver local, ignore."
    $skipped += 1
    continue
  }

  try {
    $wasCreated = Ensure-ReleaseForTag -Owner $GitHubUsername -Repo $repoName -Tag $tag
    if ($wasCreated) {
      $created += 1
    }
    else {
      $existing += 1
    }
  }
  catch {
    Write-WarnMsg "${cardName}: echec release ($($_.Exception.Message))"
    $skipped += 1
  }
}

Write-Host ""
Write-Host "Resume:" -ForegroundColor Cyan
Write-Host "- Releases existantes/ok: $existing"
Write-Host "- Elements ignores/erreurs: $skipped"
