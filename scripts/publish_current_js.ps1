<#
.SYNOPSIS
    Publication en 1 clic a partir du fichier JS actif.
.DESCRIPTION
    Detecte la carte depuis le fichier courant sous custom_cards/, build la carte,
    puis lance auto_commit.ps1 (version/tag/push automatiques).
.PARAMETER CurrentFile
    Chemin du fichier actif (idealement passe par VS Code via ${file}).
.PARAMETER Message
    Message commit optionnel.
.PARAMETER NoPush
    Commit/tag local uniquement.
.PARAMETER NoTag
    Commit/push sans tag.
#>
[CmdletBinding()]
param(
  [Parameter(Mandatory)]
  [string]$CurrentFile,
  [string]$Message,
  [string]$GitHubUsername = "Micpi",
  [string]$GitHubToken,
  [switch]$NoPush,
  [switch]$NoTag
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path "$PSScriptRoot\.."
$customCardsRoot = Join-Path $root "custom_cards"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Blue }
function Write-OK([string]$msg) { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Fail([string]$msg) { Write-Host "[KO] $msg" -ForegroundColor Red }

function Get-PlainTextFromSecureString {
  param([System.Security.SecureString]$SecureValue)

  $ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($SecureValue)
  try {
    return [System.Runtime.InteropServices.Marshal]::PtrToStringUni($ptr)
  }
  finally {
    [System.Runtime.InteropServices.Marshal]::ZeroFreeCoTaskMemUnicode($ptr)
  }
}

function Convert-RepoNameToDisplayName {
  param([string]$RepoName)

  $parts = $RepoName -split '-'
  $words = foreach ($part in $parts) {
    switch ($part.ToLowerInvariant()) {
      'ios' { 'iOS' }
      default {
        if ([string]::IsNullOrWhiteSpace($part)) { continue }
        $part.Substring(0, 1).ToUpperInvariant() + $part.Substring(1)
      }
    }
  }

  return (($words -join ' ') + ' Card').Trim()
}

function Ensure-CardMetadata {
  param(
    [string]$CardPath,
    [string]$RepoName,
    [string]$EntryFileName
  )

  $hacsPath = Join-Path $CardPath 'hacs.json'
  if (-not (Test-Path $hacsPath)) {
    @{
      name = Convert-RepoNameToDisplayName -RepoName $RepoName
      content_in_root = $false
      filename = $EntryFileName
      render_readme = $true
      homeassistant = '2024.1.0'
    } | ConvertTo-Json | Set-Content -Path $hacsPath
    Write-OK "hacs.json cree"
  }

  $gitignorePath = Join-Path $CardPath '.gitignore'
  if (-not (Test-Path $gitignorePath)) {
    @(
      'node_modules/'
      '*.log'
      '.npm/'
      'dist/'
      '.DS_Store'
    ) | Set-Content -Path $gitignorePath
    Write-OK ".gitignore cree"
  }

  $readmePath = Join-Path $CardPath 'README.md'
  if (-not (Test-Path $readmePath)) {
    $displayName = Convert-RepoNameToDisplayName -RepoName $RepoName
    @(
      "# $displayName"
      ''
      'Carte Lovelace personnalisee pour Home Assistant.'
      ''
      '## Installation'
      ''
      'Ajouter ce depot dans HACS avec le type Lovelace.'
      ''
      '## Ressource Lovelace'
      ''
      '```yaml'
      'resources:'
      "  - url: /hacsfiles/$RepoName/$EntryFileName"
      '    type: module'
      '```'
    ) | Set-Content -Path $readmePath
    Write-OK "README.md cree"
  }
}

function Ensure-CardRepository {
  param([string]$CardPath)

  $gitDir = Join-Path $CardPath '.git'
  if (Test-Path $gitDir) {
    return
  }

  & git -C $CardPath init -b main | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Impossible d'initialiser Git dans $CardPath"
  }
  Write-OK "Repository Git initialise"
}

function Get-NextVersion {
  param([string]$CardPath)

  $tags = @(& git -C $CardPath tag -l 'v*' 2>$null)
  if ($LASTEXITCODE -ne 0 -or $tags.Count -eq 0) {
    return '0.1.0'
  }

  $versions = foreach ($tag in $tags) {
    if ($tag -match '^v(\d+)\.(\d+)\.(\d+)$') {
      [pscustomobject]@{
        Major = [int]$Matches[1]
        Minor = [int]$Matches[2]
        Patch = [int]$Matches[3]
      }
    }
  }

  if (-not $versions) {
    return '0.1.0'
  }

  $latest = $versions | Sort-Object Major, Minor, Patch | Select-Object -Last 1
  return '{0}.{1}.{2}' -f $latest.Major, $latest.Minor, ($latest.Patch + 1)
}

function Ensure-GitHubToken {
  param([string]$Token)

  if ($Token) {
    return $Token
  }

  Write-Host ''
  $secureToken = Read-Host 'Entrez votre GitHub personal access token (classic)' -AsSecureString
  return Get-PlainTextFromSecureString -SecureValue $secureToken
}

function New-GitHubRepositoryIfMissing {
  param(
    [string]$Owner,
    [string]$Name,
    [string]$Token
  )

  $headers = @{
    Authorization = "Bearer $Token"
    Accept = 'application/vnd.github+json'
    'X-GitHub-Api-Version' = '2022-11-28'
  }

  try {
    Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$Name" -Headers $headers -Method Get | Out-Null
    Write-Info "Repo GitHub existant: $Owner/$Name"
    return
  }
  catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -ne 404) {
      throw
    }
  }

  $body = @{ name = $Name; private = $false } | ConvertTo-Json
  Invoke-RestMethod -Uri 'https://api.github.com/user/repos' -Headers $headers -Method Post -Body $body | Out-Null
  Write-OK "Repo GitHub cree: $Owner/$Name"
}

