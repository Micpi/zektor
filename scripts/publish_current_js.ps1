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
.PARAMETER GitHubUsername
  Proprietaire GitHub cible pour le repo de la carte.
.PARAMETER GitHubToken
  Token GitHub optionnel. Si absent, le script essaie d'abord GITHUB_TOKEN.
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
$integrationsRoot = Join-Path $root "integrations"

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
    [string]$EntryFileName,
    [string]$Version
  )

  $hacsPath = Join-Path $CardPath 'hacs.json'
  $hacsExisted = Test-Path $hacsPath
  $hacsData = if (Test-Path $hacsPath) {
    Get-Content $hacsPath -Raw | ConvertFrom-Json
  }
  else {
    [pscustomobject]@{}
  }

  if (-not $hacsData.name) {
    $hacsData | Add-Member -NotePropertyName name -NotePropertyValue (Convert-RepoNameToDisplayName -RepoName $RepoName)
  }

  if ($hacsData.PSObject.Properties.Name.Contains('content_in_root')) {
    $hacsData.content_in_root = $false
  }
  else {
    $hacsData | Add-Member -NotePropertyName content_in_root -NotePropertyValue $false
  }

  if ($hacsData.PSObject.Properties.Name.Contains('filename')) {
    $hacsData.filename = $EntryFileName
  }
  else {
    $hacsData | Add-Member -NotePropertyName filename -NotePropertyValue $EntryFileName
  }
  if (-not $hacsData.PSObject.Properties.Name.Contains('render_readme')) {
    $hacsData | Add-Member -NotePropertyName render_readme -NotePropertyValue $true
  }
  if (-not $hacsData.PSObject.Properties.Name.Contains('homeassistant')) {
    $hacsData | Add-Member -NotePropertyName homeassistant -NotePropertyValue '2024.1.0'
  }
  if ($Version) {
    if ($hacsData.PSObject.Properties.Name.Contains('version')) {
      $hacsData.version = $Version
    }
    else {
      $hacsData | Add-Member -NotePropertyName version -NotePropertyValue $Version
    }
  }

  $hacsData | ConvertTo-Json | Set-Content -Path $hacsPath
  if (-not $hacsExisted) {
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

function Update-PackageVersion {
  param(
    [string]$PackageJsonPath,
    [string]$Version
  )

  if (-not (Test-Path $PackageJsonPath) -or -not $Version) {
    return
  }

  $packageData = Get-Content $PackageJsonPath -Raw | ConvertFrom-Json
  $packageData.version = $Version
  $packageData | ConvertTo-Json -Depth 20 | Set-Content -Path $PackageJsonPath
  Write-OK "package.json version mise a jour: $Version"
}

function Write-PublishNotes {
  param(
    [string]$RepoPath,
    [string]$Version,
    [string]$CommitMessage
  )

  $statusLines = @(& git -C $RepoPath status --porcelain)
  $changedFiles = @(
    foreach ($line in $statusLines) {
      if ([string]::IsNullOrWhiteSpace($line)) { continue }
      $pathPart = $line.Substring([Math]::Min(3, $line.Length)).Trim()
      if ($pathPart.Contains(' -> ')) {
        $pathPart = ($pathPart -split ' -> ')[-1]
      }
      $pathPart -replace '\\', '/'
    }
  )

  $publishDir = Join-Path $RepoPath '.publish'
  if (-not (Test-Path $publishDir)) {
    New-Item -Path $publishDir -ItemType Directory | Out-Null
  }

  $reportPath = Join-Path $publishDir 'last_publish_report.md'
  $dateText = (Get-Date).ToString('yyyy-MM-dd HH:mm:ss')

  @(
    '# Publish Report'
    ''
    "- Date: $dateText"
    "- Version: v$Version"
    "- Commit message: $CommitMessage"
    ''
    '## Changed files'
    ''
  ) + @(
    if ($changedFiles.Count -eq 0) {
      '- (none)'
    }
    else {
      $changedFiles | ForEach-Object { "- $_" }
    }
  ) | Set-Content -Path $reportPath -Encoding UTF8

  $changelogPath = Join-Path $RepoPath 'CHANGELOG.md'
  $existing = if (Test-Path $changelogPath) { Get-Content -Raw $changelogPath } else { "# Changelog`n`n" }
  $entryHeader = "## v$Version - $((Get-Date).ToString('yyyy-MM-dd'))"

  if ($existing -notmatch [Regex]::Escape($entryHeader)) {
    $entryLines = @(
      $entryHeader
      ''
      "- $CommitMessage"
    ) + @(
      if ($changedFiles.Count -eq 0) {
        '- changed files: none'
      }
      else {
        $changedFiles | ForEach-Object { "- changed: $_" }
      }
    ) + @('')

    ($existing.TrimEnd() + "`n`n" + ($entryLines -join "`n") + "`n") | Set-Content -Path $changelogPath -Encoding UTF8
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
  param(
    [string]$CardPath,
    [string]$CurrentVersion
  )

  function ConvertTo-SemVerObject {
    param([string]$VersionString)

    if (-not $VersionString) {
      return $null
    }

    if ($VersionString -match '^v?(\d+)\.(\d+)\.(\d+)$') {
      return [pscustomobject]@{
        Major = [int]$Matches[1]
        Minor = [int]$Matches[2]
        Patch = [int]$Matches[3]
      }
    }

    return $null
  }

  $tags = @(& git -C $CardPath tag -l 'v*' 2>$null)
  $versions = @(
    foreach ($tag in $tags) {
      $parsed = ConvertTo-SemVerObject -VersionString $tag
      if ($parsed) {
        $parsed
      }
    }
  )

  $currentParsed = ConvertTo-SemVerObject -VersionString $CurrentVersion
  if ($currentParsed) {
    $versions += $currentParsed
  }

  if (-not $versions) {
    return '0.1.0'
  }

  $latest = $versions | Sort-Object Major, Minor, Patch | Select-Object -Last 1
  return '{0}.{1}.{2}' -f $latest.Major, $latest.Minor, ($latest.Patch + 1)
}

function Get-GitHubTokenOrNull {
  param([string]$Token)

  if ($Token) {
    return $Token
  }

  if ($env:GITHUB_TOKEN) {
    Write-Info 'Token GitHub lu depuis GITHUB_TOKEN.'
    return $env:GITHUB_TOKEN
  }

  $userToken = [Environment]::GetEnvironmentVariable('GITHUB_TOKEN', 'User')
  if (-not [string]::IsNullOrWhiteSpace($userToken)) {
    Write-Info 'Token GitHub lu depuis la variable User GITHUB_TOKEN.'
    return $userToken
  }

  $machineToken = [Environment]::GetEnvironmentVariable('GITHUB_TOKEN', 'Machine')
  if (-not [string]::IsNullOrWhiteSpace($machineToken)) {
    Write-Info 'Token GitHub lu depuis la variable Machine GITHUB_TOKEN.'
    return $machineToken
  }

  $gh = Get-Command gh -ErrorAction SilentlyContinue
  if ($gh) {
    try {
      $ghToken = (& gh auth token 2>$null)
      if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($ghToken)) {
        Write-Info 'Token GitHub lu depuis gh auth token.'
        return $ghToken.Trim()
      }
    }
    catch {
      # Ignore gh token lookup errors and continue without token.
    }
  }

  return $null
}

function Ensure-RemoteOrigin {
  param(
    [string]$CardPath,
    [string]$Owner,
    [string]$RepoName
  )

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
}

function New-GitHubRepositoryIfMissing {
  param(
    [string]$Owner,
    [string]$Name,
    [string]$Token
  )

  $headers = @{
    Authorization          = "Bearer $Token"
    Accept                 = 'application/vnd.github+json'
    'X-GitHub-Api-Version' = '2022-11-28'
  }

  try {
    Write-Info "  → Verification: existe-t-il un repo GitHub $Owner/$Name ?"
    Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$Name" -Headers $headers -Method Get | Out-Null
    Write-Info "  → Repo existant: aucune action requise"
    return
  }
  catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -ne 404) {
      Write-Info "  → Erreur API (code $statusCode): $($_.Exception.Message)"
      throw
    }
    Write-Info "  → Repo non trouve (404): creation en cours..."
  }

  $body = @{ name = $Name; private = $false } | ConvertTo-Json
  try {
    Write-Info "  → Envoi requete POST vers https://api.github.com/user/repos"
    Invoke-RestMethod -Uri 'https://api.github.com/user/repos' -Headers $headers -Method Post -Body $body | Out-Null
    Write-OK "Repo GitHub cree: $Owner/$Name"
  }
  catch {
    Write-Info "  → Erreur lors de la creation du repo: $($_.Exception.Message)"
    throw
  }
}

