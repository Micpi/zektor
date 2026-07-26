<#
.SYNOPSIS
  Creates a HACS-ready release with detailed changelog notes.
.DESCRIPTION
  Detects the custom card or integration from the active file or component path,
  aligns HACS version metadata, builds cards, writes detailed release notes,
  updates CHANGELOG.md, commits, tags, pushes, and creates or updates a GitHub
  release using the generated changelog body.
.PARAMETER CurrentFile
  Active VS Code file. Usually passed with ${file}.
.PARAMETER ComponentPath
  Explicit component folder under custom_cards/ or integrations/.
.PARAMETER Bump
  SemVer bump to apply when there are local changes. Defaults to patch.
.PARAMETER Version
  Explicit version to release. Overrides Bump.
.PARAMETER Message
  Optional release/commit summary.
.PARAMETER GitHubUsername
  Fallback GitHub owner when origin cannot be parsed.
.PARAMETER GitHubToken
  Optional token. If absent, GITHUB_TOKEN and gh auth are tried.
.PARAMETER NoPush
  Commit and tag locally, but do not push or create the GitHub release.
.PARAMETER NoTag
  Commit without tag/release.
.PARAMETER Draft
  Create/edit the GitHub release as draft.
.PARAMETER Prerelease
  Mark the GitHub release as prerelease.
.PARAMETER DryRun
  Preview the release plan and generated notes without writing files.
#>
[CmdletBinding(DefaultParameterSetName = 'ByFile')]
param(
  [Parameter(ParameterSetName = 'ByFile')]
  [string]$CurrentFile,

  [Parameter(ParameterSetName = 'ByComponent')]
  [string]$ComponentPath,

  [ValidateSet('patch', 'minor', 'major')]
  [string]$Bump = 'patch',

  [string]$Version,
  [string]$Message,
  [string]$GitHubUsername = 'Micpi',
  [string]$GitHubToken,
  [switch]$NoPush,
  [switch]$NoTag,
  [switch]$Draft,
  [switch]$Prerelease,
  [switch]$DryRun
)

$ErrorActionPreference = 'Stop'
if ($null -ne (Get-Variable -Name PSNativeCommandUseErrorActionPreference -Scope Global -ErrorAction SilentlyContinue)) {
  $Global:PSNativeCommandUseErrorActionPreference = $false
}

$root = (Resolve-Path "$PSScriptRoot\..").Path
$cardsRoot = Join-Path $root 'custom_cards'
$integrationsRoot = Join-Path $root 'integrations'

function Write-Info([string]$Message) { Write-Host "[INFO] $Message" -ForegroundColor Blue }
function Write-OK([string]$Message) { Write-Host "[OK] $Message" -ForegroundColor Green }
function Write-WarnMsg([string]$Message) { Write-Host "[WARN] $Message" -ForegroundColor Yellow }
function Write-Fail([string]$Message) { Write-Host "[KO] $Message" -ForegroundColor Red }

