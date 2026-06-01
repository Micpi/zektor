<#
.SYNOPSIS
  Publish one Home Assistant integration from the currently active file.
.DESCRIPTION
  Detects the integration under integrations/, ensures HACS metadata, manages semantic version,
  commit/tag/push, creates GitHub release, and writes explicit publish notes/changelog.
.PARAMETER CurrentFile
  Active file path (usually passed by VS Code ${file}).
.PARAMETER Message
  Optional commit message.
.PARAMETER GitHubUsername
  GitHub owner for the integration repository.
.PARAMETER GitHubToken
  Optional token. If absent, script tries GITHUB_TOKEN.
.PARAMETER NoPush
  Commit/tag locally only.
.PARAMETER NoTag
  Commit/push without tag/release.
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
$integrationsRoot = Join-Path $root "integrations"

function Write-Info([string]$msg) { Write-Host "[INFO] $msg" -ForegroundColor Blue }
function Write-OK([string]$msg) { Write-Host "[OK] $msg" -ForegroundColor Green }
function Write-Fail([string]$msg) { Write-Host "[KO] $msg" -ForegroundColor Red }

function Get-GitHubTokenOrNull {
  param([string]$Token)

  if ($Token) { return $Token }
  if ($env:GITHUB_TOKEN) { return $env:GITHUB_TOKEN }

  $userToken = [Environment]::GetEnvironmentVariable('GITHUB_TOKEN', 'User')
  if (-not [string]::IsNullOrWhiteSpace($userToken)) { return $userToken }

  $machineToken = [Environment]::GetEnvironmentVariable('GITHUB_TOKEN', 'Machine')
  if (-not [string]::IsNullOrWhiteSpace($machineToken)) { return $machineToken }

  $gh = Get-Command gh -ErrorAction SilentlyContinue
  if ($gh) {
    try {
      $ghToken = (& gh auth token 2>$null)
      if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($ghToken)) {
        return $ghToken.Trim()
      }
    }
    catch {
      # Ignore gh token lookup errors and continue without token.
    }
  }

  return $null
}

function Ensure-IntegrationRepository {
  param([string]$Path)

  if (Test-Path (Join-Path $Path '.git')) {
    return
  }

  & git -C $Path init -b main | Out-Null
  if ($LASTEXITCODE -ne 0) {
    throw "Unable to initialize git repository in $Path"
  }
  Write-OK "Integration git repository initialized"
}

function Convert-ToDisplayName {
  param([string]$Domain)

  $parts = $Domain -split '[_-]'
  $words = foreach ($p in $parts) {
    if ([string]::IsNullOrWhiteSpace($p)) { continue }
    $p.Substring(0, 1).ToUpperInvariant() + $p.Substring(1)
  }
  return (($words -join ' ') + ' Integration').Trim()
}

function ConvertTo-SemVerObject {
  param([string]$VersionString)

  if (-not $VersionString) { return $null }
  if ($VersionString -match '^v?(\d+)\.(\d+)\.(\d+)$') {
    return [pscustomobject]@{
      Major = [int]$Matches[1]
      Minor = [int]$Matches[2]
      Patch = [int]$Matches[3]
    }
  }

  return $null
}

function Get-NextVersion {
  param(
    [string]$RepoPath,
    [string]$CurrentVersion
  )

  $tags = @(& git -C $RepoPath tag -l 'v*' 2>$null)
  $versions = @(
    foreach ($tag in $tags) {
      $parsed = ConvertTo-SemVerObject -VersionString $tag
      if ($parsed) { $parsed }
    }
  )

  $currentParsed = ConvertTo-SemVerObject -VersionString $CurrentVersion
  if ($currentParsed) { $versions += $currentParsed }

  if (-not $versions) { return '0.1.0' }

  $latest = $versions | Sort-Object Major, Minor, Patch | Select-Object -Last 1
  return '{0}.{1}.{2}' -f $latest.Major, $latest.Minor, ($latest.Patch + 1)
}

function Set-JsonVersion {
  param(
    [string]$Path,
    [string]$Version
  )

  if (-not (Test-Path $Path)) { return }

  $obj = Get-Content $Path -Raw | ConvertFrom-Json
  if ($obj.PSObject.Properties.Name.Contains('version')) {
    $obj.version = $Version
  }
  else {
    $obj | Add-Member -NotePropertyName version -NotePropertyValue $Version
  }

  $obj | ConvertTo-Json -Depth 30 | Set-Content -Path $Path -Encoding UTF8
}