function Ensure-GitHubReleaseForTag {
  param(
    [string]$Owner,
    [string]$RepoName,
    [string]$Tag,
    [string]$Token
  )

  if (-not $Tag -or -not $Token) {
    Write-Info "Skip release: Tag absent ou Token absent (Tag=$Tag, Token disponible=$(-not [string]::IsNullOrWhiteSpace($Token)))"
    return
  }

  Write-Info "Verification du release GitHub pour $Owner/$RepoName tag $Tag"

  $headers = @{
    Authorization          = "Bearer $Token"
    Accept                 = 'application/vnd.github+json'
    'X-GitHub-Api-Version' = '2022-11-28'
  }

  try {
    Write-Info "  → Verification: existe-t-il un release pour $Tag ?"
    Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$RepoName/releases/tags/$Tag" -Headers $headers -Method Get | Out-Null
    Write-Info "  → Release deja present: aucune action requise"
    return
  }
  catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -ne 404) {
      Write-Info "  → Erreur API (code $statusCode): $($_.Exception.Message)"
      throw
    }
    Write-Info "  → Release non trouve (404): creation en cours..."
  }

  $body = @{
    tag_name               = $Tag
    name                   = $Tag
    target_commitish       = 'main'
    draft                  = $false
    prerelease             = $false
    generate_release_notes = $true
  } | ConvertTo-Json

  try {
    Write-Info "  → Envoi requete POST vers https://api.github.com/repos/$Owner/$RepoName/releases"
    $response = Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$RepoName/releases" -Headers $headers -Method Post -Body $body -ContentType 'application/json'
    Write-OK "Release GitHub cree: $Owner/$RepoName $Tag (URL: $($response.html_url))"
  }
  catch {
    Write-Info "  → Erreur lors de la creation du release: $($_.Exception.Message)"
    throw
  }
}

