<#
.SYNOPSIS
    Lance les tests pytest pour les intégrations Home Assistant.
.PARAMETER Integration
    Nom de l'intégration à tester (optionnel). Si omis, tous les tests sont lancés.
.PARAMETER Coverage
    Active le rapport de couverture de code.
#>
[CmdletBinding()]
param(
  [string]$Integration = "",
  [switch]$Coverage
)

$ErrorActionPreference = "Continue"
$root = Resolve-Path "$PSScriptRoot\.."

function Write-Header($msg) {
  Write-Host ""
  Write-Host "  🧪 $msg" -ForegroundColor Cyan
  Write-Host ("  " + ("-" * ($msg.Length + 4))) -ForegroundColor DarkGray
}

# Résoudre l'interpréteur Python (priorité au venv du workspace)
$venvPython = Join-Path $root ".venv\Scripts\python.exe"
$pythonExe = if (Test-Path $venvPython) { $venvPython } else { "python" }

# Vérifier pytest via python -m pytest
& $pythonExe -m pytest --version *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host "  ❌ pytest non trouvé dans l'environnement Python actif. Installez-le : pip install pytest pytest-homeassistant-custom-component" -ForegroundColor Red
  exit 1
}

# Construire les arguments
$pytestParameters = @("-v", "--tb=short", "--color=yes")

if ($Integration) {
  $testPath = Join-Path $root "tests" $Integration
  if (-not (Test-Path $testPath)) {
    Write-Host "  ⚠️  Dossier de test introuvable : $testPath" -ForegroundColor Yellow
    $testPath = Join-Path $root "tests"
  }
  $pytestParameters += $testPath
}
else {
  $pytestParameters += Join-Path $root "tests"
}

if ($Coverage) {
  $pytestParameters += "--cov=integrations"
  $pytestParameters += "--cov-report=term-missing"
  $pytestParameters += "--cov-report=html:logs/coverage_html"
}

Write-Header "Tests pytest"
Write-Host "  Commande : $pythonExe -m pytest $($pytestParameters -join ' ')" -ForegroundColor DarkGray
Write-Host ""

Set-Location $root
& $pythonExe -m pytest @pytestParameters

$exitCode = $LASTEXITCODE
Write-Host ""
if ($exitCode -eq 0) {
  Write-Host "  ✅ Tous les tests sont passés" -ForegroundColor Green
}
elseif ($exitCode -eq 5) {
  Write-Host "  ⚠️  Aucun test collecté (pytest code 5)" -ForegroundColor Yellow
  exit 0
}
else {
  Write-Host "  ❌ Des tests ont échoué (code: $exitCode)" -ForegroundColor Red
}
exit $exitCode
