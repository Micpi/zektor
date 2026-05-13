<#
.SYNOPSIS
    Valide la configuration YAML du workspace Home Assistant.
.DESCRIPTION
    Vérifie tous les fichiers YAML avec yamllint si disponible,
    puis tente de valider la config HA si hass est installé.
#>
[CmdletBinding()]
param(
  [string]$Path = "$PSScriptRoot\.."
)

$ErrorActionPreference = "Stop"
$root = Resolve-Path $Path

function Write-Header($msg) {
  Write-Host ""
  Write-Host "  🔧  $msg" -ForegroundColor Cyan
  Write-Host ("  " + ("-" * ($msg.Length + 4))) -ForegroundColor DarkGray
}

function Write-OK($msg) { Write-Host "  ✅ $msg" -ForegroundColor Green }
function Write-Fail($msg) { Write-Host "  ❌ $msg" -ForegroundColor Red }
function Write-Warn($msg) { Write-Host "  ⚠️  $msg" -ForegroundColor Yellow }

$errors = 0

# ── 1. yamllint ─────────────────────────────────────────────────────────────
Write-Header "Vérification YAML (yamllint)"

$venvYamlLint = Join-Path $root ".venv\Scripts\yamllint.exe"
$yamllintCmd = if (Test-Path $venvYamlLint) { $venvYamlLint } else { (Get-Command yamllint -ErrorAction SilentlyContinue)?.Source }
if ($yamllintCmd) {
  $yamlFiles = Get-ChildItem -Path $root -Recurse -Include *.yaml, *.yml |
  Where-Object { $_.FullName -notmatch "\\node_modules\\|\\__pycache__\\|\\.venv\\" } |
  Select-Object -ExpandProperty FullName

  foreach ($file in $yamlFiles) {
    $rel = $file.Replace($root.Path, "").TrimStart("\")
    $result = & $yamllintCmd -d "{extends: default, rules: {line-length: {max: 200}, new-lines: {type: unix}, document-start: disable, truthy: disable, comments: disable}}" $file 2>&1
    if ($LASTEXITCODE -ne 0) {
      Write-Fail "$rel"
      $result | ForEach-Object { Write-Host "     $_" -ForegroundColor DarkRed }
      $errors++
    }
    else {
      Write-OK $rel
    }
  }
}
else {
  Write-Warn "yamllint non installé (pip install yamllint). Vérification syntaxique basique..."
  $yamlFiles = Get-ChildItem -Path $root -Recurse -Include *.yaml, *.yml |
  Where-Object { $_.FullName -notmatch "\\node_modules\\|\\__pycache__\\|\\.venv\\" } |
  Select-Object -ExpandProperty FullName
  foreach ($file in $yamlFiles) {
    try {
      $content = Get-Content $file -Raw
      if ($content -match "\t") {
        $rel = $file.Replace($root.Path, "").TrimStart("\")
        Write-Warn "Tabulations détectées dans $rel"
      }
      else {
        $rel = $file.Replace($root.Path, "").TrimStart("\")
        Write-OK $rel
      }
    }
    catch {
      Write-Fail $file
      $errors++
    }
  }
}

# ── 2. hass check-config ────────────────────────────────────────────────────
Write-Header "Vérification config Home Assistant (hass)"

$venvHass = Join-Path $root ".venv\Scripts\hass.exe"
$hassCmd = if (Test-Path $venvHass) { $venvHass } else { (Get-Command hass -ErrorAction SilentlyContinue)?.Source }
if ($hassCmd) {
  & $hassCmd --script check_config 2>&1 | ForEach-Object {
    if ($_ -match "error|invalid" ) { Write-Fail $_; $errors++ }
    elseif ($_ -match "warning") { Write-Warn $_ }
    else { Write-Host "  $_" }
  }
}
else {
  Write-Warn "hass non disponible. Installez Home Assistant pour une validation complète."
}

# ── Résultat final ───────────────────────────────────────────────────────────
Write-Host ""
if ($errors -eq 0) {
  Write-Host "  ✅ Validation YAML OK (aucune erreur)" -ForegroundColor Green
  exit 0
}
else {
  Write-Host "  ❌ $errors erreur(s) détectée(s)" -ForegroundColor Red
  exit 1
}