function Ensure-GitHubReleaseForTagWithGhCli {
  param(
    [string]$Owner,
    [string]$RepoName,
    [string]$Tag
  )

  $gh = Get-Command gh -ErrorAction SilentlyContinue
  if (-not $gh) {
    throw 'GitHub CLI (gh) introuvable: impossible de creer une release sans token.'
  }

  $repoRef = "$Owner/$RepoName"
  & gh release view $Tag --repo $repoRef 1>$null 2>$null
  if ($LASTEXITCODE -eq 0) {
    Write-Info "  → Release deja present: $repoRef / $Tag"
    return
  }

  & gh release create $Tag --repo $repoRef --title $Tag --generate-notes
  if ($LASTEXITCODE -ne 0) {
    throw "Echec creation release avec gh pour $repoRef / $Tag"
  }

  Write-OK "  → Release cree via gh: $repoRef / $Tag"
}

function Set-RepoNonInteractive {
  param([string]$RepoPath)
  # Disable automatic GC to prevent interactive OneDrive file-locking prompts during push
  & git -C $RepoPath config gc.auto 0 2>$null
  & git -C $RepoPath config gc.autoDetach false 2>$null
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
  Set-RepoNonInteractive -RepoPath $CardPath

  $authUrl = "https://${Owner}:${Token}@github.com/$Owner/$RepoName.git"
  $cleanUrl = "https://github.com/$Owner/$RepoName.git"
  & git -C $CardPath remote set-url origin $authUrl | Out-Null

  try {
    & git -C $CardPath push -u origin main
    if ($LASTEXITCODE -ne 0) { throw "Push main echoue pour $RepoName" }
    Write-OK "Push main OK"

    if ($ShouldPushTag) {
      & git -C $CardPath push origin "v$Version"
      if ($LASTEXITCODE -ne 0) { throw "Push tag echoue pour $RepoName" }
      Write-OK "Push tag v$Version OK"
    }
  }
  finally {
    & git -C $CardPath remote set-url origin $cleanUrl | Out-Null
  }
}

function Push-CardRepositoryWithExistingCredentials {
  param(
    [string]$CardPath,
    [string]$RepoName,
    [string]$Owner,
    [string]$Version,
    [bool]$ShouldPushTag
  )

  Set-RepoNonInteractive -RepoPath $CardPath

  & git -C $CardPath push -u origin main
  if ($LASTEXITCODE -ne 0) { throw "Push main echoue pour $RepoName (aucun token fourni)." }
  Write-OK "Push main OK"

  if ($ShouldPushTag) {
    & git -C $CardPath push origin "v$Version"
    if ($LASTEXITCODE -ne 0) { throw "Push tag echoue pour $RepoName (aucun token fourni)." }
    Write-OK "Push tag v$Version OK"
  }
}

if (-not (Test-Path $CurrentFile)) {
  Write-Fail "Fichier actif introuvable: $CurrentFile"
  exit 1
}

$fullFile = (Resolve-Path $CurrentFile).Path
$integrationsFullRoot = (Resolve-Path $integrationsRoot).Path