function Test-IsUnderPath {
  param(
    [string]$Path,
    [string]$Parent
  )

  $resolvedPath = [System.IO.Path]::GetFullPath($Path).TrimEnd('\', '/')
  $resolvedParent = [System.IO.Path]::GetFullPath($Parent).TrimEnd('\', '/')
  return $resolvedPath.StartsWith($resolvedParent + [System.IO.Path]::DirectorySeparatorChar, [System.StringComparison]::OrdinalIgnoreCase) -or
    $resolvedPath.Equals($resolvedParent, [System.StringComparison]::OrdinalIgnoreCase)
}

function Get-RelativePathSafe {
  param(
    [string]$BasePath,
    [string]$Path
  )

  return [System.IO.Path]::GetRelativePath($BasePath, $Path) -replace '\\', '/'
}

function ConvertTo-SemVerObject {
  param([string]$VersionString)

  if ([string]::IsNullOrWhiteSpace($VersionString)) { return $null }
  if ($VersionString -match '^v?(\d+)\.(\d+)\.(\d+)$') {
    return [pscustomobject]@{
      Major = [int]$Matches[1]
      Minor = [int]$Matches[2]
      Patch = [int]$Matches[3]
    }
  }
  return $null
}

function ConvertFrom-SemVerObject {
  param([pscustomobject]$SemVer)
  return '{0}.{1}.{2}' -f $SemVer.Major, $SemVer.Minor, $SemVer.Patch
}

function Get-MaxVersion {
  param(
    [string]$RepoPath,
    [string[]]$MetadataVersions
  )

  $versions = @()
  foreach ($versionText in $MetadataVersions) {
    $parsed = ConvertTo-SemVerObject -VersionString $versionText
    if ($parsed) { $versions += $parsed }
  }

  $tags = @(& git -C $RepoPath tag -l 'v*' 2>$null)
  foreach ($tag in $tags) {
    $parsed = ConvertTo-SemVerObject -VersionString $tag
    if ($parsed) { $versions += $parsed }
  }

  if (-not $versions -or $versions.Count -eq 0) {
    return [pscustomobject]@{ Major = 0; Minor = 1; Patch = 0 }
  }

  return $versions | Sort-Object Major, Minor, Patch | Select-Object -Last 1
}

function Get-BumpedVersion {
  param(
    [pscustomobject]$BaseVersion,
    [string]$BumpKind
  )

  $next = [pscustomobject]@{
    Major = [int]$BaseVersion.Major
    Minor = [int]$BaseVersion.Minor
    Patch = [int]$BaseVersion.Patch
  }

  switch ($BumpKind) {
    'major' {
      $next.Major += 1
      $next.Minor = 0
      $next.Patch = 0
    }
    'minor' {
      $next.Minor += 1
      $next.Patch = 0
    }
    default {
      $next.Patch += 1
    }
  }

  return ConvertFrom-SemVerObject -SemVer $next
}

function Read-JsonOrNull {
  param([string]$Path)
  if (-not (Test-Path $Path)) { return $null }
  return Get-Content -Path $Path -Raw | ConvertFrom-Json
}

function Set-JsonVersion {
  param(
    [string]$Path,
    [string]$Version
  )

  if (-not (Test-Path $Path)) { return $false }
  $obj = Get-Content -Path $Path -Raw | ConvertFrom-Json
  if ($obj.PSObject.Properties.Name.Contains('version')) {
    $obj.version = $Version
  }
  else {
    $obj | Add-Member -NotePropertyName version -NotePropertyValue $Version
  }
  $obj | ConvertTo-Json -Depth 100 | Set-Content -Path $Path -Encoding UTF8
  return $true
}

function Set-PackageLockVersion {
  param(
    [string]$Path,
    [string]$Version
  )

  if (-not (Test-Path $Path)) { return $false }
  $obj = Get-Content -Path $Path -Raw | ConvertFrom-Json -AsHashtable
  if ($obj.ContainsKey('version')) {
    $obj['version'] = $Version
  }
  if ($obj.ContainsKey('packages') -and $obj['packages'].ContainsKey('')) {
    $rootPackage = $obj['packages']['']
    if ($rootPackage.ContainsKey('version')) {
      $rootPackage['version'] = $Version
    }
  }
  $obj | ConvertTo-Json -Depth 100 | Set-Content -Path $Path -Encoding UTF8
  return $true
}

function Get-OriginInfo {
  param(
    [string]$RepoPath,
    [string]$FallbackOwner,
    [string]$FallbackRepo
  )

  $origin = (& git -C $RepoPath remote get-url origin 2>$null)
  if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($origin)) {
    $origin = $origin.Trim()
    if ($origin -match 'github\.com[:/]([^/]+)/([^/]+?)(?:\.git)?$') {
      return [pscustomobject]@{
        Owner = $Matches[1]
        Repo = $Matches[2]
        Url = $origin
        HasOrigin = $true
      }
    }
  }

  return [pscustomobject]@{
    Owner = $FallbackOwner
    Repo = $FallbackRepo
    Url = "https://github.com/$FallbackOwner/$FallbackRepo.git"
    HasOrigin = $false
  }
}

function Ensure-GitRepository {
  param([string]$RepoPath)

  if (Test-Path (Join-Path $RepoPath '.git')) {
    return
  }

  if ($DryRun) {
    Write-Info "DryRun: would initialize git repository in $RepoPath"
    return
  }

  & git -C $RepoPath init -b main | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Unable to initialize git repository in $RepoPath" }
}

function Ensure-Origin {
  param(
    [string]$RepoPath,
    [pscustomobject]$Origin
  )

  if ($Origin.HasOrigin) { return }
  if ($DryRun) {
    Write-Info "DryRun: would add origin $($Origin.Url)"
    return
  }

  & git -C $RepoPath remote add origin $Origin.Url 2>$null
  if ($LASTEXITCODE -ne 0) {
    & git -C $RepoPath remote set-url origin $Origin.Url | Out-Null
  }
}

function Get-GitHubTokenOrNull {
  param([string]$Token)

  if (-not [string]::IsNullOrWhiteSpace($Token)) { return $Token }
  if (-not [string]::IsNullOrWhiteSpace($env:GITHUB_TOKEN)) { return $env:GITHUB_TOKEN }

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
      return $null
    }
  }

  return $null
}

