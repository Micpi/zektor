<#
.SYNOPSIS
    Veille les nouveautes Home Assistant/HACS utiles au dev d'integrations et de custom cards.
.DESCRIPTION
    - Lit les dernieres releases GitHub (core + frontend)
    - Lit le flux blog dev Home Assistant
    - Detecte les changements depuis le dernier snapshot
    - Ecrit un resume dans knowledge/ha_api_notes/latest_watch.md
#>
[CmdletBinding()]
param(
  [string]$StateFile = "logs/ha_api_watch_state.json",
  [string]$ReportFile = "knowledge/ha_api_notes/latest_watch.md",
  [switch]$FailOnChange
)

$ErrorActionPreference = "Stop"

function Write-Header($msg) {
  Write-Host ""
  Write-Host "  [HA-API] $msg" -ForegroundColor Cyan
  Write-Host ("  " + ("-" * ($msg.Length + 12))) -ForegroundColor DarkGray
}

function Get-LatestReleaseTag([string]$repo) {
  $uri = "https://api.github.com/repos/$repo/releases?per_page=1"
  $headers = @{ "User-Agent" = "HomeAssistant-AI-API-Watch" }
  $releases = Invoke-RestMethod -Uri $uri -Headers $headers -Method Get
  if ($releases -and $releases.Count -gt 0) {
    return [PSCustomObject]@{
      tag          = $releases[0].tag_name
      published_at = $releases[0].published_at
      url          = $releases[0].html_url
    }
  }

  $tagsUri = "https://api.github.com/repos/$repo/tags?per_page=1"
  $tags = Invoke-RestMethod -Uri $tagsUri -Headers $headers -Method Get
  if ($tags -and $tags.Count -gt 0) {
    return [PSCustomObject]@{
      tag          = $tags[0].name
      published_at = ""
      url          = "https://github.com/$repo/releases"
    }
  }

  return [PSCustomObject]@{
    tag          = "unknown"
    published_at = ""
    url          = "https://github.com/$repo/releases"
  }
}

function Get-DeveloperFeedItems {
  $homeUrl = "https://developers.home-assistant.io/"
  $html = Invoke-WebRequest -Uri $homeUrl -UseBasicParsing
  $keywords = @("deprecation", "breaking", "config flow", "config_flow", "frontend", "api", "card", "selector")

  $matches = [regex]::Matches($html.Content, '<a href="(?<url>/blog/[^\"]+)">(?<title>[^<]+)</a>')
  $items = foreach ($m in $matches) {
    $url = "https://developers.home-assistant.io$([string]$m.Groups["url"].Value)"
    $date = ""
    $dateMatch = [regex]::Match($url, '/(\d{4})/(\d{2})/(\d{2})/')
    if ($dateMatch.Success) {
      $date = "$($dateMatch.Groups[1].Value)-$($dateMatch.Groups[2].Value)-$($dateMatch.Groups[3].Value)"
    }

    [PSCustomObject]@{
      title   = [string]$m.Groups["title"].Value
      link    = $url
      pubDate = $date
    }
  }

  $dedup = $items | Group-Object title | ForEach-Object { $_.Group[0] } | Select-Object -First 25
  $filtered = foreach ($item in $dedup) {
    $blob = ($item.title).ToLowerInvariant()
    $matched = $false
    foreach ($kw in $keywords) {
      if ($blob.Contains($kw)) { $matched = $true; break }
    }

    if ($matched) {
      $item
    }
  }

  return @($filtered | Select-Object -First 8)
}

$root = Resolve-Path "$PSScriptRoot\.."
$statePath = if ([System.IO.Path]::IsPathRooted($StateFile)) {
  $StateFile
}
else {
  Join-Path $root $StateFile
}
$reportPath = if ([System.IO.Path]::IsPathRooted($ReportFile)) {
  $ReportFile
}
else {
  Join-Path $root $ReportFile
}

$stateDir = Split-Path $statePath -Parent
$reportDir = Split-Path $reportPath -Parent
if (-not (Test-Path $stateDir)) { New-Item -ItemType Directory -Path $stateDir -Force | Out-Null }
if (-not (Test-Path $reportDir)) { New-Item -ItemType Directory -Path $reportDir -Force | Out-Null }

Write-Header "Recuperation des versions officielles"
$core = Get-LatestReleaseTag -repo "home-assistant/core"
$frontend = Get-LatestReleaseTag -repo "home-assistant/frontend"
Write-Host "  core: $($core.tag)"
Write-Host "  frontend: $($frontend.tag)"

Write-Header "Recuperation du flux dev"
$feedItems = Get-DeveloperFeedItems
if ($feedItems.Count -eq 0) {
  Write-Host "  Aucun item filtre detecte"
}
else {
  Write-Host "  Items suivis: $($feedItems.Count)"
}

$newState = [PSCustomObject]@{
  checked_at     = (Get-Date).ToString("s")
  core_tag       = $core.tag
  frontend_tag   = $frontend.tag
  top_feed_title = $(if ($feedItems.Count -gt 0) { $feedItems[0].title } else { "" })
  top_feed_link  = $(if ($feedItems.Count -gt 0) { $feedItems[0].link } else { "" })
}

$changed = $false
$oldState = $null
if (Test-Path $statePath) {
  try { $oldState = Get-Content $statePath -Raw | ConvertFrom-Json } catch { $oldState = $null }
}

if ($oldState) {
  if ($oldState.core_tag -ne $newState.core_tag) { $changed = $true }
  if ($oldState.frontend_tag -ne $newState.frontend_tag) { $changed = $true }
  if ($oldState.top_feed_title -ne $newState.top_feed_title) { $changed = $true }
}
else {
  $changed = $true
}

$newState | ConvertTo-Json | Set-Content -Path $statePath -Encoding utf8

$lines = @()
$lines += "# Veille API Home Assistant"
$lines += ""
$lines += "- Dernier check: $((Get-Date).ToString('yyyy-MM-dd HH:mm:ss'))"
$lines += "- Core: [$($core.tag)]($($core.url))"
$lines += "- Frontend: [$($frontend.tag)]($($frontend.url))"
$lines += "- Changement detecte: $($(if($changed){'YES'}else{'NO'}))"
$lines += ""
$lines += "## Billets dev surveilles"
$lines += ""

if ($feedItems.Count -eq 0) {
  $lines += "- Aucun billet pertinent trouve avec les filtres"
}
else {
  foreach ($item in $feedItems) {
    $prefix = if ($item.pubDate) { "$($item.pubDate): " } else { "" }
    $lines += "- $prefix[$($item.title)]($($item.link))"
  }
}

$lines += ""
$lines += "## Actions recommandees"
$lines += ""
$lines += "- Verifier les impacts sur config_flow.py (deprecations)
- Verifier les impacts sur les editeurs de cartes (selectors et picker)
- Mettre a jour les templates si une API est marquee comme breaking"

$lines -join "`r`n" | Set-Content -Path $reportPath -Encoding utf8

if ($changed) {
  Write-Host ""
  Write-Host "  Nouveautes detectees depuis le dernier snapshot." -ForegroundColor Yellow
  if ($FailOnChange) {
    exit 2
  }
}
else {
  Write-Host ""
  Write-Host "  Aucun changement majeur detecte depuis le dernier snapshot." -ForegroundColor Green
}

exit 0