if ($fullFile.StartsWith($integrationsFullRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  $integrationPublishScript = Join-Path $root 'scripts\publish_current_integration.ps1'
  if (-not (Test-Path $integrationPublishScript)) {
    Write-Fail "Script integration introuvable: $integrationPublishScript"
    exit 1
  }

  Write-Info 'Fichier actif detecte dans integrations/, delegation vers publish_current_integration.ps1'
  & pwsh -File $integrationPublishScript -CurrentFile $CurrentFile -Message $Message -GitHubUsername $GitHubUsername -GitHubToken $GitHubToken -NoPush:$NoPush -NoTag:$NoTag
  exit $LASTEXITCODE
}

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
$currentPackageVersion = $null
if (Test-Path $packageJson) {
  try {
    $currentPackageVersion = (Get-Content $packageJson -Raw | ConvertFrom-Json).version
  }
  catch {
    Write-Info 'package.json present mais version introuvable, calcul depuis les tags uniquement.'
  }
}

$version = if ($NoTag) { $null } else { Get-NextVersion -CardPath $cardPath -CurrentVersion $currentPackageVersion }

Write-Info "Carte detectee: $cardName"

Ensure-CardMetadata -CardPath $cardPath -RepoName $repoName -EntryFileName $entryFileName -Version $version
Update-PackageVersion -PackageJsonPath $packageJson -Version $version

$buildScript = Join-Path $root "scripts\build_card.ps1"

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
Ensure-CardRepository -CardPath $cardPath

$commitMessage = if ([string]::IsNullOrWhiteSpace($Message)) {
  "feat(card): publish $repoName"
}
else {
  $Message
}

Write-Info "Publication Git de la carte: $repoName"

$reportVersion = if ([string]::IsNullOrWhiteSpace($version)) { 'no-tag' } else { $version }
Write-PublishNotes -RepoPath $cardPath -Version $reportVersion -CommitMessage $commitMessage

& git -C $cardPath add .
if ($LASTEXITCODE -ne 0) {
  Write-Fail "git add echoue"
  exit $LASTEXITCODE
}

$hasChanges = @(& git -C $cardPath status --porcelain)
$createdTag = $false

if ($hasChanges.Count -gt 0) {
  & git -C $cardPath commit -m $commitMessage
  if ($LASTEXITCODE -ne 0) {
    Write-Fail "Commit echoue"
    exit $LASTEXITCODE
  }
  Write-OK "Commit cree"

  if (-not $NoTag) {
    if (-not $version) {
      $version = Get-NextVersion -CardPath $cardPath -CurrentVersion $currentPackageVersion
    }
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
  $GitHubToken = Get-GitHubTokenOrNull -Token $GitHubToken

  try {
    Write-Info "Etape 1: synchronisation vers GitHub (push main + tag)..."
    if ($GitHubToken) {
      Write-Info "  → Mode: authentification avec GitHub token"
      try {
        Push-CardRepository -CardPath $cardPath -RepoName $repoName -Owner $GitHubUsername -Token $GitHubToken -Version $version -ShouldPushTag:$createdTag
      }
      catch {
        Write-Info ('  → Echec avec token (' + $_.Exception.Message + '). Tentative de fallback avec les credentials Git existants.')
        Push-CardRepositoryWithExistingCredentials -CardPath $cardPath -RepoName $repoName -Owner $GitHubUsername -Version $version -ShouldPushTag:$createdTag
      }
    }
    else {
      Write-Info '  → Mode: authentification avec credentials Git locaux'
      Push-CardRepositoryWithExistingCredentials -CardPath $cardPath -RepoName $repoName -Owner $GitHubUsername -Version $version -ShouldPushTag:$createdTag
    }
  }
  catch {
    if (-not $GitHubToken) {
      Write-Fail ($_.Exception.Message + ' Si le repo GitHub doit etre cree ou si vos credentials Git ne sont pas configures, relancez avec -GitHubToken ou GITHUB_TOKEN.')
    }
    else {
      Write-Fail $_.Exception.Message
    }
    exit 1
  }

  if (-not $NoTag -and $version) {
    try {
      Write-Info "Etape finale: creation du release GitHub..."
      if ($GitHubToken) {
        try {
          Ensure-GitHubReleaseForTag -Owner $GitHubUsername -RepoName $repoName -Tag "v$version" -Token $GitHubToken
        }
        catch {
          Write-Info ('  → Echec via token, fallback gh CLI: ' + $_.Exception.Message)
          Ensure-GitHubReleaseForTagWithGhCli -Owner $GitHubUsername -RepoName $repoName -Tag "v$version"
        }
      }
      else {
        Ensure-GitHubReleaseForTagWithGhCli -Owner $GitHubUsername -RepoName $repoName -Tag "v$version"
      }
    }
    catch {
      Write-Fail ("Creation release echouee pour v" + $version + ": " + $_.Exception.Message)
      exit 1
    }
  }
}

Write-OK "Publication terminee pour $repoName"