function Ensure-IntegrationMetadata {
  param(
    [string]$IntegrationPath,
    [string]$Domain,
    [string]$DisplayName,
    [string]$Version
  )

  $hacsPath = Join-Path $IntegrationPath 'hacs.json'
  $hacsObj = if (Test-Path $hacsPath) {
    Get-Content $hacsPath -Raw | ConvertFrom-Json
  }
  else {
    [pscustomobject]@{}
  }

  if (-not $hacsObj.name) {
    $hacsObj | Add-Member -NotePropertyName name -NotePropertyValue $DisplayName
  }

  if ($hacsObj.PSObject.Properties.Name.Contains('content_in_root')) {
    $hacsObj.content_in_root = $false
  }
  else {
    $hacsObj | Add-Member -NotePropertyName content_in_root -NotePropertyValue $false
  }

  if (-not $hacsObj.PSObject.Properties.Name.Contains('render_readme')) {
    $hacsObj | Add-Member -NotePropertyName render_readme -NotePropertyValue $true
  }

  if (-not $hacsObj.PSObject.Properties.Name.Contains('homeassistant')) {
    $hacsObj | Add-Member -NotePropertyName homeassistant -NotePropertyValue '2024.1.0'
  }

  if ($hacsObj.PSObject.Properties.Name.Contains('domains')) {
    $hacsObj.domains = @($Domain)
  }
  else {
    $hacsObj | Add-Member -NotePropertyName domains -NotePropertyValue @($Domain)
  }

  if ($hacsObj.PSObject.Properties.Name.Contains('zip_release')) {
    $hacsObj.zip_release = $false
  }
  else {
    $hacsObj | Add-Member -NotePropertyName zip_release -NotePropertyValue $false
  }

  if ($Version) {
    if ($hacsObj.PSObject.Properties.Name.Contains('version')) {
      $hacsObj.version = $Version
    }
    else {
      $hacsObj | Add-Member -NotePropertyName version -NotePropertyValue $Version
    }
  }

  $hacsObj | ConvertTo-Json -Depth 20 | Set-Content -Path $hacsPath -Encoding UTF8

  $gitignorePath = Join-Path $IntegrationPath '.gitignore'
  if (-not (Test-Path $gitignorePath)) {
    @(
      '__pycache__/'
      '*.pyc'
      '.pytest_cache/'
      '.mypy_cache/'
      '.ruff_cache/'
      '.DS_Store'
    ) | Set-Content -Path $gitignorePath -Encoding UTF8
  }

  $readmePath = Join-Path $IntegrationPath 'README.md'
  if (-not (Test-Path $readmePath)) {
    @(
      "# $DisplayName"
      ''
      'Custom Home Assistant integration for Blaze amplifiers.'
      ''
      '## Installation via HACS'
      ''
      '1. Add this repository in HACS as type Integration.'
      '2. Install the integration from HACS.'
      '3. Restart Home Assistant.'
      ''
      '## Domain'
      ''
      "- $Domain"
    ) | Set-Content -Path $readmePath -Encoding UTF8
  }
}

function Ensure-RemoteOrigin {
  param(
    [string]$RepoPath,
    [string]$Owner,
    [string]$RepoName
  )

  $remoteUrl = "https://github.com/$Owner/$RepoName.git"
  $existingOrigin = @(& git -C $RepoPath remote get-url origin 2>$null)
  if ($LASTEXITCODE -eq 0 -and $existingOrigin) {
    if ($existingOrigin[0] -ne $remoteUrl) {
      & git -C $RepoPath remote set-url origin $remoteUrl | Out-Null
    }
  }
  else {
    & git -C $RepoPath remote add origin $remoteUrl | Out-Null
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
    Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$Name" -Headers $headers -Method Get | Out-Null
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
  Write-OK "GitHub repository created: $Owner/$Name"
}

function Ensure-GitHubReleaseForTag {
  param(
    [string]$Owner,
    [string]$RepoName,
    [string]$Tag,
    [string]$Token
  )

  if (-not $Tag -or -not $Token) { return }

  $headers = @{
    Authorization          = "Bearer $Token"
    Accept                 = 'application/vnd.github+json'
    'X-GitHub-Api-Version' = '2022-11-28'
  }

  try {
    Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$RepoName/releases/tags/$Tag" -Headers $headers -Method Get | Out-Null
    return
  }
  catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -ne 404) {
      throw
    }
  }

  $body = @{
    tag_name               = $Tag
    name                   = $Tag
    target_commitish       = 'main'
    draft                  = $false
    prerelease             = $false
    generate_release_notes = $true
  } | ConvertTo-Json

  Invoke-RestMethod -Uri "https://api.github.com/repos/$Owner/$RepoName/releases" -Headers $headers -Method Post -Body $body -ContentType 'application/json' | Out-Null
  Write-OK "GitHub release created: $Owner/$RepoName $Tag"
}