function Push-CardRepository {
  param(
    [string]$CardPath,
    [string]$RepoName,
    [string]$Owner,
    [string]$Token,
    [string]$Version,
    [bool]$ShouldPushTag
  )

  New-GitHubRepositoryIfMissing -Owner $Owner -Name $RepoName -Token $Token

  $remoteUrl = "https://github.com/$Owner/$RepoName.git"
  $existingOrigin = @(& git -C $CardPath remote get-url origin 2>$null)
  if ($LASTEXITCODE -eq 0 -and $existingOrigin) {
    if ($existingOrigin[0] -ne $remoteUrl) {
      & git -C $CardPath remote set-url origin $remoteUrl | Out-Null
    }
  }
  else {
    & git -C $CardPath remote add origin $remoteUrl | Out-Null
  }

  $authBytes = [System.Text.Encoding]::ASCII.GetBytes("${Owner}:${Token}")
  $authHeader = 'AUTHORIZATION: basic ' + [Convert]::ToBase64String($authBytes)

  & git -C $CardPath -c "http.https://github.com/.extraheader=$authHeader" push -u origin main
  if ($LASTEXITCODE -ne 0) {
    throw "Push main echoue pour $RepoName"
  }
  Write-OK "Push main OK"

  if ($ShouldPushTag) {
    & git -C $CardPath -c "http.https://github.com/.extraheader=$authHeader" push origin "v$Version"
    if ($LASTEXITCODE -ne 0) {
      throw "Push tag echoue pour $RepoName"
    }
    Write-OK "Push tag v$Version OK"
  }
}

if (-not (Test-Path $CurrentFile)) {
  Write-Fail "Fichier actif introuvable: $CurrentFile"
  exit 1
}

$fullFile = (Resolve-Path $CurrentFile).Path
$fullRoot = (Resolve-Path $customCardsRoot).Path

if (-not $fullFile.StartsWith($fullRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  Write-Fail "Le fichier actif doit etre dans custom_cards/: $fullFile"
  exit 1
}

$relative = $fullFile.Substring($fullRoot.Length).TrimStart('\', '/')
if ([string]::IsNullOrWhiteSpace($relative)) {
  Write-Fail "Impossible de determiner la carte depuis le fichier courant."
  exit 1
}

$segments = $relative -split '[\\/]+'
if ($segments.Length -lt 2) {
  Write-Fail "Chemin insuffisant pour identifier une carte: $relative"
  exit 1
}

$cardName = $segments[0]
$cardPath = Join-Path $customCardsRoot $cardName
$packageJson = Join-Path $cardPath "package.json"
$entryFileName = [System.IO.Path]::GetFileName($fullFile)
$repoName = [System.IO.Path]::GetFileNameWithoutExtension($entryFileName).ToLowerInvariant()

Write-Info "Carte detectee: $cardName"

$buildScript = Join-Path $root "scripts\build_card.ps1"
$autoCommitScript = Join-Path $root "scripts\auto_commit.ps1"

if (Test-Path $packageJson) {
  & pwsh -File $buildScript -CardName $cardName
  if ($LASTEXITCODE -ne 0) {
    Write-Fail "Build echoue pour la carte: $cardName"
    exit $LASTEXITCODE
  }
  Write-OK "Build OK: $cardName"
}
else {
  Write-Info "Aucun package.json pour ${cardName}: build npm ignore."
}

Ensure-CardMetadata -CardPath $cardPath -RepoName $repoName -EntryFileName $entryFileName
Ensure-CardRepository -CardPath $cardPath

$commitMessage = if ([string]::IsNullOrWhiteSpace($Message)) {
  "feat(card): publish $repoName"
}
else {
  $Message
}

Write-Info "Publication Git de la carte: $repoName"

& git -C $cardPath add .
if ($LASTEXITCODE -ne 0) {
  Write-Fail "git add echoue"
  exit $LASTEXITCODE
}

$hasChanges = @(& git -C $cardPath status --porcelain)
$version = $null
$createdTag = $false

if ($hasChanges.Count -gt 0) {
  & git -C $cardPath commit -m $commitMessage
  if ($LASTEXITCODE -ne 0) {
    Write-Fail "Commit echoue"
    exit $LASTEXITCODE
  }
  Write-OK "Commit cree"

  if (-not $NoTag) {
    $version = Get-NextVersion -CardPath $cardPath
    & git -C $cardPath tag "v$version"
    if ($LASTEXITCODE -ne 0) {
      Write-Fail "Creation du tag echouee"
      exit $LASTEXITCODE
    }
    $createdTag = $true
    Write-OK "Tag cree: v$version"
  }
}
else {
  Write-Info 'Aucun changement local a commit pour cette carte.'
}

if ($NoPush) {
  Write-Info 'NoPush actif: push GitHub ignore.'
}
else {
  $GitHubToken = Ensure-GitHubToken -Token $GitHubToken
  if (-not $GitHubToken) {
    Write-Fail 'Token GitHub manquant.'
    exit 1
  }

  try {
    Push-CardRepository -CardPath $cardPath -RepoName $repoName -Owner $GitHubUsername -Token $GitHubToken -Version $version -ShouldPushTag:$createdTag
  }
  catch {
    Write-Fail $_.Exception.Message
    exit 1
  }
}

Write-OK "Publication terminee pour $repoName"
