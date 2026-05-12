<#
.SYNOPSIS
Initialise Git + crée tags pour chaque repo de carte

.DESCRIPTION
Pour chaque dossier de carte dans card-repos/:
- git init -b main
- git add .
- git commit -m "Initial commit"
- git tag v0.1.0

.EXAMPLE
.\scripts\init-card-repos-git.ps1
#>

param(
    [string]$ReposDir = "card-repos"
)

$ErrorActionPreference = "Stop"

$cards = @(
    "thermo-halo-card",
    "naive-flex-card",
    "alpha-area-card",
    "activity-select-card",
    "ios-popup-card"
)

foreach ($card in $cards) {
    $cardPath = Join-Path $ReposDir $card
    
    if (-not (Test-Path $cardPath)) {
        Write-Warning "Dossier non trouvé: $cardPath"
        continue
    }
    
    Write-Host "`n================================"
    Write-Host "Initialisation: $card"
    Write-Host "================================`n"
    
    try {
        # Init git
        & git -C $cardPath init -b main 2>&1 | Select-String -Pattern "(Initialized|Reinitialized|main)"
        Write-Host "[✓] Git init"
        
        # Add all
        & git -C $cardPath add .
        Write-Host "[✓] Files staged"
        
        # Commit
        & git -C $cardPath commit -m "Initial commit: $card v0.1.0" 2>&1 | Select-String -Pattern "create mode"
        Write-Host "[✓] Committed"
        
        # Create tag
        & git -C $cardPath tag v0.1.0
        Write-Host "[✓] Tag v0.1.0 created"
        
        # Show status
        Write-Host "`nStatut Git:"
        & git -C $cardPath log --oneline -1
        & git -C $cardPath tag -l
        
    } catch {
        Write-Error "Erreur pour $card : $_"
    }
}

Write-Host "`n========================================`n"
Write-Host "✅ Repos Git initialisés`n"
Write-Host "Prochaines étapes:`n"
Write-Host "1. Pour chaque dossier, créer un repo GitHub:`n"
Write-Host "   - Allez sur https://github.com/new`n"
Write-Host "   - Repository name: <card-name>`n"
Write-Host "   - Owner: Micpi`n"
Write-Host "   - Public + Initialize empty`n"
Write-Host "`n2. Pour chaque dossier, ajouter remote et pusher:`n"
Write-Host "   cd $ReposDir/<card-name>`n"
Write-Host "   git remote add origin https://github.com/Micpi/<card-name>.git`n"
Write-Host "   git push -u origin main`n"
Write-Host "   git push origin v0.1.0`n"
Write-Host "`n========================================`n"
