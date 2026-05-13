<#
.SYNOPSIS
    Build une custom card Lovelace.
.PARAMETER CardName
    Nom du dossier de la carte dans custom_cards/.
.PARAMETER Watch
    Mode watch (rebuild automatique à chaque modification).
#>
[CmdletBinding()]
param(
    [Parameter(Mandatory)]
    [string]$CardName,

    [switch]$Watch
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path "$PSScriptRoot\.."
$cardPath = Join-Path $root "custom_cards" $CardName

function Write-Header($msg) {
    Write-Host ""
    Write-Host "  📦 $msg" -ForegroundColor Cyan
    Write-Host ("  " + ("-" * ($msg.Length + 4))) -ForegroundColor DarkGray
}

function Write-OK($msg)  { Write-Host "  ✅ $msg" -ForegroundColor Green }
function Write-Fail($msg){ Write-Host "  ❌ $msg" -ForegroundColor Red }

# Vérifier que le dossier existe
if (-not (Test-Path $cardPath)) {
    Write-Fail "Carte introuvable : $cardPath"
    Write-Host "  Cartes disponibles :"
    Get-ChildItem (Join-Path $root "custom_cards") -Directory | ForEach-Object {
        Write-Host "    - $($_.Name)" -ForegroundColor Yellow
    }
    exit 1
}

# Vérifier package.json
$packageJson = Join-Path $cardPath "package.json"
if (-not (Test-Path $packageJson)) {
    Write-Fail "package.json introuvable dans $cardPath"
    exit 1
}

Write-Header "Build : $CardName"
Set-Location $cardPath

# Installer les dépendances si node_modules absent
if (-not (Test-Path (Join-Path $cardPath "node_modules"))) {
    Write-Host "  📦 Installation des dépendances npm..." -ForegroundColor Yellow
    & npm install
    if ($LASTEXITCODE -ne 0) { Write-Fail "npm install échoué"; exit 1 }
    Write-OK "Dépendances installées"
}

# Build
if ($Watch) {
    Write-Host "  👁️  Mode watch activé (Ctrl+C pour arrêter)..." -ForegroundColor Yellow
    & npm run watch
} else {
    Write-Host "  🔧 Build en cours..." -ForegroundColor Yellow
    & npm run build
    if ($LASTEXITCODE -ne 0) { Write-Fail "Build échoué"; exit 1 }

    # Copier dans les exemples si dist/ existe
    $distFile = Join-Path $cardPath "dist" "$CardName.js"
    if (Test-Path $distFile) {
        $destDir = Join-Path $root "examples" "cartes Lovelace"
        Copy-Item $distFile $destDir -Force
        Write-OK "Fichier copié dans examples/cartes Lovelace/"
    }

    Write-OK "Build terminé : $CardName"
}
