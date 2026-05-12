<#
.SYNOPSIS
Pousse les cartes de custom_cards/ vers GitHub

.DESCRIPTION
Pour chaque repo dans custom_cards/<card-name>:
1. Ajoute le remote GitHub
2. Pousse main + tags

.EXAMPLE
.\scripts\push-custom-cards-github.ps1 -GitHubToken "ghp_xxxx..."

.EXAMPLE (interactif)
.\scripts\push-custom-cards-github.ps1
#>

param(
    [string]$CustomCardsDir = "custom_cards",
    [string]$GitHubUsername = "Micpi",
    [string]$GitHubToken = $null
)

$ErrorActionPreference = "Stop"

function Get-PlainTextFromSecureString {
    param([System.Security.SecureString]$SecureValue)

    $ptr = [System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($SecureValue)
    try {
        return [System.Runtime.InteropServices.Marshal]::PtrToStringUni($ptr)
    } finally {
        [System.Runtime.InteropServices.Marshal]::ZeroFreeCoTaskMemUnicode($ptr)
    }
}

function New-GitHubRepositoryIfMissing {
    param(
        [string]$Owner,
        [string]$Name,
        [string]$Token
    )

    $headers = @{
        Authorization = "Bearer $Token"
        Accept = "application/vnd.github+json"
        "X-GitHub-Api-Version" = "2022-11-28"
    }

    $repoUri = "https://api.github.com/repos/$Owner/$Name"
    try {
        Invoke-RestMethod -Uri $repoUri -Headers $headers -Method Get | Out-Null
        Write-Host "[✓] Repo GitHub existant: $Owner/$Name"
        return
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -ne 404) {
            throw
        }
    }

    $body = @{
        name = $Name
        private = $false
    } | ConvertTo-Json

    Invoke-RestMethod -Uri "https://api.github.com/user/repos" -Headers $headers -Method Post -Body $body | Out-Null
    Write-Host "[✓] Repo GitHub créé: $Owner/$Name"
}

# Demander le token s'il n'est pas fourni
if (-not $GitHubToken) {
    Write-Host "`n🔐 GitHub Token requis pour l'authentification`n"
    $secureToken = Read-Host "Entrez votre GitHub personal access token (classic)" -AsSecureString
    $GitHubToken = Get-PlainTextFromSecureString -SecureValue $secureToken
}

if (-not $GitHubToken) {
    Write-Error "Token GitHub manquant. Impossible de continuer."
    exit 1
}

$cardDirs = @{
    "thermo-halo-card" = "thermo-halo-card"
    "naive-flex-card" = "naive-flex-card"
    "area-card" = "alpha-area-card"
    "activity-select-card" = "activity-select-card"
    "iOS-PopUp-card" = "ios-popup-card"
}

$failedCards = @()
$successCards = @()

Write-Host "`n========================================`n"
Write-Host "Push des cartes vers GitHub`n"
Write-Host "========================================`n"

foreach ($cardName in $cardDirs.Keys) {
    $cardPath = Join-Path $CustomCardsDir $cardName
    $repoName = $cardDirs[$cardName]
    $repoUrl = "https://github.com/${GitHubUsername}/${repoName}.git"
    $authBytes = [System.Text.Encoding]::ASCII.GetBytes("${GitHubUsername}:${GitHubToken}")
    $authHeader = "AUTHORIZATION: basic " + [Convert]::ToBase64String($authBytes)
    
    if (-not (Test-Path $cardPath)) {
        Write-Warning "Dossier non trouvé: $cardPath"
        $failedCards += $cardName
        continue
    }
    
    # Check if .git exists
    if (-not (Test-Path (Join-Path $cardPath ".git"))) {
        Write-Warning "Git repo non initialisé: $cardPath"
        $failedCards += $cardName
        continue
    }
    
    Write-Host "`n================================"
    Write-Host "Push: $repoName"
    Write-Host "================================`n"
    
    try {
        New-GitHubRepositoryIfMissing -Owner $GitHubUsername -Name $repoName -Token $GitHubToken

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
        & git -C $cardPath -c "http.https://github.com/.extraheader=$authHeader" push -u origin main 2>&1 | Select-String -Pattern "(master|main|Branch|done|remote|new branch)"
        Write-Host "[✓] Main poussé"
        
        # Push tag
        Write-Host "[↑] Push tag v0.1.0..."
        & git -C $cardPath -c "http.https://github.com/.extraheader=$authHeader" push origin v0.1.0 2>&1 | Select-String -Pattern "(new tag|tag|done)"
        Write-Host "[✓] Tag poussé"
        
        $successCards += $repoName
        
    } catch {
        Write-Error "Erreur pour $repoName : $_"
        $failedCards += $repoName
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
Write-Host "Pour ajouter les cartes dans HACS:`n"
Write-Host "1. HACS → Custom repositories`n"
Write-Host "2. Pour chaque carte, ajoutez:`n"
Write-Host "   https://github.com/Micpi/<card-name>`n"
Write-Host "3. Choisissez Type: Lovelace`n"
Write-Host "`n========================================`n"