function Get-ComponentFromPath {
  param([string]$Path)

  $resolved = (Resolve-Path $Path).Path
  $target = if ((Get-Item $resolved).PSIsContainer) { $resolved } else { Split-Path $resolved -Parent }

  if (Test-IsUnderPath -Path $resolved -Parent $cardsRoot) {
    $relative = Get-RelativePathSafe -BasePath $cardsRoot -Path $resolved
    $cardName = ($relative -split '/')[0]
    $componentPath = Join-Path $cardsRoot $cardName
    $packagePath = Join-Path $componentPath 'package.json'
    $hacsPath = Join-Path $componentPath 'hacs.json'
    $package = Read-JsonOrNull -Path $packagePath
    $hacs = Read-JsonOrNull -Path $hacsPath
    $entryFile = if ($hacs -and $hacs.filename) { [string]$hacs.filename } else { "$cardName.js" }
    $fallbackRepo = if ($package -and $package.name) { [string]$package.name } else { [System.IO.Path]::GetFileNameWithoutExtension($entryFile) }
    $displayName = if ($hacs -and $hacs.name) { [string]$hacs.name } elseif ($package -and $package.name) { [string]$package.name } else { $cardName }

    return [pscustomobject]@{
      Kind = 'card'
      Name = $cardName
      DisplayName = $displayName
      Path = $componentPath
      FallbackRepo = $fallbackRepo
      PackageJson = $packagePath
      PackageLock = Join-Path $componentPath 'package-lock.json'
      HacsJson = $hacsPath
      ManifestJson = $null
      MetadataVersions = @($package.version, $hacs.version)
    }
  }

  if (Test-IsUnderPath -Path $resolved -Parent $integrationsRoot) {
    $relative = Get-RelativePathSafe -BasePath $integrationsRoot -Path $resolved
    $integrationName = ($relative -split '/')[0]
    $componentPath = Join-Path $integrationsRoot $integrationName
    $domainDirs = @(Get-ChildItem -Path (Join-Path $componentPath 'custom_components') -Directory -ErrorAction SilentlyContinue)
    if (-not $domainDirs -or $domainDirs.Count -eq 0) {
      throw "No custom_components domain folder found in $componentPath"
    }

    $domainDir = $domainDirs[0]
    $manifestPath = Join-Path $domainDir.FullName 'manifest.json'
    $manifest = Read-JsonOrNull -Path $manifestPath
    if (-not $manifest) { throw "Missing manifest.json in $($domainDir.FullName)" }

    $hacsPath = Join-Path $componentPath 'hacs.json'
    $hacs = Read-JsonOrNull -Path $hacsPath
    $domain = if ($manifest.domain) { [string]$manifest.domain } else { $domainDir.Name }
    $displayName = if ($manifest.name) { [string]$manifest.name } elseif ($hacs -and $hacs.name) { [string]$hacs.name } else { $integrationName }

    return [pscustomobject]@{
      Kind = 'integration'
      Name = $integrationName
      DisplayName = $displayName
      Path = $componentPath
      FallbackRepo = $domain.Replace('_', '-')
      PackageJson = $null
      PackageLock = $null
      HacsJson = $hacsPath
      ManifestJson = $manifestPath
      MetadataVersions = @($manifest.version, $hacs.version)
    }
  }

  throw "Path must be under custom_cards/ or integrations/: $target"
}

function Get-CurrentComponent {
  if (-not [string]::IsNullOrWhiteSpace($ComponentPath)) {
    return Get-ComponentFromPath -Path $ComponentPath
  }

  if ([string]::IsNullOrWhiteSpace($CurrentFile)) {
    throw 'Provide -CurrentFile or -ComponentPath.'
  }

  if (-not (Test-Path $CurrentFile)) {
    throw "Current file not found: $CurrentFile"
  }

  return Get-ComponentFromPath -Path $CurrentFile
}

function Get-LastTag {
  param([string]$RepoPath)

  $tag = (& git -C $RepoPath tag --list 'v*' --sort=-v:refname | Select-Object -First 1)
  if ([string]::IsNullOrWhiteSpace($tag)) { return $null }
  return $tag.Trim()
}

