<#
.SYNOPSIS
Crée 5 dépôts locaux séparés (un par carte) prêts à être pushés sur GitHub

.DESCRIPTION
Génère la structure de base pour chaque carte:
- hacs.json conforme
- README.md avec instructions
- .gitignore
- Initialise Git + tag v0.1.0

.EXAMPLE
.\scripts\create-card-repos.ps1
Crée card-repos/ avec 5 sous-dossiers
#>

param(
    [string]$OutputDir = "card-repos"
)

$ErrorActionPreference = "Stop"

$cards = @(
    @{
        Name = "thermo-halo-card"
        DisplayName = "Thermo Halo Card"
        Description = "Thermostat circular card for Home Assistant"
        Filename = "thermo-halo-card.js"
    },
    @{
        Name = "naive-flex-card"
        DisplayName = "Naive Flex Card"
        Description = "Advanced flexible card for Home Assistant"
        Filename = "naive-flex-card.js"
    },
    @{
        Name = "alpha-area-card"
        DisplayName = "Alpha Area Card"
        Description = "Interactive area card for Home Assistant"
        Filename = "alpha-area-card.js"
    },
    @{
        Name = "activity-select-card"
        DisplayName = "Activity Select Card"
        Description = "Activity selector card for Home Assistant"
        Filename = "activity-select-card.js"
    },
    @{
        Name = "ios-popup-card"
        DisplayName = "iOS Popup Card"
        Description = "iOS-compatible popup card for Home Assistant"
        Filename = "ios-popup-card.js"
    }
)

# Create main output directory
if (-not (Test-Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
    Write-Host "[✓] Created $OutputDir directory"
}

foreach ($card in $cards) {
    $cardPath = Join-Path $OutputDir $card.Name
    $srcPath = Join-Path "custom_cards" $card.Name
    
    # Create card repo directory
    if (-not (Test-Path $cardPath)) {
        New-Item -ItemType Directory -Path $cardPath -Force | Out-Null
    }
    
    # Copy card file
    $srcFile = Join-Path $srcPath $card.Filename
    $destFile = Join-Path $cardPath $card.Filename
    if (Test-Path $srcFile) {
        Copy-Item -Path $srcFile -Destination $destFile -Force
        Write-Host "[✓] Copied $($card.Filename)"
    } else {
        Write-Warning "Source file not found: $srcFile"
    }
    
    # Create hacs.json
    $hacsJson = @{
        name = $card.DisplayName
        content_in_root = $false
        filename = $card.Filename
        render_readme = $true
        homeassistant = "2024.1.0"
    } | ConvertTo-Json
    
    Set-Content -Path (Join-Path $cardPath "hacs.json") -Value $hacsJson
    Write-Host "[✓] Created hacs.json for $($card.Name)"
    
    # Create README.md
    $readmeContent = @"
# $($card.DisplayName)

$($card.Description)

## Installation

Add this repository to HACS as a custom Lovelace repository.

**Repository URL:** https://github.com/Micpi/$($card.Name)

**Type:** Lovelace

## Configuration

Add to your Lovelace UI:

\`\`\`yaml
resources:
  - url: /hacsfiles/$($card.Name)/$($card.Filename)
    type: module
\`\`\`

## License

MIT
"@
    
    Set-Content -Path (Join-Path $cardPath "README.md") -Value $readmeContent
    Write-Host "[✓] Created README.md for $($card.Name)"
    
    # Create .gitignore
    $gitignoreContent = @"
node_modules/
*.log
.npm/
dist/
.DS_Store
"@
    
    Set-Content -Path (Join-Path $cardPath ".gitignore") -Value $gitignoreContent
    Write-Host "[✓] Created .gitignore for $($card.Name)"
    
    # Copy additional files if they exist (package.json, README from source)
    $srcReadme = Join-Path $srcPath "README.md"
    if (Test-Path $srcReadme) {
        Copy-Item -Path $srcReadme -Destination (Join-Path $cardPath "README_SOURCE.md") -Force
    }
    
    $srcPackageJson = Join-Path $srcPath "package.json"
    if (Test-Path $srcPackageJson) {
        Copy-Item -Path $srcPackageJson -Destination (Join-Path $cardPath "package.json") -Force
        Write-Host "[✓] Copied package.json for $($card.Name)"
    }
    
    Write-Host ""
}

Write-Host "`n========================================`n"
Write-Host "✅ Repos créés dans: $OutputDir`n"
Write-Host "Prochaines étapes:`n"
Write-Host "1. Créer les repos GitHub (Micpi/$cardName pour chaque carte)`n"
Write-Host "2. Pour chaque dossier de carte:`n"
Write-Host "   cd $OutputDir/<card-name>`n"
Write-Host "   git init -b main`n"
Write-Host "   git add .`n"
Write-Host "   git commit -m 'Initial commit'`n"
Write-Host "   git remote add origin https://github.com/Micpi/<card-name>.git`n"
Write-Host "   git push -u origin main`n"
Write-Host "   git tag v0.1.0`n"
Write-Host "   git push origin v0.1.0`n"
Write-Host "`n========================================`n"
