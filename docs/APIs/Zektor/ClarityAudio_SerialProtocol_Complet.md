# ClarityAudio & ProAudio — Guide Complet des Protocoles Série et TCP/IP

> Sources : *ClarityAudio 16x16 User Guide v1.01 (11/08/2012)* et *Serial Protocol v1.1 (17/06/2021)*

---

## Table des matières

1. [Matériel RS-232 / TCP/IP](#1-matériel-rs-232--tcpip)
2. [Syntaxe des commandes](#2-syntaxe-des-commandes)
3. [Numérotation des entrées / sorties (ProAudio)](#3-numérotation-des-entrées--sorties-proaudio)
4. [Contrôle de base — Alimentation, Routage, Mute](#4-contrôle-de-base--alimentation-routage-mute)
5. [Contrôle audio](#5-contrôle-audio)
6. [Contrôle avancé](#6-contrôle-avancé)
7. [Contrôle TCP/IP](#7-contrôle-tcpip)
8. [Déclencheurs 12V (ProAudio)](#8-déclencheurs-12v-proaudio)
9. [Paging et Sonnette (ProAudio)](#9-paging-et-sonnette-proaudio)

---

## 1. Matériel RS-232 / TCP/IP

### 1.1 Vue d'ensemble TCP/IP

Le port Série et le port TCP/IP partagent le **même protocole**.

La connexion TCP/IP est un socket brut (Raw TCP/IP), similaire à Telnet mais sans son surcoût protocolaire. La plupart des clients Telnet peuvent se connecter sans erreur. L'outil recommandé pour les tests est **PuTTY** (mode « Raw ») : <http://www.chiark.greenend.org.uk/~sgtatham/putty>

- Par défaut, l'appareil utilise **DHCP** pour obtenir une adresse IP.
- Le port TCP/IP est fixé à **50005**.
- Une connexion reste ouverte jusqu'à ce que le client la ferme, ou après **10 minutes** sans activité.
- Toutes les réponses sont envoyées simultanément sur le port Série **et** sur le socket TCP/IP.
- Les commandes reçues sur les deux ports sont exécutées dans l'ordre de réception.

### 1.2 Paramètres TCP/IP par défaut

| Paramètre | Valeur |
|-----------|--------|
| Mode IP | DHCP |
| Port | 50005 |
| Duplex | Half/Full (auto-detect) — ou Full sur ProAudio |
| Vitesse | 10/100 Mbps (auto-detect) |

### 1.3 Définir une adresse IP statique vs DHCP

La définition d'une adresse statique se fait en **deux étapes** :

1. Définir l'adresse, le masque et la passerelle avec `IPA`, `IPM`, `IPG`.
2. Activer le mode statique avec `IPSET 0`.

**Exemple complet :**

```
^IPA 192,168,1,200$   ← Définit l'adresse IP statique
^IPM 255,255,255,0$   ← Définit le masque
^IPG 192,168,1,1$     ← Définit la passerelle
^IPSET 0$             ← Active le mode statique
^SS 32$               ← Sauvegarde en EEPROM
```

> **Note ProAudio :** Un utilitaire graphique `zSetIP.exe` (téléchargeable sur le site du fabricant) simplifie la procédure via le port série.

### 1.4 Connecteur RS-232 — Brochage et paramètres

Le connecteur est un **DE-9 femelle** (parfois appelé à tort DB-9).  
Câble requis : **câble droit standard** (ne pas utiliser de câble « Null Modem »).  
Compatible avec les adaptateurs USB → RS-232.

**Brochage :**

| Broche | Fonction | Broche | Fonction |
|--------|----------|--------|----------|
| 1 | Non connecté | 6 | Non connecté |
| 2 | TX | 7 | Non connecté |
| 3 | RX | 8 | Non connecté |
| 4 | Non connecté | 9 | Non connecté |
| 5 | GND | | |

**Paramètres du port :**

| Paramètre | Valeur |
|-----------|--------|
| Baudrate | 19 200 |
| Data Bits | 8 |
| Stop Bits | 1 |
| Parité | NONE |

**Timings :**

| Paramètre | Valeur |
|-----------|--------|
| Délai min. entre caractères | 0 ms |
| Délai min. entre lignes | 0 ms |
| Délai min. entre commandes | 0 ms |
| Délai max. de réponse | 100 ms (sauf indication contraire) |

---

## 2. Syntaxe des commandes

### 2.1 Format général

```
^CMD param1,param2,...$
```

- `^` — Début de toute commande ou réponse.
- `CMD` — Nom de la commande (sensible à la **casse** — toujours en **MAJUSCULES**).
- `param` — Paramètres séparés par des virgules.
- `$` — Fin de toute commande ou réponse.

Tout caractère envoyé avant `^` ou après `$` est **ignoré**.  
Par défaut, chaque réponse est suivie d'un **retour chariot + saut de ligne** (désactivable via `XS`).

> **Note ProAudio :** Les espaces sont optionnels (`^P 1$` et `^P1$` sont équivalents). Les CR/LF sont acceptés et ignorés.

**Exemple — Allumer l'appareil :**

```
^P 1$    → Commande envoyée
^+$      ← Accusé de réception (pas d'erreur)
^=P 1$   ← Réponse indiquant le nouvel état
```

### 2.2 Types de réponses

Il existe **trois** types de réponses : Accusé de réception, Erreur, Réponse de requête.

#### Accusé de réception (`^+$`)

Envoyé après toute commande valide :

```
^+$
```

Désactivable via le bit `ACK` de la commande `XS`.

#### Réponse d'erreur (`^!n$`)

```
^!<numéro_erreur>$
```

| Code | Description |
|------|-------------|
| 1 | Commande non reconnue (la casse est importante). |
| 2 | Paramètre hors plage — la commande est ignorée. |
| 3 | Erreur de syntaxe (données supplémentaires, paramètre non décimal…). |
| 4 | Réservé (ProAudio). |
| 5 | Nombre de paramètres incorrect. |
| 6 | Appareil occupé (mode Setup actif) — ClarityAudio uniquement. |
| 7 | Débordement de tampon interne. |
| 8 | L'appareil doit être sous tension pour exécuter cette commande. |
| 100 | DSP programmé avec succès (ClarityAudio — informatif, pas une erreur). |
| 101–108 | Erreur d'initialisation du sous-système audio (ClarityAudio). |
| 1xx | Erreur d'initialisation audio (ProAudio). |

> **Erreur 6 (ClarityAudio) :** Lorsque l'appareil est en mode Setup via le panneau frontal, de nombreux paramètres deviennent en lecture seule. Envoyer la commande d'émulation de touche avec le code `0` permet de quitter ce mode.

#### Réponse de requête (`^=...`)

Envoyée pour indiquer qu'un paramètre a changé, ou en réponse à une requête (`?`).  
Format : caractère `=` suivi de la chaîne de commande concernée.

```
^P ?$     → Requête de l'état du power
^+$       ← Accusé de réception
^=P 1$    ← Réponse : l'appareil est allumé
```

Les réponses utilisent des **zéros de tête** pour une largeur fixe, facilitant le parsing :

```
^=SZ @001,003$
```

### 2.3 Paramètres bitmappés

Certaines commandes utilisent des **paramètres bitmappés** : valeurs décimales représentant des flags binaires.

**Principe :**  
Additionner les valeurs des bits souhaités pour former le paramètre décimal.

**Exemple avec `XS` :**

| Valeur | 8192 | 16 | 8 | 4 | 2 | 1 |
|--------|------|----|---|---|---|---|
| Bit | 13 | 4 | 3 | 2 | 1 | 0 |
| Nom | AUT | CRE | CHM | ECO | ACK | ASY |
| Défaut | 1 | 1 | 0 | 1 | 1 | 1 |

- **Écriture complète :** `^XS 8193$` — définit tous les bits d'un coup.
- **Mettre un bit à 1 :** `^XS +2$` — active `ECO` sans toucher aux autres.
- **Mettre un bit à 0 :** `^XS -8192$` — désactive `AUT` sans toucher aux autres.

---

## 3. Numérotation des entrées / sorties (ProAudio)

### 3.1 Mode natif par défaut

La numérotation des sources dépend du modèle. Les anciens drivers utilisent ce mode.

#### ProAudio16 — Sources analogiques

| Plage | Description |
|-------|-------------|
| 0 | Déconnecte la zone |
| 1–16 | Audio analogique (RCA L/R) |
| 17–32 | PCM-stéréo depuis entrées Coax (mute si Dolby5.1/DTS) |
| 33–48 | PCM-stéréo depuis entrées Optiques (mute si Dolby5.1/DTS) |

#### ProAudio16 — Sources numériques

| Plage | Description |
|-------|-------------|
| 0 | Déconnecte la zone |
| 1–16 | Réservé (mute) |
| 17–32 | Audio numérique depuis entrées Coax |
| 33–48 | Audio numérique depuis entrées Optiques |
| 49–64 | PCM-stéréo miroir des sorties analogiques |

#### ProAudio1632 — Sources analogiques

| Plage | Description |
|-------|-------------|
| 0 | Déconnecte la zone |
| 1–16 | Audio analogique (RCA L/R) |
| 17–32 | PCM-stéréo depuis entrées Coax |
| 33–40 | PCM-stéréo depuis entrées Optiques |

#### ProAudio1632 — Sources numériques

| Plage | Description |
|-------|-------------|
| 0 | Déconnecte la zone |
| 1–16 | Réservé (mute) |
| 17–32 | Audio numérique depuis entrées Coax |
| 33–40 | Audio numérique depuis entrées Optiques |
| 41–56 | PCM-stéréo miroir des sorties analogiques |

#### ProAudio32 / ProAudio48 / ProAudio64 — Sources analogiques

| Plage | Description |
|-------|-------------|
| 0 | Déconnecte la zone |
| 1–32 | Audio analogique (RCA L/R) |
| 33–64 | PCM-stéréo depuis entrées Coax |
| 65–80 | PCM-stéréo depuis entrées Optiques |

#### ProAudio32 / ProAudio48 / ProAudio64 — Sources numériques

| Plage | Description |
|-------|-------------|
| 0 | Déconnecte la zone |
| 1–32 | Réservé (mute) |
| 33–64 | Audio numérique depuis entrées Coax |
| 65–80 | Audio numérique depuis entrées Optiques |
| 81–96 | PCM-stéréo miroir des 16 sorties analogiques du même bloc |

### 3.2 Mode Extended I/O (recommandé pour nouveaux drivers)

Permet d'écrire un driver **universel** compatible avec toute la gamme.  
Activation :

```
^XS +32768$   ← Active le flag XIO
^SS 8$        ← Sauvegarde en EEPROM (optionnel)
```

**Sources analogiques (Extended I/O) :**

| Plage | Description |
|-------|-------------|
| 0 | Déconnecte |
| 1–32 | Audio analogique |
| 33–64 | PCM-stéréo depuis entrées Coax |
| 65–80 | PCM-stéréo depuis entrées Optiques |

**Sources numériques (Extended I/O) :**

| Plage | Description |
|-------|-------------|
| 0 | Déconnecte |
| 1–32 | Réservé (mute) |
| 33–64 | PCM-stéréo / Dolby5.1 / DTS depuis Coax |
| 65–80 | PCM-stéréo / Dolby5.1 / DTS depuis Optiques |
| 129–144 | Miroir des 16 sorties analogiques du même bloc audio |

**Miroir des sorties analogiques (129–144) :**

```
^DSZ @3,129$   ← Coax 3 miroir la sortie analogique 1
```

Toute modification de source, volume, tonalité sur la sortie analogique 1 se répercute sur la sortie Coax 3.  
Ce miroir est **local au bloc audio** (ex. : sur ProAudio48 : blocs 1–16, 17–32, 33–48).

**Exemple ProAudio16 en mode Extended I/O :**

| Plage | Description |
|-------|-------------|
| 0 | Déconnecte |
| 1–16 | Entrées analogiques 1–16 |
| 17–32 | Mute (seulement 16 entrées analogiques) |
| 33–48 | Entrées Coax (étiquetées 17–32 sur le panneau) |
| 49–64 | Mute (seulement 16 entrées Coax) |
| 65–80 | Entrées Optiques (étiquetées 33–48 sur le panneau) |

---

## 4. Contrôle de base — Alimentation, Routage, Mute

### Définitions

| Terme | Description |
|-------|-------------|
| **Zone** | Une sortie. Désignée par le préfixe `@`. Sur ClarityAudio : combinaison d'un canal analogique (L/R stéréo) et d'un canal numérique (SPDIF). |
| **Input / Source** | Une entrée. Désignée par un nombre sans préfixe `@`. |
| **Channel** (ClarityAudio) | Chemin analogique (2) ou numérique SPDIF (4). Utilisé pour les options de breakaway. |

**Canaux ClarityAudio :**

| Valeur | Canal |
|--------|-------|
| 2 | Audio analogique |
| 4 | Audio numérique |
| 6 | Les deux (2+4) |

### Tableau récapitulatif des commandes de base

| Commande | Description |
|----------|-------------|
| `P` | Contrôle de l'alimentation |
| `SZ` | Routage des zones analogiques |
| `DSZ` | Routage des zones numériques (ProAudio) |
| `MZ` | Mute hard d'une zone analogique |
| `DMZ` | Mute hard d'une zone numérique (ProAudio) |
| `PZ` | Mise hors tension d'une zone (ProAudio) |
| `DZ` | Délai de commutation analogique |
| `DDZ` | Délai de commutation numérique (ProAudio) |

---

### `P` — Contrôle de l'alimentation

```
^P 0$   Éteindre (si non verrouillé)
^P 1$   Allumer
^P 2$   Éteindre de force (ProAudio — ignore le verrou)
^P 3$   Allumer et verrouiller (ProAudio — seul P 2 peut éteindre)
^P +$   Basculer l'état
^P ?$   Lire l'état actuel
```

**Réponse :** `^=P n$` où `n` = 0 (éteint), 1 (allumé), 3 (verrouillé — ProAudio).

> **Note ClarityAudio :** La commande `P` est une exception à la règle des 100 ms. L'initialisation des processeurs audio numériques peut prendre **quelques secondes**. La réponse `^=P 1$` n'est envoyée que lorsque l'appareil est complètement prêt.

---

### `SZ` — Routage des zones (analogiques)

**ClarityAudio :**

```
^SZ @zone,@zone,in$          Mappe toutes les pistes d'une entrée vers une ou plusieurs zones
^SZ.ch @zone,in$             Mappe uniquement les pistes sélectionnées (breakaway)
^SZ.ch @zone,+$              Séquence avant dans les entrées
^SZ.ch @zone,-$              Séquence arrière dans les entrées
^SZ ?$                       Lit tous les changements enregistrés (mode sondage)
^SZ @zone,?$                 Lit les paramètres des zones données
^SZ.ch @zone,?$              Lit les paramètres des pistes sélectionnées
```

**ProAudio :**

```
^SZ @zone,source$            Mappe une source vers une zone
^SZ @zone,+$                 Séquence avant
^SZ @zone,-$                 Séquence arrière
^SZ @zone?$                  Lit la configuration actuelle
^SZ @3:12,5$                 Mappe les zones 3 à 12 vers la source 5 (plage avec ':')
```

**Réponse :** `^=SZ @zone,in$` ou `^=SZ.ch @zone,in$`

**Exemples ClarityAudio :**

```
^SZ @1,@3,2$          Mappe l'entrée 2 vers les zones 1 et 3
^SZ @1,2,@3,@5,7$     Mappe l'entrée 2 → zone 1, et entrée 7 → zones 3 et 5
^SZ.2 @1,3$           Mappe uniquement l'audio analogique de l'entrée 3 vers la zone 1
^SZ.4 @2,@3,4$        Mappe uniquement l'audio numérique de l'entrée 4 vers les zones 2 et 3
```

**Exemples ProAudio :**

```
^SZ @1,2$             Mappe la source 2 vers la zone 1
^SZ @1,@3,@5,7$       Mappe la source 7 vers les zones 1, 3 et 5
^SZ @1@3@5,7$         Idem (virgules entre zones optionnelles)
^SZ @3:12,5$          Zones 3 à 12 → source 5
```

**Exemple de réponse de requête (avec breakaway ClarityAudio) :**

```
^SZ @1,?$  →
^+$
^=SZ.004 @001,003$    ← Audio numérique de l'entrée 3 → zone 1
^=SZ.002 @001,004$    ← Audio analogique de l'entrée 4 → zone 1
```

---

### `DSZ` — Routage des zones numériques (ProAudio uniquement)

```
^DSZ @zone,source$    Mappe une source numérique vers une zone
^DSZ @zone,+$         Séquence avant dans les sources numériques
^DSZ @zone,-$         Séquence arrière
^DSZ @zone?$          Lit la configuration actuelle
^DSZ @3:12,5$         Plage de zones
```

**Réponse :** `^=DSZ @zone,source$`

> Ce command n'est effectif que si `DRZ` est réglé à `0` pour la zone concernée.

---

### `MZ` — Mute d'une zone (analogique)

**ClarityAudio :**

```
^MZ @zone,@zone,mute$       Mute toutes les pistes des zones listées
^MZ.ch @zone,mute$          Mute les pistes sélectionnées
^MZ.ch @zone,+$             Bascule le mute
^MZ ?$                      Mode sondage
^MZ @zone,?$                Lit l'état des zones
```

**ProAudio :**

```
^MZ @zone,mute$             Mute/démute les zones listées
^MZ @zone,+$                Bascule le mute
^MZ @zone?$                 Lit l'état actuel
^MZ @1,1,@3,@4,0$           Mute zone 1, démute zones 3 et 4
```

**Réponse :** `^=MZ @zone,mute$` où `mute` = 0 (non muté), 1 (muté).

> **Important :** Pour une gestion audio propre, il est recommandé d'utiliser `VMZ` (mute via contrôle de volume) plutôt que `MZ`. La commande `MZ` équivaut à déconnecter la zone, mais mémorise la source pour pouvoir la reconnecter.

---

### `PZ` — Mise hors tension d'une zone (ProAudio uniquement)

```
^PZ @zone,pwr$    0=Éteint, 1=Allumé
^PZ @zone,+$      Bascule
^PZ @zone?$       Lit l'état
```

**Réponse :** `^=PZ @zone,pwr$`

Différence avec `MZ` : `PZ` indique que la zone est mise hors tension, ce qui peut également couper une sortie 12V si le déclencheur correspondant lui est associé et qu'aucune autre zone active ne le maintient.

---

### `DMZ` — Mute des zones numériques (ProAudio uniquement)

```
^DMZ @zone,mute$    0=Non muté, 1=Muté
^DMZ @zone,+$       Bascule
^DMZ @zone?$        Lit l'état
```

**Réponse :** `^=DMZ @zone,mute$`

---

### `DZ` / `DDZ` — Délai de commutation

Ajoute un temps de **mute temporaire** lors des commutations d'entrées, pour éviter les « pops » sur certains récepteurs audio numériques.

**`DZ`** = zones analogiques / **`DDZ`** = zones numériques (ProAudio).

**ClarityAudio :**

```
^DZ @zone,@zone,delay$       Ajoute un délai sur toutes les pistes
^DZ.ch @zone,delay$          Délai sur les pistes sélectionnées
^DZ ?$                       Mode sondage
^DZ @zone,?$                 Lit les paramètres
```

**ProAudio :**

```
^DZ @zone,delay$             Ajoute un délai
^DZ @zone?$                  Lit les paramètres
```

**Réponse :** `^=DZ @zone,delay$`  
`delay` = durée en millisecondes (1000 ms = 1 seconde).

---

## 5. Contrôle audio

### Tableau récapitulatif des commandes audio

| Commande | Description | Plage / Paramètres |
|----------|-------------|-------------------|
| `LZ` | Verrouiller une zone sur une autre (ProAudio) | `@zone,zoneToFollow` |
| `MV` | Volume master | 0–248 (200 = 0 dB) |
| `VZ` | Volume par zone | 0–248 (200 = 0 dB) |
| `VPZ` | Volume par zone en % | 0–100 |
| `VMIZ` | Volume minimum par zone | 0 à maxVol–99 |
| `VMAZ` | Volume maximum par zone | minVol+99 à 248 |
| `VRT` | Temps de fade du volume | time (1/10s), speed (pas de 0,5 dB/s) |
| `VMZ` | Mute via contrôle de volume | 0=unmute, 1=mute, 2=NoMute, +=toggle |
| `VMLZ` | Niveau d'atténuation du mute | 0–248 |
| `VMT` | Temps de fade du mute | time (1/10s), speed (pas de 0,5 dB/s) |
| `BLZ` | Balance par zone | 0–400 (200 = centre) |
| `GAZ` | Gain de sortie par zone | 152–248 (200 = 0 dB) |
| `GAI` | Gain d'entrée (trim) | 152–248 (200 = 0 dB) |
| `BAZ` | Basses par zone | 88–168 (128 = 0 dB) |
| `TRZ` | Aigus par zone | 88–168 (128 = 0 dB) |
| `EQ1Z–EQ5Z` | Égaliseur 5 bandes | 88–168 (128 = 0 dB) |
| `FTYPZ` | Type de filtre passe-bas/haut (ProAudio) | 0–5 |
| `FFRQZ` | Fréquence de coupure du filtre (ProAudio) | 0–32 (0=désactivé, 1=50Hz … 32=300Hz) |
| `MXZ` | Down-mix stéréo → mono par zone | 0–6 |
| `MXI` | Down-mix stéréo → mono par entrée (ProAudio) | 0–6 |
| `DRZ` | Routage audio numérique | 0 ou 1 |
| `LSZ` | Délai lip-sync par zone | 0–8191 (échantillons 48 kHz) |
| `LSI` | Délai lip-sync par entrée | 0–8191 |
| `ATZ` | Type audio d'une zone analogique (ProAudio, lecture seule) | 0–3 |

---

### `LZ` — Verrouiller une zone sur une autre (ProAudio uniquement)

Quand des zones sont verrouillées, elles partagent la même source, le volume et les contrôles de tonalité.

```
^LZ @zone,zoneToFollow$
```

**Réponse :** `^=LZ @zone,zoneToFollow$`

> Utilisation typique : verrouiller un caisson de basses sur une autre zone, ou grouper plusieurs zones (couloir, jardin) sous un seul contrôle.  
> Si la zone « suivie » est elle-même verrouillée sur une autre, toutes les zones qui la suivent repassent en mode indépendant.

---

### `MV` — Volume master

Contrôle le volume général de l'appareil. Affecte toutes les zones.

```
^MV vol$    Définit le volume global
^MV ?$      Lit le réglage actuel (ProAudio)
```

**Réponse :** `^=MV vol$`

**Correspondance dB :**

| Valeur | dB |
|--------|----|
| 0 | Mute complet (–115 dB) |
| 1 | –99,5 dB |
| 200 | 0 dB (pas d'effet) |
| 248 | +24 dB |

---

### `VZ` — Volume par zone

```
^VZ @zone,vol$        Saute immédiatement au niveau voulu
^VZ @zone,+step$      Augmente de 'step' × 0,5 dB
^VZ @zone,-step$      Diminue de 'step' × 0,5 dB
^VZ ?$                Mode sondage (ClarityAudio)
^VZ @zone,?$          Lit le volume de la ou des zones
```

**Pour un fondu dans le temps :** ajouter 10 000 à la valeur de volume.  
**Pour un fondu à vitesse fixe :** ajouter 20 000 à la valeur de volume.

**Réponse :** `^=VZ @zone,vol$` (toujours dans la plage 0–248, sans les 10000/20000).

**Formule dB → valeur :**  
`vol = (gain_dB × 2) + 200`  
Exemple : –24 dB → `vol = (–24 × 2) + 200 = 152`

**Exemples :**

```
^VZ @1,200$              Volume max (0 dB) sur zone 1
^VZ @1,152$              –24 dB sur zone 1
^VZ @1,+6$               +3 dB sur zone 1
^VZ @3,-9$               –4,5 dB sur zone 3
^VZ @1,@2,1020$          Fondu vers le niveau 20 en temps défini (zones 1 et 2)
^VZ @1,@2,20010$         Fondu vers le niveau 10 à vitesse fixe (zones 1 et 2)
^VZ @1,10000,@2,+20040,@3,35$   Fondu zone 1 → mute ; zone 2 +20 dB à vitesse fixe ; zone 3 saut direct
```

> **Note MJP/UVL (ProAudio) :** Le comportement de `VZ` lors d'un mute actif dépend des flags `MJP` et `UVL` de la commande `XS`.

---

### `VPZ` — Volume par zone en pourcentage

```
^VPZ @zone,vol$       0–100 (0=mute, 1=VMIZ, 100=VMAZ)
^VPZ @zone,+step$     Incrément
^VPZ @zone,-step$     Décrément
^VPZ @zone,?$         Lit le réglage
```

Pour les fondus : ajouter 10 000 (timed) ou 20 000 (speed) — ClarityAudio.

---

### `VMIZ` — Volume minimum par zone

```
^VMIZ @zone,minVol$
^VMIZ @zone,+step$
^VMIZ @zone,-step$
^VMIZ @zone,?$
```

**Réponse :** `^=VMIZ @zone,minvol$`

- Plage : 0 à `maxVol – 99`.
- L'écart min/max doit être d'au moins **99 pas (49,5 dB)**.
- En dessous du minimum → mute complet. Remontée depuis le mute → saute directement au minimum.

---

### `VMAZ` — Volume maximum par zone

```
^VMAZ @zone,maxVol$
^VMAZ @zone,+step$
^VMAZ @zone,-step$
^VMAZ @zone,?$
```

**Réponse :** `^=VMAZ @zone,minvol$` (libellé hérité)

Plage : `minVol + 99` à 248. Écart min/max ≥ 99 pas.

---

### `VRT` — Temps de fade du volume (ClarityAudio)

```
^VRT time,speed$    Définit le temps et la vitesse de fondu
^VRT ?$             Lit le réglage actuel
```

**Réponse :** `^=VRT time,speed$`

- `time` : en 1/10 de seconde (10 = 1 seconde). Utilisé quand on ajoute 10 000 à une valeur de volume.
- `speed` : en pas de 0,5 dB/s (40 = 20 dB/s). Utilisé quand on ajoute 20 000.

---

### `VMZ` — Mute via contrôle de volume

Mute audio « propre » utilisant le processeur audio. À préférer à `MZ` pour les zones audio.

```
^VMZ @zone,mute$    0=Démute, 1=Mute, 2=NoMute, +=Toggle
^VMZ @zone,?$       Lit l'état
```

**Réponse :** `^=VMZ @zone,mute$` (la valeur 2 n'est jamais retournée — retourne 0 si NoMute).

Options :
- `0` — Démute, restaure le volume d'origine.
- `1` — Mute à l'atténuation définie par `VMLZ`.
- `2` — Désactive le mute mais conserve le niveau actuel (muté) comme nouveau volume.
- `+` — Bascule (ProAudio).

---

### `VMLZ` — Niveau d'atténuation du mute (ClarityAudio)

Définit l'atténuation appliquée lors d'un mute (`VMZ 1`).  
Valeur = nombre de pas de 0,5 dB à soustraire. Valeur 248 → mute total.

```
^VMLZ @zone,attn$       Saute immédiatement
^VMLZ @zone,+step$
^VMLZ @zone,-step$
^VMLZ @zone,?$
```

Ajouter 10 000 pour fondu dans le temps, 20 000 pour fondu à vitesse fixe.

---

### `VMT` — Temps de fade du mute (ClarityAudio)

```
^VMT time,speed$    Définit le temps et la vitesse du fondu lors du mute
^VMT ?$             Lit le réglage
```

Même logique que `VRT` : `time` en 1/10s, `speed` en pas de 0,5 dB/s.

---

### `BLZ` — Balance par zone

```
^BLZ @zone,bal$       0=Plein gauche, 200=Centre, 400=Plein droit
^BLZ @zone,+step$
^BLZ @zone,-step$
^BLZ @zone,?$
```

**Réponse :** `^=BLZ @zone,bal$`

> La balance n'ajoute pas de gain : déplacer vers la gauche atténue le canal droit sans amplifier le gauche.

**Exemples :**

```
^BLZ @1,206$    Décale vers la droite (–3 dB sur canal gauche)
^BLZ @1,194$    Décale vers la gauche (–3 dB sur canal droit)
```

---

### `GAZ` — Gain de sortie par zone

Ajuste le niveau de sortie de –24 dB à +24 dB pour correspondre à la sensibilité des amplificateurs.

```
^GAZ @zone,gain$      152=–24 dB, 200=0 dB, 248=+24 dB
^GAZ @zone,+step$
^GAZ @zone,-step$
^GAZ @zone,?$
```

**Réponse :** `^=GAZ @zone,gain$`

---

### `GAI` — Gain d'entrée / Input Trimming

Ajuste le niveau de chaque entrée de –24 dB à +24 dB pour normaliser les niveaux entre sources.

**ClarityAudio :**

```
^GAI @input,gain$     152=–24 dB, 200=0 dB, 248=+24 dB
^GAI @input,+step$
^GAI @input,-step$
^GAI @input,?$
```

**ProAudio :**

```
^GAI @source,gain$
^GAI @source,+step$
^GAI @source,-step$
^GAI @source?$
```

**Réponse :** `^=GAZ @input/source,gain$`

---

### `BAZ` / `TRZ` — Basses et Aigus par zone

Plage : –20 dB à +20 dB, pas de 0,5 dB.  
L'interaction avec l'égaliseur 5 bandes est plafonnée à ±20 dB.

```
^BAZ @zone,level$     128=0 dB, 88=–20 dB, 168=+20 dB
^BAZ @zone,+step$
^BAZ @zone,-step$
^BAZ @zone,?$

^TRZ @zone,level$     (même syntaxe)
```

**Réponses :** `^=BAZ @zone,level$` / `^=TRZ @zone,level$`

**Formule :** `level = (gain_dB × 2) + 128`  
Exemple : +9 dB → `level = (9 × 2) + 128 = 146`

```
^BAZ @1,128$    Basses à plat (0 dB)
^BAZ @1,146$    +9 dB de basses
^BAZ @1,+6$     +3 dB de basses
^BAZ @3,-9$     –4,5 dB de basses
```

---

### `EQ1Z` à `EQ5Z` — Égaliseur 5 bandes par zone

Plage : –20 dB à +20 dB, pas de 0,5 dB. Même syntaxe et formule que `BAZ`.

| Commande | Fréquence centre |
|----------|-----------------|
| `EQ1Z` | 100 Hz (filtre pente basses fréquences) |
| `EQ2Z` | 330 Hz |
| `EQ3Z` | 1 000 Hz |
| `EQ4Z` | 3 300 Hz |
| `EQ5Z` | 10 000 Hz (filtre pente hautes fréquences) |

```
^EQ1Z @zone,level$
^EQ1Z @zone,+step$
^EQ1Z @zone,-step$
^EQ1Z @zone,?$
```

**Réponse :** `^=EQ1Z @zone,level$`

---

### `FTYPZ` — Type de filtre passe-bas / passe-haut (ProAudio uniquement)

Utilisé typiquement pour les caissons de basses.  
Nécessite également la commande `FFRQZ` pour être activé (les deux doivent être ≠ 0).

```
^FTYPZ @zone,type$
```

| Valeur | Type |
|--------|------|
| 0 | Pas de filtre (bypass) |
| 1 | Réservé (idem 0) |
| 2 | Filtre passe-bas 12 dB/octave |
| 3 | Filtre passe-haut 12 dB/octave |
| 4 | Filtre passe-bas 24 dB/octave |
| 5 | Filtre passe-haut 24 dB/octave |

---

### `FFRQZ` — Fréquence de coupure du filtre (ProAudio uniquement)

```
^FFRQZ @zone,freq$
```

| Valeur | Fréquence | Valeur | Fréquence |
|--------|-----------|--------|-----------|
| 0 | Bypass | 17 | 126 Hz |
| 1 | 50 Hz | 18 | 133 Hz |
| 2 | 53 Hz | 19 | 141 Hz |
| 3 | 56 Hz | 20 | 150 Hz |
| 4 | 59 Hz | 21 | 159 Hz |
| 5 | 63 Hz | 22 | 168 Hz |
| 6 | 67 Hz | 23 | 178 Hz |
| 7 | 71 Hz | 24 | 189 Hz |
| 8 | 75 Hz | 25 | 200 Hz |
| 9 | 79 Hz | 26 | 212 Hz |
| 10 | 84 Hz | 27 | 224 Hz |
| 11 | 89 Hz | 28 | 238 Hz |
| 12 | 94 Hz | 29 | 252 Hz |
| 13 | 100 Hz | 30 | 267 Hz |
| 14 | 106 Hz | 31 | 283 Hz |
| 15 | 112 Hz | 32 | 300 Hz |
| 16 | 119 Hz | | |

---

### `MXZ` — Down-mix stéréo → mono par zone

```
^MXZ @zone,mix$
```

| Valeur | Description |
|--------|-------------|
| 0 | Pas de changement |
| 1 | Inversion L/R |
| 2 | Mono par addition L+R |
| 3 | Mono L (canal gauche sur les deux sorties) |
| 4 | Mono R (canal droit sur les deux sorties) |
| 5 | Mono : L – R |
| 6 | Mono : R – L |

---

### `MXI` — Down-mix stéréo → mono par entrée (ProAudio uniquement)

```
^MXI @source,mix$
```

Mêmes valeurs que `MXZ`.

---

### `DRZ` — Routage audio numérique

**ClarityAudio :**

Gère le comportement lors de la détection d'audio non-PCM (Dolby5.1, DTS…).

```
^DRZ @zone,routing$
```

| Valeur | Description |
|--------|-------------|
| 0 | L'audio non-PCM est routé tel quel vers la sortie numérique |
| 1 | L'audio analogique est converti en numérique et envoyé vers la sortie coax |

En mode « Classique » (`AUT = 0`), sert également à choisir entre source analogique et numérique pour chaque sortie Coax.

**ProAudio :**

Détermine si la sortie Coax est une zone numérique indépendante ou un miroir de la zone analogique associée.

```
^DRZ @zone,routing$
```

| Valeur | Description |
|--------|-------------|
| 0 | Sortie Coax = zone numérique indépendante (utilise `DSZ`) |
| 1 | Sortie Coax = miroir PCM-stéréo de la sortie analogique associée |

**Exemple ProAudio :**

```
^DRZ @1,0$     ← Coax 1 = zone numérique indépendante
^DSZ @1,17$    ← Route la source 17 vers Coax 1

^DRZ @1,1$     ← Coax 1 mirore la sortie analogique 1
```

---

### `LSZ` — Délai lip-sync par zone

```
^LSZ @zone,delay$
^LSZ @zone,+step$
^LSZ @zone,-step$
```

**Réponse :** `^=LSZ @zone,delay$`

- `delay` = nombre d'échantillons à 48 kHz (48 comptes = 1 ms).
- Plage : 0 à 8191 (170,65 ms max).
- Si la somme délai de zone + délai d'entrée dépasse 8191, la valeur est plafonnée à 8191 sans erreur.

**Formules :**

```
delay = ms × 48
delay = (48000 / fps) × nombre_de_frames
```

**Exemples :**

```
^LSZ @3,1152$    Retard de 24 ms sur zone 3 (24 × 48)
^LSZ @3,1600$    Retard de 2 frames à 60 fps ((48000/60) × 2)
^LSZ @2,+800$    Ajoute 1 frame à 60 fps sur zone 2
```

**Quand utiliser `LSZ` vs `LSI` :**

- L'entrée d'un processeur vidéo (ou moniteur) qui introduit un délai est connectée à une **zone** → utiliser `LSZ` (seul l'audio de cette zone est retardé).
- La sortie d'un processeur vidéo est connectée à une **entrée** → utiliser `LSI` (toutes les zones liées à cette entrée bénéficient de la compensation).

---

### `LSI` — Délai lip-sync par entrée

```
^LSI @in,delay$          (ClarityAudio)
^LSI @source,delay$      (ProAudio)
^LSI @in,+step$
^LSI @in,-step$
```

**Réponse :** `^=LSI @in,delay$`

Mêmes règles et plages que `LSZ`. Se reporter aux exemples de `LSZ`.

---

### `ATZ` — Type audio d'une zone analogique (ProAudio, lecture seule)

```
^ATZ @zone?$
```

**Réponse :** `^=ATZ @zone,audio_type$`

| Valeur | Description |
|--------|-------------|
| 0 | Entrée analogique, ou en transition (mode inconnu) |
| 1 | Pas de SPDIF détecté sur l'entrée numérique |
| 2 | PCM-stéréo détecté sur l'entrée numérique |
| 3 | SPDIF encodé (Dolby, DTS…) détecté — la sortie est mutée automatiquement |

---

## 6. Contrôle avancé

### Tableau récapitulatif

| Commande | Description |
|----------|-------------|
| `V` | Version du firmware |
| `QI` | Requête des capacités (ClarityAudio) |
| `XS` | Paramètres de contrôle (bitmappés) |
| `SS` | Sauvegarde des réglages en EEPROM |
| `FS` | Réinitialisation aux valeurs d'usine |
| `LI` | Mode et intensité de l'éclairage (ProAudio) |

---

### `V` — Version du firmware

```
^V ?$
```

**Réponse ClarityAudio :** `^=V "CasinoAV16x16",1.0a,30B2S12345678$`  
**Réponse ProAudio :** `^=V "ProAudio16",1.23a,59B2S12345678$`

Champs : Modèle — Version firmware — Numéro de série.

---

### `QI` — Requête des capacités (ClarityAudio uniquement)

```
^QI ?$
```

**Réponse :** `^=QI chan_bitmap,vinputs,vzones,ainputs,azones,dinputs,dzones$`

| Champ | Description |
|-------|-------------|
| `chan_bitmap` | Masque des canaux disponibles |
| `vinputs` / `vzones` | Nombre d'entrées / sorties vidéo |
| `ainputs` / `azones` | Nombre d'entrées / sorties audio analogiques |
| `dinputs` / `dzones` | Nombre d'entrées / sorties audio numériques |

---

### `XS` — Paramètres de contrôle

```
^XS settings1,settings2$     Définit les deux groupes de bits
^XS +settings1,+settings2$   Met à 1 les bits indiqués
^XS -settings1,+settings2$   Met à 0 / 1 les bits indiqués
^XS ?$                        Lit les réglages actuels
```

**Réponse :** `^=XS settings1,settings2$`

Si un paramètre est absent de la commande, il reste inchangé. Une virgule indique un paramètre absent : `^XS ,settings2$`.

#### Bits de `settings1`

| Bit (valeur) | Nom | Description |
|--------------|-----|-------------|
| Bit 0 (1) | `ASY` | 0=Réponses sur demande uniquement / 1=Réponse à tout changement de paramètre |
| Bit 1 (2) | `ACK` | 0=Pas d'accusé `^+$` / 1=Accuser les commandes valides |
| Bit 2 (4) | `ECO` | 0=Pas de réponse automatique / 1=Toujours envoyer la réponse de paramètre |
| Bit 4 (16) | `CRE` | 0=Pas de CR/LF en fin de réponse / 1=Ajouter CR+LF |
| Bit 13 (8192) | `AUT` | 0=Mode classique (ClarityAudio) / 1=Conversion auto analogique↔numérique |
| Bit 15 (32768) | `XIO` | 0=Numérotation native / 1=Numérotation Extended I/O (ProAudio) |

**Valeurs par défaut ClarityAudio :** `settings1 = 8195` (AUT=1, CRE=1, ECO=1, ACK=1, ASY=0)  
**Valeurs par défaut ProAudio :** `ASY=1, ACK=1, ECO=1, CRE=1, XIO=0`

#### Bits de `settings2` (ProAudio)

| Bit (valeur) | Nom | Description |
|--------------|-----|-------------|
| Bit 1 (2) | `MJP` | 0=Incrément depuis le niveau muté / 1=Saut au niveau non muté avant incrément |
| Bit 2 (4) | `UVL` | 0=`VZ`/`VPZ` direct ne démute pas / 1=`VZ`/`VPZ` démute toujours |

#### Description des bits principaux

**`ASY`** : Active les réponses asynchrones. Tout changement de paramètre (y compris depuis le panneau frontal) génère une réponse. Recommandé à `0` pour le contrôle unidirectionnel ou pour maximiser les performances.

**`ACK`** : Désactiver supprime les `^+$`. Dans ce cas, certaines commandes sans réponse d'erreur n'auront aucun retour.

**`ECO`** : Désactiver supprime les réponses de changement de paramètre (hors `ASY`).

**`AUT` (ClarityAudio)** :
- `0` = Mode Classique : chemins analogique et numérique indépendants. Le volume et la tonalité n'affectent que l'analogique.
- `1` = Mode Auto : conversion automatique. Priorités :
  - Pas de signal numérique → l'analogique est utilisé et converti en numérique.
  - PCM-stéréo numérique présent → converti en analogique pour les deux sorties.
  - Dolby/DTS présent → numérique routé tel quel, analogique vers sorties analogiques.
  - Si Coax et Optique présents simultanément → priorité au **Coax**.

**`MJP` (ProAudio)** : Comportement lors de l'incrément/décrément de volume sur une zone mutée.  
**`UVL` (ProAudio)** : Comportement lors d'un réglage direct de volume (`VZ`/`VPZ` sans `+`/`-`) sur une zone mutée.

---

### `SS` — Sauvegarde des réglages en EEPROM

Sauvegarde les réglages actuels comme valeurs initiales au démarrage.

```
^SS settings$
```

Pas de réponse (sauf `^+$` si `ACK` est activé).

**Bits bitmappés :**

| Bit | Description |
|-----|-------------|
| 0 | Mappages zones/entrées et état de l'alimentation |
| 1 | Délais de commutation (`DZ`) |
| 2 | Réservé |
| 3 | Paramètres de contrôle (`XS`) |
| 4 | Réservé |
| 5 | Paramètres IP (`IPA`, `IPM`, `IPG`, `IPSET`) |
| 6–7 | Réservés |
| 8 | Volumes des zones |
| 9 | Paramètres audio des zones (basses, aigus, EQ, gains, lip-sync…) |
| 10 | Paramètres audio des entrées/sources (gains, lip-sync) |
| 11 | Paramètres audio globaux (volume master, temps de fade) |
| 12 | Paramètres de paging (ProAudio) |

**Exemples fréquents :**

```
^SS 1$     Sauvegarde le routage et l'état alimentation
^SS 8$     Sauvegarde les paramètres XS
^SS 32$    Sauvegarde les paramètres IP
^SS 256$   Sauvegarde les volumes des zones
^SS 4096$  Sauvegarde les paramètres de paging (ProAudio)
```

---

### `FS` — Réinitialisation aux valeurs d'usine

```
^FS settings$
```

Pas de réponse (sauf `^+$` si `ACK` activé). Mêmes bits que `SS`.

---

### `LI` — Mode et intensité de l'éclairage (ProAudio uniquement)

```
^LI mode,dim,bright,off$    Définit le mode et les intensités
^LI ?$                       Lit les réglages
```

**Réponse :** `^=LI mode,dim,bright,off$`

| Champ | Description | Plage |
|-------|-------------|-------|
| `mode` | 0=Éteint, 1=Dim fixe, 2=Bright fixe, 3=Auto-dim | 0–3 |
| `dim` | Intensité en mode atténué | 0–100 % |
| `bright` | Intensité en mode lumineux | 0–100 % |
| `off` | Intensité de la LED de veille | 0–100 % |

Les paramètres absents sont inchangés :

```
^LI ,,50$    → Définit uniquement 'bright' à 50 %
```

**Exemple :**

```
^=LI 3,020,090,010$    Mode auto, dim=20 %, bright=90 %, veille=10 %
```

---

## 7. Contrôle TCP/IP

### `IPSET` — Mode DHCP ou Statique

```
^IPSET mode$    0=Statique, 1=DHCP
^IPSET ?$       Lit le mode actuel
```

**Réponse :** `^=IPSET mode$`

Changer l'adresse statique en mode déjà statique nécessite de renvoyer `IPSET 0` après avoir mis à jour `IPA`.

---

### `IPA` — Adresse IP statique

```
^IPA xxx,xxx,xxx,xxx$    Définit la nouvelle adresse (appliquée au prochain IPSET 0)
^IPA ?$                   Lit l'adresse statique configurée
```

**Réponse :** `^=IPA xxx,xxx,xxx,xxx$`

> La réponse reflète l'adresse **configurée**, pas l'adresse **active**. Utiliser `IPAX` pour l'adresse active.

---

### `IPM` — Masque IP statique

```
^IPM xxx,xxx,xxx,xxx$    Ex : 255,255,255,000
^IPM ?$
```

---

### `IPG` — Passerelle IP statique

```
^IPG xxx,xxx,xxx,xxx$    Ex : 192,168,001,001
^IPG ?$
```

---

### `IPAX` — Adresse IP active (lecture seule)

```
^IPAX ?$
```

Retourne l'adresse IP actuellement utilisée (DHCP ou statique).

---

### `IPMX` — Masque IP actif (lecture seule)

```
^IPMX ?$
```

---

### `IPGX` — Passerelle IP active (lecture seule)

```
^IPGX ?$
```

---

## 8. Déclencheurs 12V (ProAudio uniquement)

### Vue d'ensemble

Les sorties 12V peuvent être contrôlées manuellement (`STRG`) ou associées à l'état d'alimentation de zones (`TRGZ`).

### `STRG` — Contrôle d'un déclencheur 12V

```
^STRG @trg,setting$
```

| Valeur | Description |
|--------|-------------|
| 0 | Éteint (override toute association de zone) |
| 1 | Allumé (override toute association de zone) |
| 2 | Contrôlé par l'état d'alimentation des zones associées |

---

### `TRGZ` — Association zone ↔ déclencheur 12V

```
^TRGZ @zone,trg$
```

- Si plusieurs zones sont associées au même déclencheur, celui-ci s'allume dès qu'une zone est active et s'éteint quand **toutes** les zones associées sont éteintes.
- L'état de la zone est déterminé par la commande `PZ`.
- Le déclencheur doit avoir son `STRG` réglé à `2` pour être contrôlé par les zones.

---

## 9. Paging et Sonnette (ProAudio uniquement)

### Vue d'ensemble

Le système de paging fonctionne par **presets** (1 ou 2). Le preset 0 = mode normal.

**Flux de configuration :**

1. Définir la source de paging par zone : `pASZ` / `pDSZ`
2. Définir les volumes de paging : `pVZ` / `pVPZ`
3. Configurer les flags « Do Not Disturb » : `pADNDZ` / `pDDNDZ` (défaut = DND pour toutes les zones)
4. Configurer les entrées physiques (si nécessaire) : `pDSW`
5. Définir les délais : `pTIME`
6. Sauvegarder : `^SS 4096$`
7. Déclencher une page : `pSET`

> Durée max d'une page : **2 minutes** (timeout automatique).

### Câblage du panneau arrière

Deux entrées de type contact sec ou tension (5V–20V AC/DC) :
- **Contact sec (dry contact)** : placer un pont entre SE et DB, connecter le bouton entre DB et SW.
- **Trigger tension** : connecter directement à la tension (ex. transformateur de sonnette).

### `pASZ` / `pDSZ` — Source de paging par zone

```
^pASZ preset,@zone,source$    (analogique)
^pDSZ preset,@zone,source$    (numérique)
```

**Réponses :** `^=pASZ preset,@zone,source$` / `^=pDSZ preset,@zone,source$`

Un preset de 0 est ignoré.

---

### `pAMZ` / `pDMZ` — Mute hard pendant un paging

```
^pAMZ preset,@zone,mute_flag$    (analogique)
^pDMZ preset,@zone,mute_flag$    (numérique)
```

> Pour un mute audio propre (avec fondu), préférer `pVMZ`.

---

### `pVZ` / `pVPZ` — Volume pendant un paging

```
^pVZ preset,@zone,vol_db$         (valeurs dB : 0–248)
^pVPZ preset,@zone,vol_percent$    (valeurs % : 0–100)
```

- **Valeur sans préfixe** = volume absolu.
- **Avec `+` ou `-`** = ajustement relatif par rapport au volume courant.
- La valeur `+0` = volume inchangé.

---

### `pVMZ` — Mute doux pendant un paging

```
^pVMZ preset,@zone,mute_flag$
```

Même comportement que `VMZ` (mute via processeur audio), actif pendant la page.

---

### `pADNDZ` / `pDDNDZ` — Flags Do Not Disturb

Chaque preset possède ses propres flags DND (défaut : toutes les zones = DND).

```
^pADNDZ preset,do_not_disturb_flag$    (analogique)
^pDDNDZ preset,do_not_disturb_flag$    (numérique)
```

| Niveau | Comportement |
|--------|--------------|
| 0 | Autorise le paging complet |
| 1 | Ignore toutes les demandes de paging (Do Not Disturb) |
| 2 | Autorise le paging mais ne change pas la source (mute/volume OK, pas de commutation) |

---

### `pDSW` — Configuration des entrées physiques (panneau arrière)

```
^pDSW switch,action,preset,time$    switch = 1 ou 2
```

| Valeur `action` | Description |
|-----------------|-------------|
| 0 | Désactivé |
| 1 | Actif quand fermé / tension présente (durée = tant que contact actif) |
| 2 | Actif quand ouvert / tension absente |
| 3 | Timed on : déclenche à la fermeture, durée = `time` ms |
| 4 | Timed off : déclenche à l'ouverture, durée = `time` ms |

`time` = durée en millisecondes (ignoré en mode active on/off).

---

### `pTIME` — Délais initiaux et durée minimale de paging

```
^pTIME preset,init_dly,min_time$
```

- `init_dly` : délai avant la commutation des sources (ms, max 30 s). Utile pour laisser le temps à un ampli de démarrer.
- `min_time` : durée minimale d'une page (ms). Évite qu'une pression rapide coupe trop vite la sonnette.

---

### `pSET` — Déclencher ou arrêter un paging

```
^pSET preset,time$
```

**Réponse :** `^=pSET preset$`

- `preset = 0` → arrête le paging, retour au mode normal.
- `preset = 1 ou 2` → déclenche le paging avec ce preset.
- Un preset ne peut pas interrompre un autre preset actif (seul `pSET 0` peut l'arrêter).
- `time = 0` → page jusqu'à réception de `pSET 0`.
- `time > 0` → page pendant `time` millisecondes puis retour automatique.
- Timeout dur à **2 minutes**.

---

*Document généré à partir de : ClarityAudio 16x16 User Guide v1.01 (2012) et Serial Protocol v1.1 (2021)*