function Get-StatusEntries {
  param([string]$RepoPath)

  & git -C $RepoPath update-index -q --refresh 2>$null
  $lines = @(& git -C $RepoPath status --porcelain)
  foreach ($line in $lines) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    $status = $line.Substring(0, [Math]::Min(2, $line.Length)).Trim()
    $pathPart = $line.Substring([Math]::Min(3, $line.Length)).Trim()
    if ($pathPart.Contains(' -> ')) {
      $pathPart = ($pathPart -split ' -> ')[-1]
    }
    [pscustomobject]@{
      Status = if ([string]::IsNullOrWhiteSpace($status)) { 'M' } else { $status }
      Path = $pathPart -replace '\\', '/'
    }
  }
}

function Get-NumStatMap {
  param(
    [string]$RepoPath,
    [string[]]$DiffArgs
  )

  $map = @{}
  $lines = @(& git -C $RepoPath diff --numstat @DiffArgs 2>$null)
  foreach ($line in $lines) {
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    $parts = $line -split "`t"
    if ($parts.Count -lt 3) { continue }
    $path = $parts[2] -replace '\\', '/'
    $map[$path] = [pscustomobject]@{
      Added = $parts[0]
      Deleted = $parts[1]
    }
  }
  return $map
}

function Get-UntrackedFileStat {
  param(
    [string]$RepoPath,
    [string]$RelativePath
  )

  $absolutePath = Join-Path $RepoPath ($RelativePath -replace '/', [System.IO.Path]::DirectorySeparatorChar)
  if (-not (Test-Path $absolutePath) -or (Get-Item $absolutePath).PSIsContainer) {
    return $null
  }

  try {
    $lineCount = @(Get-Content -Path $absolutePath -ErrorAction Stop).Count
    return [pscustomobject]@{
      Added = [string]$lineCount
      Deleted = '0'
    }
  }
  catch {
    return $null
  }
}

function Get-FileCategory {
  param([string]$Path)

  $lower = $Path.ToLowerInvariant()
  if ($lower -match '(^|/)(readme|changelog|install|deployment|release)\.md$' -or $lower.StartsWith('docs/')) { return 'Documentation' }
  if ($lower -match '(^|/)(hacs|package|package-lock|manifest|services|strings)\.json$' -or $lower.EndsWith('services.yaml')) { return 'HACS and metadata' }
  if ($lower.StartsWith('dist/') -or $lower -match '/dist/') { return 'Build output' }
  if ($lower.StartsWith('custom_components/') -or $lower.EndsWith('.py')) { return 'Integration source' }
  if ($lower.EndsWith('.js') -or $lower.EndsWith('.ts') -or $lower.EndsWith('.css')) { return 'Card source' }
  if ($lower.StartsWith('tests/') -or $lower -match '/tests/') { return 'Tests' }
  return 'Other'
}

function Get-ChangeVerb {
  param([string]$Status)

  if ($Status -match '^\?\?') { return 'added' }
  if ($Status -match 'A') { return 'added' }
  if ($Status -match 'D') { return 'removed' }
  if ($Status -match 'R') { return 'renamed' }
  if ($Status -match 'M') { return 'changed' }
  return 'changed'
}

function Get-ReleaseChangeEntries {
  param(
    [string]$RepoPath,
    [string]$LastTag
  )

  $entries = @()
  $pendingStats = Get-NumStatMap -RepoPath $RepoPath -DiffArgs @('HEAD', '--')
  $statusEntries = @(Get-StatusEntries -RepoPath $RepoPath)

  foreach ($entry in $statusEntries) {
    $stat = $pendingStats[$entry.Path]
    if (-not $stat -and $entry.Status -match '^\?\?') {
      $stat = Get-UntrackedFileStat -RepoPath $RepoPath -RelativePath $entry.Path
    }
    $entries += [pscustomobject]@{
      Path = $entry.Path
      Status = $entry.Status
      Verb = Get-ChangeVerb -Status $entry.Status
      Category = Get-FileCategory -Path $entry.Path
      Added = if ($stat) { $stat.Added } else { '?' }
      Deleted = if ($stat) { $stat.Deleted } else { '?' }
      Source = 'working tree'
    }
  }

  if ($LastTag) {
    $committedStats = Get-NumStatMap -RepoPath $RepoPath -DiffArgs @("$LastTag..HEAD", '--')
    foreach ($path in $committedStats.Keys) {
      if ($entries.Path -contains $path) { continue }
      $stat = $committedStats[$path]
      $entries += [pscustomobject]@{
        Path = $path
        Status = 'C'
        Verb = 'changed'
        Category = Get-FileCategory -Path $path
        Added = $stat.Added
        Deleted = $stat.Deleted
        Source = "committed since $LastTag"
      }
    }
  }

  return $entries | Sort-Object Category, Path
}

