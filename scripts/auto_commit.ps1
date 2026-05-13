<#
.SYNOPSIS
    Commit/push automatique cible HA (custom_cards + integrations) avec versionning et tag.
.PARAMETER Message
    Message du commit. Si absent, un message auto est genere.
.PARAMETER NoPush
    Effectue uniquement le commit et le tag local.
.PARAMETER NoTag
    Desactive la creation automatique du tag Git.
.PARAMETER Watch
    Lance un mode surveillance qui commit automatiquement a chaque changement detecte.
.PARAMETER IntervalSeconds
    Frequence de scan en mode Watch.
#>
[CmdletBinding()]
param(
    [string]$Message,
    [switch]$NoPush,
    [switch]$NoTag,
    [switch]$Watch,
    [ValidateRange(2, 3600)]
    [int]$IntervalSeconds = 8
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path "$PSScriptRoot\.."
$scopedPaths = @("custom_cards", "integrations")

function Write-Header($msg) {
    Write-Host ""
    Write-Host "  $msg" -ForegroundColor Cyan
    Write-Host ("  " + ("-" * $msg.Length)) -ForegroundColor DarkGray
}

function Write-OK($msg) { Write-Host "  [OK] $msg" -ForegroundColor Green }
function Write-Fail($msg) { Write-Host "  [KO] $msg" -ForegroundColor Red }
function Write-Info($msg) { Write-Host "  [INFO] $msg" -ForegroundColor Blue }

function Get-NextVersion {
    $latestRaw = & git tag --list "v*" --sort=-v:refname | Select-Object -First 1
    $latest = if ($null -eq $latestRaw) { "" } else { $latestRaw.ToString().Trim() }
    if ([string]::IsNullOrWhiteSpace($latest)) {
        return "0.1.0"
    }

    if ($latest -notmatch '^v?(\d+)\.(\d+)\.(\d+)$') {
        throw "Tag inattendu: '$latest'. Format attendu: vMAJOR.MINOR.PATCH"
    }

    $major = [int]$Matches[1]
    $minor = [int]$Matches[2]
    $patch = [int]$Matches[3] + 1
    return "$major.$minor.$patch"
}

function Get-ScopedStatus {
    return @(& git status --porcelain -- $scopedPaths)
}

function Get-ChangedComponentDirs([string[]]$statusLines) {
    $dirs = New-Object System.Collections.Generic.HashSet[string]
    foreach ($line in $statusLines) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }

        $pathPart = $line.Substring([Math]::Min(3, $line.Length)).Trim()
        if ($pathPart.Contains(" -> ")) {
            $pathPart = ($pathPart -split " -> ")[-1]
        }

        $normalized = $pathPart -replace '\\', '/'
        if ($normalized -match '^(custom_cards|integrations)/([^/]+)/') {
            [void]$dirs.Add("$($Matches[1])/$($Matches[2])")
        }
    }

    return $dirs
}

function Set-JsonVersion([string]$jsonPath, [string]$version) {
    if (-not (Test-Path $jsonPath)) { return }
    $raw = Get-Content -Raw -Path $jsonPath
    $obj = $raw | ConvertFrom-Json
    if ($obj.PSObject.Properties.Name -contains "version") {
        $obj.version = $version
    }
    else {
        $obj | Add-Member -MemberType NoteProperty -Name "version" -Value $version
    }
    $obj | ConvertTo-Json -Depth 100 | Set-Content -Path $jsonPath -Encoding UTF8
    Write-Info "Version $version appliquee: $jsonPath"
}

function Update-VersionFiles([string[]]$componentDirs, [string]$version) {
    foreach ($componentDir in $componentDirs) {
        $absoluteDir = Join-Path $root $componentDir
        if (-not (Test-Path $absoluteDir)) { continue }

        Set-JsonVersion (Join-Path $absoluteDir "package.json") $version
        Set-JsonVersion (Join-Path $absoluteDir "hacs.json") $version
        Set-JsonVersion (Join-Path $absoluteDir "manifest.json") $version
    }
}

function Invoke-ScopedAutoCommit {
    $status = Get-ScopedStatus
    if ($status.Count -eq 0) {
        Write-Info "Aucune modification detectee dans custom_cards/ ou integrations/."
        return $false
    }

    Write-Host ""
    Write-Host "  Fichiers modifies (scope HA):" -ForegroundColor DarkGray
    $status | ForEach-Object { Write-Host "    $_" -ForegroundColor Yellow }

    $nextVersion = Get-NextVersion
    $tagName = "v$nextVersion"
    $components = Get-ChangedComponentDirs -statusLines $status
    Update-VersionFiles -componentDirs $components -version $nextVersion

    & git add -- $scopedPaths
    if ($LASTEXITCODE -ne 0) { throw "git add scope HA a echoue" }
    Write-OK "git add -- custom_cards integrations"

    $commitMessage = if ([string]::IsNullOrWhiteSpace($Message)) {
        "chore(auto): update HA cards/integrations $tagName"
    }
    else {
        "$Message $tagName"
    }

    & git commit -m $commitMessage 2>&1
    if ($LASTEXITCODE -ne 0) { throw "Commit echoue" }
    Write-OK "Commit: $commitMessage"

    if (-not $NoTag) {
        & git tag $tagName 2>&1
        if ($LASTEXITCODE -ne 0) { throw "Creation du tag echouee: $tagName" }
        Write-OK "Tag cree: $tagName"
    }

    if (-not $NoPush) {
        & git push 2>&1
        if ($LASTEXITCODE -ne 0) { throw "Push echoue" }
        Write-OK "Push branche reussi"

        if (-not $NoTag) {
            & git push origin $tagName 2>&1
            if ($LASTEXITCODE -ne 0) { throw "Push tag echoue: $tagName" }
            Write-OK "Push tag reussi: $tagName"
        }
    }
    else {
        Write-Info "NoPush active: commit/tag local uniquement."
    }

    return $true
}

# Verifier que Git est disponible
$git = Get-Command git -ErrorAction SilentlyContinue
if (-not $git) {
    Write-Fail "git non trouve"
    exit 1
}

Set-Location $root
& git rev-parse --is-inside-work-tree *> $null
if ($LASTEXITCODE -ne 0) {
    Write-Fail "Ce dossier n'est pas un repository Git: $root"
    exit 1
}

Write-Header "Auto Commit HA Scope"

if ($Watch) {
    Write-Info "Mode Watch actif (scan toutes les $IntervalSeconds secondes)."
    Write-Info "Scope versionne: custom_cards/ + integrations/"
    while ($true) {
        try {
            [void](Invoke-ScopedAutoCommit)
        }
        catch {
            Write-Fail $_.Exception.Message
        }

        Start-Sleep -Seconds $IntervalSeconds
    }
}

try {
    [void](Invoke-ScopedAutoCommit)
    Write-Host ""
    Write-OK "Termine"
}
catch {
    Write-Fail $_.Exception.Message
    exit 1
}