function Ensure-GitHubReleaseForTagWithGhCli {
  param(
    [string]$Owner,
    [string]$RepoName,
    [string]$Tag
  )

  $gh = Get-Command gh -ErrorAction SilentlyContinue
  if (-not $gh) {
    throw 'GitHub CLI (gh) is not installed; cannot create release without token.'
  }

  $repoRef = "$Owner/$RepoName"
  & gh release view $Tag --repo $repoRef 1>$null 2>$null
  if ($LASTEXITCODE -eq 0) {
    Write-Info "GitHub release already exists: $repoRef $Tag"
    return
  }

  & gh release create $Tag --repo $repoRef --title $Tag --generate-notes
  if ($LASTEXITCODE -ne 0) {
    throw "GitHub release creation failed with gh for $repoRef $Tag"
  }

  Write-OK "GitHub release created with gh: $repoRef $Tag"
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

function Get-RemoteRefCommit {
  param(
    [string]$RepoPath,
    [string]$RefName
  )

  $line = (& git -C $RepoPath ls-remote origin $RefName 2>$null | Select-Object -First 1)
  if (-not $line) {
    return $null
  }

  $parts = $line -split "`t"
  if ($parts.Length -lt 1) {
    return $null
  }

  return $parts[0].Trim()
}

function Invoke-PushRefWithRecovery {
  param(
    [string]$RepoPath,
    [string]$RefName,
    [scriptblock]$PushAction
  )

  $localCommit = (& git -C $RepoPath rev-parse "${RefName}^{commit}" 2>$null).Trim()

  & $PushAction
  if ($LASTEXITCODE -eq 0) {
    return
  }

  $remoteCommit = Get-RemoteRefCommit -RepoPath $RepoPath -RefName $RefName
  if ($remoteCommit -and $localCommit -and $remoteCommit -eq $localCommit) {
    Write-Info "Push reported failure but remote ref is already up to date: $RefName"
    return
  }

  Write-Info "Push failed for $RefName, retrying once..."
  & $PushAction
  if ($LASTEXITCODE -eq 0) {
    return
  }

  $remoteCommit = Get-RemoteRefCommit -RepoPath $RepoPath -RefName $RefName
  if ($remoteCommit -and $localCommit -and $remoteCommit -eq $localCommit) {
    Write-Info "Push retry still reported failure but remote ref is up to date: $RefName"
    return
  }

  throw "Push failed for ref $RefName"
}

function Set-RepoNonInteractive {
  param([string]$RepoPath)
  & git -C $RepoPath config gc.auto 0 2>$null
  & git -C $RepoPath config gc.autoDetach false 2>$null
}

function Invoke-GitPushWithRecovery {
  param(
    [string]$RepoPath,
    [string]$RefName,
    [string[]]$GitArgs
  )

  $localCommit = (& git -C $RepoPath rev-parse "${RefName}^{commit}" 2>$null).Trim()

  & git @GitArgs
  if ($LASTEXITCODE -eq 0) { return }

  # Check if remote already has the commit (e.g. previous partial push succeeded)
  $remoteCommit = (& git -C $RepoPath ls-remote origin $RefName 2>$null | Select-Object -First 1)
  if ($remoteCommit) { $remoteCommit = ($remoteCommit -split "`t")[0].Trim() }

  if ($remoteCommit -and $localCommit -and $remoteCommit -eq $localCommit) {
    Write-Info "Push reported failure but remote ref is already up to date: $RefName"
    return
  }

  Write-Info "Push failed for $RefName, retrying once..."
  & git @GitArgs
  if ($LASTEXITCODE -eq 0) { return }

  $remoteCommit = (& git -C $RepoPath ls-remote origin $RefName 2>$null | Select-Object -First 1)
  if ($remoteCommit) { $remoteCommit = ($remoteCommit -split "`t")[0].Trim() }

  if ($remoteCommit -and $localCommit -and $remoteCommit -eq $localCommit) {
    Write-Info "Push retry reported failure but remote ref is up to date: $RefName"
    return
  }

  throw "Push failed for ref $RefName"
}

function Push-RepositoryWithToken {
  param(
    [string]$RepoPath,
    [string]$Owner,
    [string]$RepoName,
    [string]$Token,
    [string]$Version,
    [bool]$PushTag
  )

  Set-RepoNonInteractive -RepoPath $RepoPath

  # Use token-embedded URL for reliable auth on Windows (no credential helper needed)
  $authUrl = "https://${Owner}:${Token}@github.com/$Owner/$RepoName.git"
  $cleanUrl = "https://github.com/$Owner/$RepoName.git"
  & git -C $RepoPath remote set-url origin $authUrl | Out-Null

  try {
    Invoke-GitPushWithRecovery -RepoPath $RepoPath -RefName 'refs/heads/main' `
      -GitArgs @('-C', $RepoPath, 'push', '-u', 'origin', 'main')

    if ($PushTag) {
      Invoke-GitPushWithRecovery -RepoPath $RepoPath -RefName "refs/tags/v$Version" `
        -GitArgs @('-C', $RepoPath, 'push', 'origin', "v$Version")
    }
  }
  finally {
    # Always restore the clean URL (never persist token in git config)
    & git -C $RepoPath remote set-url origin $cleanUrl | Out-Null
  }
}