function Get-CommitLines {
  param(
    [string]$RepoPath,
    [string]$LastTag
  )

  if (-not $LastTag) { return @() }
  return @(& git -C $RepoPath log "$LastTag..HEAD" --pretty='- %s (%h)' 2>$null)
}

function New-ReleaseNotes {
  param(
    [pscustomobject]$Component,
    [pscustomobject]$Origin,
    [string]$Version,
    [string]$LastTag,
    [string]$Summary,
    [string]$BuildStatus,
    [string[]]$VersionFiles,
    [pscustomobject[]]$ChangeEntries,
    [string[]]$CommitLines
  )

  $date = (Get-Date).ToString('yyyy-MM-dd')
  $title = "v$Version - $($Component.DisplayName)"
  $lines = New-Object System.Collections.Generic.List[string]
  $lines.Add("# $title")
  $lines.Add('')
  $lines.Add("- Date: $date")
  $lines.Add("- Component: $($Component.Kind) / $($Component.Name)")
  $lines.Add("- Repository: $($Origin.Owner)/$($Origin.Repo)")
  $lines.Add("- Previous tag: $(if ($LastTag) { $LastTag } else { 'none' })")
  $lines.Add("- HACS version: v$Version")
  $lines.Add('')
  $lines.Add('## Summary')
  $lines.Add('')
  $lines.Add("- $Summary")
  $lines.Add("- Build: $BuildStatus")
  if ($VersionFiles.Count -gt 0) {
    $lines.Add("- Version metadata updated: " + (($VersionFiles | Sort-Object) -join ', '))
  }
  $lines.Add('')
  $lines.Add('## Detailed changelog')
  $lines.Add('')

  if (-not $ChangeEntries -or $ChangeEntries.Count -eq 0) {
    $lines.Add('- No file changes detected.')
  }
  else {
    foreach ($group in ($ChangeEntries | Group-Object Category | Sort-Object Name)) {
      $lines.Add("### $($group.Name)")
      $lines.Add('')
      foreach ($change in ($group.Group | Sort-Object Path)) {
        $statText = if ($change.Added -eq '?' -and $change.Deleted -eq '?') { 'stat unavailable' } else { "+$($change.Added) -$($change.Deleted)" }
        $lines.Add("- ``$($change.Path)`` - $($change.Verb) ($statText, $($change.Source))")
      }
      $lines.Add('')
    }
  }

  $lines.Add('## Commits since previous tag')
  $lines.Add('')
  if ($CommitLines -and $CommitLines.Count -gt 0) {
    foreach ($commit in $CommitLines) { $lines.Add($commit) }
  }
  else {
    $lines.Add('- No committed changes since previous tag before this release commit.')
  }
  $lines.Add('')
  $lines.Add('## HACS update notes')
  $lines.Add('')
  $lines.Add("- HACS should detect this release from tag ``v$Version``.")
  $lines.Add('- If the update does not appear immediately, refresh HACS cache or wait for the next HACS refresh cycle.')
  $lines.Add('')

  return ($lines -join "`n") + "`n"
}

function ConvertTo-ChangelogEntry {
  param(
    [string]$ReleaseNotes,
    [string]$Version
  )

  $date = (Get-Date).ToString('yyyy-MM-dd')
  $body = ($ReleaseNotes -split "`r?`n") | Select-Object -Skip 2
  return "## v$Version - $date`n`n" + (($body | Where-Object { $_ -notmatch '^# ' }) -join "`n").Trim() + "`n"
}

function Update-Changelog {
  param(
    [string]$RepoPath,
    [string]$Version,
    [string]$ReleaseNotes
  )

  $changelogPath = Join-Path $RepoPath 'CHANGELOG.md'
  $entry = ConvertTo-ChangelogEntry -ReleaseNotes $ReleaseNotes -Version $Version
  $existing = if (Test-Path $changelogPath) { Get-Content -Path $changelogPath -Raw } else { "# Changelog`n`n" }
  $escapedVersion = [Regex]::Escape("## v$Version")

  if ($existing -match "(?ms)^$escapedVersion\b.*?(?=^## |\z)") {
    $updated = [Regex]::Replace($existing, "(?ms)^$escapedVersion\b.*?(?=^## |\z)", $entry.TrimEnd() + "`n`n")
  }
  elseif ($existing -match '^\s*#\s+Changelog\s*$') {
    $updated = [Regex]::Replace($existing, '(?m)^#\s+Changelog\s*$', "# Changelog`n`n$entry")
  }
  else {
    $updated = "# Changelog`n`n$entry`n" + $existing.TrimStart()
  }

  Set-Content -Path $changelogPath -Value $updated.TrimEnd() -Encoding UTF8
  Add-Content -Path $changelogPath -Value '' -Encoding UTF8
  return $changelogPath
}

