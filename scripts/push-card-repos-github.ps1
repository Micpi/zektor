<#
.SYNOPSIS
Pousse les 5 repos de cartes vers GitHub

.DESCRIPTION
Pour chaque repo de carte:
1. Ajoute le remote GitHub
2. Pousse main + tags

Utilise un GitHub token pour l'authentification.

.EXAMPLE
.\scripts\push-card-repos-github.ps1 -GitHubToken "ghp_xxxx..."

.EXAMPLE (interactif)
.\scripts\push-card-repos-github.ps1
# Vous sera demandé le token GitHub
#>

param(
    [string]$ReposDir = "card-repos",
    [string]$GitHubUsername = "Micpi",
    [string]$GitHubToken = $null
)

$ErrorActionPreference = "Stop"

# Demander le token s'il n'est pas fourni
if (-not $GitHubToken) {
    Write-Host "`n🔐 GitHub Token requis pour l'authentification`n"
    $GitHubToken = Read-Host "Entrez votre GitHub personal access token (classic)" -AsSecureString
    $GitHubToken = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto(
        [System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($GitHubToken)
    )
}

if (-not $GitHubToken) {
    Write-Error "Token GitHub manquant. Impossible de continuer."
    exit 1
}

$cards = @(
    "thermo-halo-card",
    "naive-flex-card",
    "alpha-area-card",
    "activity-select-card",
    "ios-popup-card"
)

$failedCards = @()
$successCards = @()

foreach ($card in $cards) {
    $cardPath = Join-Path $ReposDir $card
    $repoUrl = "https://${GitHubUsername}:${GitHubToken}@github.com/${GitHubUsername}/${card}.git"
    
    if (-not (Test-Path $cardPath)) {
        Write-Warning "Dossier non trouvé: $cardPath"
        $failedCards += $card
        continue
    }
    
    Write-Host "`n================================"
    Write-Host "Push: $card"
    Write-Host "================================`n"
    
    try {
        # Check if remote exists
        $remoteExists = & git -C $cardPath remote -v 2>&1 | Select-String "origin"
        
        if ($remoteExists) {
            Write-Host "[!] Remote origin déjà configuré, removing..."
            & git -C $cardPath remote remove origin
        }
        
        # Add remote
        & git -C $cardPath remote add origin $repoUrl
        Write-Host "[✓] Remote configuré"
        
        # Push main
        Write-Host "[↑] Push main..."
        & git -C $cardPath push -u origin main 2>&1 | Select-String -Pattern "(master|main|Branch|done)"
        Write-Host "[✓] Main poussé"
        
        # Push tag
        Write-Host "[↑] Push tag v0.1.0..."
        & git -C $cardPath push origin v0.1.0 2>&1 | Select-String -Pattern "(new tag|tag|done)"
        Write-Host "[✓] Tag poussé"
        
        $successCards += $card
        
    } catch {
        Write-Error "Erreur pour $card : $_"
        $failedCards += $card
    }
}

Write-Host "`n========================================`n"
Write-Host "✅ Résumé du push`n"

if ($successCards.Count -gt 0) {
    Write-Host "✓ Succès ($($successCards.Count)):"
    foreach ($card in $successCards) {
        Write-Host "  - $card"
    }
}

if ($failedCards.Count -gt 0) {
    Write-Host "`n✗ Échoués ($($failedCards.Count)):"
    foreach ($card in $failedCards) {
        Write-Host "  - $card"
    }
}

Write-Host "`n========================================`n"
Write-Host "Les repos sont maintenant sur GitHub!`n"
Write-Host "Pour les ajouter dans HACS:`n"
Write-Host "1. Allez dans HACS → Custom repositories`n"
Write-Host "2. Pour chaque carte, ajoutez:`n"
Write-Host "   https://github.com/Micpi/<card-name>`n"
Write-Host "3. Choisissez Type: Lovelace`n"
Write-Host "`n========================================`n"