function Push-RepositoryWithLocalCredentials {
  param(
    [string]$RepoPath,
    [string]$Owner,
    [string]$RepoName,
    [string]$Version,
    [bool]$PushTag
  )

  Set-RepoNonInteractive -RepoPath $RepoPath

  Invoke-GitPushWithRecovery -RepoPath $RepoPath -RefName 'refs/heads/main' `
    -GitArgs @('-C', $RepoPath, 'push', '-u', 'origin', 'main')

  if ($PushTag) {
    Invoke-GitPushWithRecovery -RepoPath $RepoPath -RefName "refs/tags/v$Version" `
      -GitArgs @('-C', $RepoPath, 'push', 'origin', "v$Version")
  }
}

if (-not (Test-Path $CurrentFile)) {
  Write-Fail "Current file not found: $CurrentFile"
  exit 1
}

$fullFile = (Resolve-Path $CurrentFile).Path
$fullRoot = (Resolve-Path $integrationsRoot).Path

if (-not $fullFile.StartsWith($fullRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
  Write-Fail "Current file must be under integrations/: $fullFile"
  exit 1
}

$relative = $fullFile.Substring($fullRoot.Length).TrimStart('\', '/')
$segments = $relative -split '[\\/]+'
if ($segments.Length -lt 2) {
  Write-Fail "Unable to determine integration folder from path: $relative"
  exit 1
}

$integrationFolder = $segments[0]
$integrationPath = Join-Path $integrationsRoot $integrationFolder

$customComponentsPath = Join-Path $integrationPath 'custom_components'
if (-not (Test-Path $customComponentsPath)) {
  Write-Fail "Missing custom_components folder in integration: $integrationPath"
  exit 1
}

$domains = Get-ChildItem -Path $customComponentsPath -Directory
if (-not $domains -or $domains.Count -eq 0) {
  Write-Fail "No domain folder found in $customComponentsPath"
  exit 1
}

$domainDir = $domains[0]
$domain = $domainDir.Name
$manifestPath = Join-Path $domainDir.FullName 'manifest.json'
if (-not (Test-Path $manifestPath)) {
  Write-Fail "Missing manifest.json in $($domainDir.FullName)"
  exit 1
}

$manifest = Get-Content $manifestPath -Raw | ConvertFrom-Json
if ($manifest.domain) {
  $domain = [string]$manifest.domain
}

$displayName = if ($manifest.name) { [string]$manifest.name } else { Convert-ToDisplayName -Domain $domain }
$repoName = $domain.Replace('_', '-')
$currentVersion = [string]$manifest.version
$version = $null
$reuseExistingHeadTag = $false

$initialChanges = @(& git -C $integrationPath status --porcelain)

if (-not $NoTag) {
  # Resume incomplete publications: if current manifest version already has a local tag on HEAD,
  # reuse that version instead of incrementing again.
  $headCommit = (& git -C $integrationPath rev-parse HEAD 2>$null).Trim()
  $currentTag = if ([string]::IsNullOrWhiteSpace($currentVersion)) { $null } else { "v$currentVersion" }
  $tagCommit = $null
  if ($currentTag) {
    $tagCommit = (& git -C $integrationPath rev-parse "refs/tags/$currentTag^{commit}" 2>$null).Trim()
  }

  if ($initialChanges.Count -eq 0 -and $currentTag -and $LASTEXITCODE -eq 0 -and $tagCommit) {
    $version = $currentVersion
    $reuseExistingHeadTag = $true
    Write-Info "Resuming publication from existing local tag $currentTag."
  }
  else {
    $version = Get-NextVersion -RepoPath $integrationPath -CurrentVersion $currentVersion
  }
}

Write-Info "Integration detected: $integrationFolder (domain=$domain, repo=$repoName)"

Ensure-IntegrationRepository -Path $integrationPath
Ensure-IntegrationMetadata -IntegrationPath $integrationPath -Domain $domain -DisplayName $displayName -Version $version
if ($version) {
  Set-JsonVersion -Path $manifestPath -Version $version
  Set-JsonVersion -Path (Join-Path $integrationPath 'hacs.json') -Version $version
}

$commitMessage = if ([string]::IsNullOrWhiteSpace($Message)) {
  "feat(integration): publish $repoName"
}
else {
  $Message
}

if (-not $NoTag -and -not [string]::IsNullOrWhiteSpace($version)) {
  $versionSuffix = "v$version"
  if ($commitMessage -notlike "*$versionSuffix*") {
    $commitMessage = "$commitMessage $versionSuffix"
  }
}

$reportVersion = if ([string]::IsNullOrWhiteSpace($version)) { 'no-tag' } else { $version }
if ($reuseExistingHeadTag) {
  Write-Info 'Resume mode: skipping publish notes/changelog update to avoid creating a new commit.'
}
else {
  Write-PublishNotes -RepoPath $integrationPath -Version $reportVersion -CommitMessage $commitMessage
}

& git -C $integrationPath add .
if ($LASTEXITCODE -ne 0) {
  Write-Fail 'git add failed'
  exit $LASTEXITCODE
}

$hasChanges = @(& git -C $integrationPath status --porcelain)
$createdTag = $false

if ($hasChanges.Count -gt 0) {
  & git -C $integrationPath commit -m $commitMessage
  if ($LASTEXITCODE -ne 0) {
    Write-Fail 'Commit failed'
    exit $LASTEXITCODE
  }
  Write-OK 'Commit created'

  if (-not $NoTag -and $version) {
    if ($reuseExistingHeadTag) {
      $createdTag = $true
      Write-Info "Using existing local tag: v$version"
    }
    else {
      & git -C $integrationPath tag "v$version"
      if ($LASTEXITCODE -ne 0) {
        Write-Fail "Tag creation failed: v$version"
        exit $LASTEXITCODE
      }
      $createdTag = $true
      Write-OK "Tag created: v$version"
    }
  }
}
else {
  Write-Info 'No local changes to commit for this integration.'
  if (-not $NoTag -and $version) {
    $existingTagCommit = (& git -C $integrationPath rev-parse "refs/tags/v$version^{commit}" 2>$null).Trim()
    if ($LASTEXITCODE -eq 0 -and $existingTagCommit) {
      $createdTag = $true
      Write-Info "Found existing local tag to publish: v$version"
    }
  }
}

if ($NoPush) {
  Write-Info 'NoPush enabled: push skipped.'
  exit 0
}

$GitHubToken = Get-GitHubTokenOrNull -Token $GitHubToken

try {
  if ($GitHubToken) {
    New-GitHubRepositoryIfMissing -Owner $GitHubUsername -Name $repoName -Token $GitHubToken
    try {
      Push-RepositoryWithToken -RepoPath $integrationPath -Owner $GitHubUsername -RepoName $repoName -Token $GitHubToken -Version $version -PushTag:$createdTag
    }
    catch {
      Write-Info ('Token push failed, fallback to local git credentials: ' + $_.Exception.Message)
      Push-RepositoryWithLocalCredentials -RepoPath $integrationPath -Owner $GitHubUsername -RepoName $repoName -Version $version -PushTag:$createdTag
    }
  }
  else {
    Push-RepositoryWithLocalCredentials -RepoPath $integrationPath -Owner $GitHubUsername -RepoName $repoName -Version $version -PushTag:$createdTag
  }
}
catch {
  if (-not $GitHubToken) {
    Write-Fail ($_.Exception.Message + ' Provide -GitHubToken or GITHUB_TOKEN if repo creation/auth is required.')
  }
  else {
    Write-Fail $_.Exception.Message
  }
  exit 1
}

if (-not $NoTag -and $version) {
  try {
    if ($GitHubToken) {
      try {
        Ensure-GitHubReleaseForTag -Owner $GitHubUsername -RepoName $repoName -Tag "v$version" -Token $GitHubToken
      }
      catch {
        Write-Info ('Token release creation failed, fallback to gh CLI: ' + $_.Exception.Message)
        Ensure-GitHubReleaseForTagWithGhCli -Owner $GitHubUsername -RepoName $repoName -Tag "v$version"
      }
    }
    else {
      Ensure-GitHubReleaseForTagWithGhCli -Owner $GitHubUsername -RepoName $repoName -Tag "v$version"
    }
  }
  catch {
    Write-Fail ("Release creation failed for v" + $version + ': ' + $_.Exception.Message)
    exit 1
  }
}

Write-OK "Integration publication finished: $repoName"
