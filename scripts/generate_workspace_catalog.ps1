<#
.SYNOPSIS
    Genere un README catalogue des cartes et integrations du workspace.
.DESCRIPTION
    Produit un inventaire versionne avec signalement des ecarts package/hacs,
    et la liste des depots Git a ajouter dans HACS (Parametres > Depots personnalises).
#>
[CmdletBinding()]
param(
  [string]$OutputFile = "README_WORKSPACE_CATALOG.md"
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path "$PSScriptRoot\.."

function Get-Json([string]$path) {
  if (-not (Test-Path $path)) { return $null }
  try {
    return (Get-Content $path -Raw | ConvertFrom-Json)
  }
  catch {
    return $null
  }
}

function Get-RepoUrl([string]$folderPath) {
  if (-not (Test-Path (Join-Path $folderPath ".git"))) { return "N/A" }
  try {
    $url = git -C $folderPath remote get-url origin 2>$null
    if (-not $url) { return "N/A" }
    $url = $url.Trim()
    if ($url.EndsWith(".git")) { $url = $url.Substring(0, $url.Length - 4) }
    return $url
  }
  catch {
    return "N/A"
  }
}

$cardsRoot = Join-Path $root "custom_cards"
$cardRows = @()
if (Test-Path $cardsRoot) {
  $cards = Get-ChildItem $cardsRoot -Directory | Sort-Object Name
  foreach ($card in $cards) {
    $hacsPath = Join-Path $card.FullName "hacs.json"
    $pkgPath = Join-Path $card.FullName "package.json"
    $readmePath = Join-Path $card.FullName "README.md"

    $hacs = Get-Json $hacsPath
    $pkg = Get-Json $pkgPath

    $hacsVersion = if ($hacs -and $hacs.version) { [string]$hacs.version } else { "N/A" }
    $pkgVersion = if ($pkg -and $pkg.version) { [string]$pkg.version } else { "N/A" }

    $status = "OK"
    if ($hacsVersion -eq "N/A" -and $pkgVersion -eq "N/A") {
      $status = "A COMPLETER"
    }
    elseif ($hacsVersion -ne "N/A" -and $pkgVersion -ne "N/A" -and $hacsVersion -ne $pkgVersion) {
      $status = "MISMATCH"
    }
    elseif ($hacsVersion -eq "N/A" -or $pkgVersion -eq "N/A") {
      $status = "PARTIEL"
    }

    $cardRows += [PSCustomObject]@{
      Name           = $card.Name
      RepoUrl         = Get-RepoUrl $card.FullName
      HacsVersion    = $hacsVersion
      PackageVersion = $pkgVersion
      Status         = $status
      ReadmePath     = if (Test-Path $readmePath) { "custom_cards/$($card.Name)/README.md" } else { "N/A" }
    }
  }
}

$integrationsRoot = Join-Path $root "integrations"
$integrationRows = @()
if (Test-Path $integrationsRoot) {
  $integrationsRootPath = (Resolve-Path $integrationsRoot).Path
  $manifests = Get-ChildItem $integrationsRootPath -Recurse -Filter manifest.json -ErrorAction SilentlyContinue
  foreach ($manifest in $manifests | Sort-Object FullName) {
    $manifestJson = Get-Json $manifest.FullName
    if (-not $manifestJson) { continue }

    $relativeManifest = $manifest.FullName.Substring($integrationsRootPath.Length + 1)
    $integrationFolder = ($relativeManifest -replace '[\\/].*$', '')
    $domain = if ($manifestJson.domain) { [string]$manifestJson.domain } else { "N/A" }
    $version = if ($manifestJson.version) { [string]$manifestJson.version } else { "N/A" }

    $configFlow = "N/A"
    if ($manifestJson.PSObject.Properties.Name -contains "config_flow") {
      $configFlow = [string]$manifestJson.config_flow
    }

    $integrationRootPath = Join-Path $integrationsRootPath $integrationFolder
    $hacsPath = Join-Path $integrationRootPath "hacs.json"
    $hacs = Get-Json $hacsPath
    $hacsVersion = if ($hacs -and $hacs.version) { [string]$hacs.version } else { "N/A" }

    $status = "OK"
    if ($hacsVersion -ne "N/A" -and $version -ne "N/A" -and $hacsVersion -ne $version) {
      $status = "MISMATCH"
    }

    $integrationRows += [PSCustomObject]@{
      Folder          = $integrationFolder
      Domain          = $domain
      RepoUrl         = Get-RepoUrl $integrationRootPath
      ManifestVersion = $version
      HacsVersion     = $hacsVersion
      ConfigFlow      = $configFlow
      Status          = $status
      ManifestPath    = ("integrations/" + ($relativeManifest -replace '\\', '/'))
    }
  }
}

$lines = @()
$lines += "# Workspace Catalog Home Assistant"
$lines += ""
$lines += "Inventaire auto-genere des cartes et integrations de ce workspace."
$lines += "Ce fichier est la SEULE source de verite pour la liste des depots a ajouter dans HACS -"
$lines += "ne pas dupliquer cette liste ailleurs (docs, README, etc.), la referencer a la place."
$lines += ""
$lines += "- Date generation: $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))"
$lines += "- Regle: HACS et package/manifest doivent etre alignes pour eviter les versions incoherentes."
$lines += ""
$lines += "## Depots a ajouter dans HACS (Parametres > Depots personnalises)"
$lines += ""
$lines += "| Nom | Type HACS | URL du depot GitHub |"
$lines += "| --- | --- | --- |"

foreach ($r in $cardRows) {
  $lines += "| $($r.Name) | Lovelace (Plugin) | $($r.RepoUrl) |"
}
$integrationRepoSeen = @{}
foreach ($r in $integrationRows) {
  if ($integrationRepoSeen.ContainsKey($r.Folder)) { continue }
  $integrationRepoSeen[$r.Folder] = $true
  $lines += "| $($r.Folder) | Integration | $($r.RepoUrl) |"
}

$lines += ""
$lines += "## Cartes custom"
$lines += ""
$lines += "| Carte | Depot GitHub | Version HACS | Version package | Statut | README |"
$lines += "| --- | --- | --- | --- | --- | --- |"

foreach ($r in $cardRows) {
  $readme = if ($r.ReadmePath -ne "N/A") { "[$($r.Name)]($($r.ReadmePath))" } else { "N/A" }
  $lines += "| $($r.Name) | $($r.RepoUrl) | $($r.HacsVersion) | $($r.PackageVersion) | $($r.Status) | $readme |"
}

$lines += ""
$lines += "## Integrations"
$lines += ""
$lines += "| Dossier | Depot GitHub | Domaine | Version manifest | Version HACS | Config flow | Statut | Manifest |"
$lines += "| --- | --- | --- | --- | --- | --- | --- | --- |"

foreach ($r in $integrationRows) {
  $manifestLink = "[$($r.Domain)]($($r.ManifestPath))"
  $lines += "| $($r.Folder) | $($r.RepoUrl) | $($r.Domain) | $($r.ManifestVersion) | $($r.HacsVersion) | $($r.ConfigFlow) | $($r.Status) | $manifestLink |"
}

$lines += ""
$lines += "## Points d attention"
$lines += ""
$lines += "- Statut MISMATCH: aligner les versions avant release."
$lines += "- Statut PARTIEL/A COMPLETER: definir une strategie unique de version (hacs + package pour cartes, hacs + manifest pour integrations)."
$lines += "- Depot GitHub = N/A: dossier sans remote Git 'origin' configure (a corriger avant publication HACS)."
$lines += "- Reexecuter ce script apres chaque publication: pwsh -File scripts/generate_workspace_catalog.ps1"

$out = if ([System.IO.Path]::IsPathRooted($OutputFile)) {
  $OutputFile
}
else {
  Join-Path $root $OutputFile
}
$lines -join "`r`n" | Set-Content -Path $out -Encoding utf8
Write-Host "Catalogue genere: $($out.Replace($root.Path + '\\', ''))" -ForegroundColor Green