function Save-ReleaseNotes {
  param(
    [string]$RepoPath,
    [string]$Version,
    [string]$ReleaseNotes
  )

  $publishDir = Join-Path $RepoPath '.publish'
  $releaseDir = Join-Path $publishDir 'releases'
  if (-not (Test-Path $releaseDir)) {
    New-Item -Path $releaseDir -ItemType Directory | Out-Null
  }

  $versionPath = Join-Path $releaseDir "v$Version.md"
  $lastPath = Join-Path $publishDir 'last_release_notes.md'
  Set-Content -Path $versionPath -Value $ReleaseNotes -Encoding UTF8
  Set-Content -Path $lastPath -Value $ReleaseNotes -Encoding UTF8
  return $versionPath
}

function Invoke-CardBuild {
  param([pscustomobject]$Component)

  if ($Component.Kind -ne 'card') { return 'skipped (not a card)' }
  if (-not (Test-Path $Component.PackageJson)) { return 'skipped (package.json missing)' }

  $package = Read-JsonOrNull -Path $Component.PackageJson
  if (-not $package.scripts -or -not $package.scripts.build) {
    return 'skipped (no npm build script)'
  }

  if ($DryRun) {
    return 'dry-run (would run build_card.ps1)'
  }

  $buildScript = Join-Path $root 'scripts\build_card.ps1'
  & pwsh -NoProfile -ExecutionPolicy Bypass -File $buildScript -CardName $Component.Name
  if ($LASTEXITCODE -ne 0) {
    throw "Build failed for card $($Component.Name)"
  }
  return 'ok'
}

function Sync-VersionMetadata {
  param(
    [pscustomobject]$Component,
    [string]$Version
  )

  $updated = New-Object System.Collections.Generic.List[string]

  if ($Component.Kind -eq 'card') {
    if (Set-JsonVersion -Path $Component.PackageJson -Version $Version) { $updated.Add('package.json') }
    if (Set-PackageLockVersion -Path $Component.PackageLock -Version $Version) { $updated.Add('package-lock.json') }
    if (Set-JsonVersion -Path $Component.HacsJson -Version $Version) { $updated.Add('hacs.json') }
  }
  else {
    if (Set-JsonVersion -Path $Component.ManifestJson -Version $Version) { $updated.Add('manifest.json') }
    if (Set-JsonVersion -Path $Component.HacsJson -Version $Version) { $updated.Add('hacs.json') }
  }

  return $updated.ToArray()
}

function New-GitHubRepositoryIfMissing {
  param(
    [pscustomobject]$Origin,
    [string]$Token
  )

  if ([string]::IsNullOrWhiteSpace($Token)) { return }
  $headers = @{
    Authorization = "Bearer $Token"
    Accept = 'application/vnd.github+json'
    'X-GitHub-Api-Version' = '2022-11-28'
  }

  try {
    Invoke-RestMethod -Uri "https://api.github.com/repos/$($Origin.Owner)/$($Origin.Repo)" -Headers $headers -Method Get | Out-Null
    return
  }
  catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -ne 404) { throw }
  }

  $body = @{ name = $Origin.Repo; private = $false } | ConvertTo-Json
  Invoke-RestMethod -Uri 'https://api.github.com/user/repos' -Headers $headers -Method Post -Body $body -ContentType 'application/json' | Out-Null
  Write-OK "GitHub repository created: $($Origin.Owner)/$($Origin.Repo)"
}

function Push-Repo {
  param(
    [string]$RepoPath,
    [string]$Version,
    [bool]$PushTag,
    [pscustomobject]$Origin,
    [string]$Token
  )

  & git -C $RepoPath config gc.auto 0 2>$null
  & git -C $RepoPath config gc.autoDetach false 2>$null

  $cleanUrl = "https://github.com/$($Origin.Owner)/$($Origin.Repo).git"
  $originalUrl = (& git -C $RepoPath remote get-url origin 2>$null)
  $useTokenRemote = -not [string]::IsNullOrWhiteSpace($Token)

  if ($useTokenRemote) {
    $authUrl = "https://$($Origin.Owner):$Token@github.com/$($Origin.Owner)/$($Origin.Repo).git"
    & git -C $RepoPath remote set-url origin $authUrl | Out-Null
  }

  try {
    & git -C $RepoPath push -u origin main
    if ($LASTEXITCODE -ne 0) { throw 'Push main failed' }

    if ($PushTag) {
      & git -C $RepoPath push origin "v$Version"
      if ($LASTEXITCODE -ne 0) { throw "Push tag v$Version failed" }
    }
  }
  finally {
    if ($useTokenRemote) {
      $restoreUrl = if (-not [string]::IsNullOrWhiteSpace($originalUrl)) { $originalUrl.Trim() } else { $cleanUrl }
      if ($restoreUrl -match '@github\.com') { $restoreUrl = $cleanUrl }
      & git -C $RepoPath remote set-url origin $restoreUrl | Out-Null
    }
  }
}

