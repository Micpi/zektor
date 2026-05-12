<#
.SYNOPSIS
Initialise Git dans chaque custom_cards/<card-name> pour en faire des repos indépendants

.DESCRIPTION
Pour chaque carte dans custom_cards/:
- Crée .gitignore si absent
- Vérifie hacs.json existe
- git init -b main
- git add .
- git commit -m "Initial commit"
- git tag v0.1.0

.EXAMPLE
.\scripts\init-custom-cards-git.ps1
#>

param(
    [string]$CustomCardsDir = "custom_cards"
)

$ErrorActionPreference = "Stop"

$cards = @(
    @{ Name = "thermo-halo-card"; Filename = "thermo-halo-card.js" },
    @{ Name = "naive-flex-card"; Filename = "naive-flex-card.js" },
    @{ Name = "area-card"; Filename = "alpha-area-card.js" },
    @{ Name = "activity-select-card"; Filename = "activity-select-card.js" },
    @{ Name = "iOS-PopUp-card"; Filename = "ios-popup-card.js" }
)

Write-Host "`n========================================`n"
Write-Host "Initialisation Git des cartes individuelles`n"
Write-Host "========================================`n"

foreach ($card in $cards) {
    $cardPath = Join-Path $CustomCardsDir $card.Name
    
    if (-not (Test-Path $cardPath)) {
        Write-Warning "Dossier non trouvé: $cardPath"
        continue
    }
    
    Write-Host "`n================================"
    Write-Host "Carte: $($card.Name)"
    Write-Host "================================`n"
    
    try {
        # Check if already has .git
        if (Test-Path (Join-Path $cardPath ".git")) {
            Write-Host "[!] Git repo déjà existant, skipping..."
            continue
        }
        
        # Create .gitignore if missing
        $gitignorePath = Join-Path $cardPath ".gitignore"
        if (-not (Test-Path $gitignorePath)) {
            $gitignoreContent = @"
node_modules/
*.log
.npm/
dist/
.DS_Store
"@
            Set-Content -Path $gitignorePath -Value $gitignoreContent
            Write-Host "[✓] .gitignore créé"
        }
        
        # Check hacs.json exists
        $hacsPath = Join-Path $cardPath "hacs.json"
        if (-not (Test-Path $hacsPath)) {
            Write-Warning "hacs.json manquant dans $cardPath"
            continue
        }
        Write-Host "[✓] hacs.json vérifié"
        
        # Init git
        & git -C $cardPath init -b main 2>&1 | Select-String -Pattern "(Initialized|Reinitialized|main)"
        Write-Host "[✓] Git init"
        
        # Add all
        & git -C $cardPath add .
        Write-Host "[✓] Files staged"
        
        # Commit
        $commitMsg = "Initial commit: $($card.Name) v0.1.0"
        & git -C $cardPath commit -m $commitMsg 2>&1 | Select-String -Pattern "create mode"
        Write-Host "[✓] Committed"
        
        # Create tag
        & git -C $cardPath tag v0.1.0
        Write-Host "[✓] Tag v0.1.0 created"
        
        # Show status
        Write-Host "`nStatut Git:"
        & git -C $cardPath log --oneline -1
        & git -C $cardPath tag -l
        
    } catch {
        Write-Error "Erreur pour $($card.Name) : $_"
    }
}

Write-Host "`n========================================`n"
Write-Host "✅ Git initialisé pour toutes les cartes`n"
Write-Host "Prochaines étapes:`n"
Write-Host "1. Créer les repos GitHub (Micpi/<card-name>)`n"
Write-Host "2. Lancer le script de push:`n"
Write-Host "   .\scripts\push-custom-cards-github.ps1`n"
Write-Host "`n========================================`n"