function Set-GitHubReleaseWithApi {
  param(
    [pscustomobject]$Origin,
    [string]$Tag,
    [string]$Notes,
    [string]$Token
  )

  $headers = @{
    Authorization = "Bearer $Token"
    Accept = 'application/vnd.github+json'
    'X-GitHub-Api-Version' = '2022-11-28'
  }
  $baseUri = "https://api.github.com/repos/$($Origin.Owner)/$($Origin.Repo)"
  $body = @{
    tag_name = $Tag
    name = $Tag
    body = $Notes
    draft = [bool]$Draft
    prerelease = [bool]$Prerelease
  } | ConvertTo-Json -Depth 10

  try {
    $existing = Invoke-RestMethod -Uri "$baseUri/releases/tags/$Tag" -Headers $headers -Method Get
    Invoke-RestMethod -Uri "$baseUri/releases/$($existing.id)" -Headers $headers -Method Patch -Body $body -ContentType 'application/json' | Out-Null
    Write-OK "GitHub release updated: $($Origin.Owner)/$($Origin.Repo) $Tag"
    return
  }
  catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -ne 404) { throw }
  }

  Invoke-RestMethod -Uri "$baseUri/releases" -Headers $headers -Method Post -Body $body -ContentType 'application/json' | Out-Null
  Write-OK "GitHub release created: $($Origin.Owner)/$($Origin.Repo) $Tag"
}

function Set-GitHubReleaseWithGh {
  param(
    [pscustomobject]$Origin,
    [string]$Tag,
    [string]$NotesPath
  )

  $gh = Get-Command gh -ErrorAction SilentlyContinue
  if (-not $gh) { throw 'GitHub CLI (gh) not found and no GitHub token available.' }

  $repoRef = "$($Origin.Owner)/$($Origin.Repo)"
  & gh release view $Tag --repo $repoRef 1>$null 2>$null
  if ($LASTEXITCODE -eq 0) {
    & gh release edit $Tag --repo $repoRef --title $Tag --notes-file $NotesPath
    if ($LASTEXITCODE -ne 0) { throw "gh release edit failed for $repoRef $Tag" }
    Write-OK "GitHub release updated with gh: $repoRef $Tag"
    return
  }

  $args = @('release', 'create', $Tag, '--repo', $repoRef, '--title', $Tag, '--notes-file', $NotesPath)
  if ($Draft) { $args += '--draft' }
  if ($Prerelease) { $args += '--prerelease' }
  & gh @args
  if ($LASTEXITCODE -ne 0) { throw "gh release create failed for $repoRef $Tag" }
  Write-OK "GitHub release created with gh: $repoRef $Tag"
}

function Ensure-Tag {
  param(
    [string]$RepoPath,
    [string]$Version
  )

  $tag = "v$Version"
  $head = (& git -C $RepoPath rev-parse HEAD).Trim()
  $tagCommit = (& git -C $RepoPath rev-parse "refs/tags/$tag^{commit}" 2>$null)
  if ($LASTEXITCODE -eq 0 -and -not [string]::IsNullOrWhiteSpace($tagCommit)) {
    if ($tagCommit.Trim() -eq $head) {
      Write-Info "Tag already exists on HEAD: $tag"
      return $false
    }
    throw "Tag $tag already exists but does not point to HEAD."
  }

  & git -C $RepoPath tag $tag
  if ($LASTEXITCODE -ne 0) { throw "Tag creation failed: $tag" }
  Write-OK "Tag created: $tag"
  return $true
}

try {
  $component = Get-CurrentComponent
  Ensure-GitRepository -RepoPath $component.Path
  $origin = Get-OriginInfo -RepoPath $component.Path -FallbackOwner $GitHubUsername -FallbackRepo $component.FallbackRepo
  $lastTag = Get-LastTag -RepoPath $component.Path
  $initialStatus = @(Get-StatusEntries -RepoPath $component.Path)
  $hasLocalChanges = $initialStatus.Count -gt 0

  $baseVersion = Get-MaxVersion -RepoPath $component.Path -MetadataVersions $component.MetadataVersions
  $releaseVersion = if (-not [string]::IsNullOrWhiteSpace($Version)) {
    $Version.TrimStart('v')
  }
  elseif ($hasLocalChanges) {
    Get-BumpedVersion -BaseVersion $baseVersion -BumpKind $Bump
  }
  else {
    ConvertFrom-SemVerObject -SemVer $baseVersion
  }

  $summary = if ([string]::IsNullOrWhiteSpace($Message)) {
    "Release HACS for $($component.DisplayName)"
  }
  else {
    $Message.Trim()
  }

  Write-Info "Component: $($component.Kind) / $($component.Name)"
  Write-Info "Repository: $($origin.Owner)/$($origin.Repo)"
  Write-Info "Version: v$releaseVersion"
  Write-Info "Mode: $(if ($DryRun) { 'dry-run' } else { 'release' })"

  if ($DryRun) {
    $previewEntries = @(Get-ReleaseChangeEntries -RepoPath $component.Path -LastTag $lastTag)
    $previewNotes = New-ReleaseNotes -Component $component -Origin $origin -Version $releaseVersion -LastTag $lastTag -Summary $summary -BuildStatus 'dry-run' -VersionFiles @() -ChangeEntries $previewEntries -CommitLines @(Get-CommitLines -RepoPath $component.Path -LastTag $lastTag)
    Write-Host ''
    Write-Host $previewNotes
    exit 0
  }

  $updatedVersionFiles = @()
  if (-not $NoTag) {
    $updatedVersionFiles = @(Sync-VersionMetadata -Component $component -Version $releaseVersion)
  }

  $buildStatus = Invoke-CardBuild -Component $component
  $changeEntries = @(Get-ReleaseChangeEntries -RepoPath $component.Path -LastTag $lastTag)
  $commitLines = @(Get-CommitLines -RepoPath $component.Path -LastTag $lastTag)
  $releaseNotes = New-ReleaseNotes -Component $component -Origin $origin -Version $releaseVersion -LastTag $lastTag -Summary $summary -BuildStatus $buildStatus -VersionFiles $updatedVersionFiles -ChangeEntries $changeEntries -CommitLines $commitLines
  [void](Update-Changelog -RepoPath $component.Path -Version $releaseVersion -ReleaseNotes $releaseNotes)
  $notesPath = Save-ReleaseNotes -RepoPath $component.Path -Version $releaseVersion -ReleaseNotes $releaseNotes

  & git -C $component.Path add .
  if ($LASTEXITCODE -ne 0) { throw 'git add failed' }

  $statusAfterNotes = @(Get-StatusEntries -RepoPath $component.Path)
  $commitMessage = if ($summary -match "v$releaseVersion") { $summary } else { "$summary v$releaseVersion" }
  $createdCommit = $false

  if ($statusAfterNotes.Count -gt 0) {
    & git -C $component.Path commit -m $commitMessage
    if ($LASTEXITCODE -ne 0) { throw 'git commit failed' }
    $createdCommit = $true
    Write-OK "Commit created: $commitMessage"
  }
  else {
    Write-Info 'No local changes to commit.'
  }

  $createdTag = $false
  if (-not $NoTag) {
    $createdTag = Ensure-Tag -RepoPath $component.Path -Version $releaseVersion
  }

  if ($NoPush) {
    Write-Info 'NoPush enabled: push and GitHub release skipped.'
    Write-OK "Release prepared locally: v$releaseVersion"
    exit 0
  }

  Ensure-Origin -RepoPath $component.Path -Origin $origin
  $token = Get-GitHubTokenOrNull -Token $GitHubToken
  if ($token) {
    New-GitHubRepositoryIfMissing -Origin $origin -Token $token
  }

  if ($createdCommit -or $createdTag) {
    Push-Repo -RepoPath $component.Path -Version $releaseVersion -PushTag:(-not $NoTag) -Origin $origin -Token $token
  }
  else {
    Write-Info 'No new commit/tag to push.'
  }

  if (-not $NoTag) {
    if ($token) {
      Set-GitHubReleaseWithApi -Origin $origin -Tag "v$releaseVersion" -Notes $releaseNotes -Token $token
    }
    else {
      Set-GitHubReleaseWithGh -Origin $origin -Tag "v$releaseVersion" -NotesPath $notesPath
    }
  }

  Write-OK "HACS release ready: $($origin.Owner)/$($origin.Repo) v$releaseVersion"
}
catch {
  Write-Fail $_.Exception.Message
  exit 1
}
