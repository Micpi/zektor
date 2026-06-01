# Open API for Installers — Blaze Power Zone

> **Customer Information Space**  
> Exported on 01/10/2024

---

## Table of Contents

1. [Revision History](#1-revision-history)
   - 1.1 [Firmware 1.6 Changes](#11-firmware-16-changes)
   - 1.2 [Firmware 1.5 Changes](#12-firmware-15-changes)
   - 1.3 [Firmware 1.4 Changes](#13-firmware-14-changes)
   - 1.4 [Firmware 1.3 Changes](#14-firmware-13-changes)
   - 1.5 [Firmware 1.2 Changes](#15-firmware-12-changes)
   - 1.6 [Firmware 1.1 Changes](#16-firmware-11-changes)
2. [Getting Started](#2-getting-started)
3. [Definitions](#3-definitions)
4. [API Endpoints](#4-api-endpoints)
5. [Command/Response](#5-commandresponse)

---

## 1. Revision History

| Firmware | Date | Changed By |
|----------|------|------------|
| 1.6 | 21/11-2023 | MAM |
| 1.5 | 27/6-2023 | MAM |
| 1.4 | 16/1-2023 | MAM |
| 1.3 | 5/9-2022 | MAM |
| 1.2 | 9/3-2022 | MAM |
| 1.1 | 16/12-2021 | MAM |
| 1.0 | 11/11-2021 | MAM |

---

### 1.1 Firmware 1.6 Changes

- **Updated:** Input Channels updated to 8 channels. See [{IID} Input Channels](#32-iid-input-channels)

---

### 1.2 Firmware 1.5 Changes

- **Added:** Dante Info Registers (`SYSTEM.DANTE.*`)
- **Updated:** Input Channels updated with Dante. See [{IID} Input Channels](#32-iid-input-channels)
- **Updated:** Input Sources updated with Dante. See [{SID} Input Source](#37-sid-input-source)
- **Updated:** Added Mix to Output Route Sources. See [{RSID} Route Source](#38-rsid-route-source)

#### 1.2.1 Registers Added

| Register Name |
|---------------|
| SYSTEM.DANTE.SOFTWARE_VERSION |
| SYSTEM.DANTE.FIRMWARE_VERSION |
| SYSTEM.DANTE.IP |
| SYSTEM.DANTE.MAC |
| SYSTEM.DANTE.LINK_SPEED |
| SYSTEM.DANTE.AES67_ENABLED |
| SYSTEM.DANTE.DEVICE_NAME |
| SYSTEM.DANTE.ENCODING |
| SYSTEM.DANTE.SAMPLE_RATE |
| SYSTEM.DANTE.CLOCK_STATE |
| SYSTEM.DANTE.MUTE_STATE |

#### 1.2.2 Registers Modified

- Added Mixes to Route Sources
- Added PowerMode: `AUDIO_DSP` to register `SETUP.POWER.POWER_ON`

---

### 1.3 Firmware 1.4 Changes

- **Added:** Input HPF
- **Added:** 5-Band Input EQ
- **Added:** Mixes as Zone Primary Src
- **Added:** Zone Priority Src for Zone
- **Added:** Option to disable Mute to Zone
- **Added:** Zone Ducker
- **Added:** Option to limit zone sources (Wall Controller Specific)
- **Added:** Option to select output SPDIF source
- **Added:** Bandwidth limitation for Pink Noise Generator
- **Added:** Sine Generator
- **Removed:** Generator cannot be disabled

#### 1.3.1 Registers Added

| Register Name |
|---------------|
| IN.EQ.COUNT |
| IN-{IID}.HPF_ENABLE |
| IN-{IID}.EQ.BYPASS |
| IN-{IID}.EQ-{EID}.TYPE |
| IN-{IID}.EQ-{EID}.GAIN |
| IN-{IID}.EQ-{EID}.FREQ |
| IN-{IID}.EQ-{EID}.Q |
| IN-{IID}.EQ-{EID}.BYPASS |
| ZONE-{ZID}.PRIORITY_SRC |
| ZONE-{ZID}.MUTE_ENABLE |
| ZONE-{ZID}.SRC-{SID}.ENABLED |
| ZONE-{ZID}.DUCK.MODE |
| ZONE-{ZID}.DUCK.AUTO |
| ZONE-{ZID}.DUCK.THRESHOLD |
| ZONE-{ZID}.DUCK.ATTACK |
| ZONE-{ZID}.DUCK.RELEASE |
| ZONE-{ZID}.DUCK.HOLD |
| ZONE-{ZID}.DUCK.OVERRIDE_GAIN |
| ZONE-{ZID}.DUCK.OVERRIDE_GAIN_ENABLE |
| GENERATOR.TYPE |
| GENERATOR.SINE.FREQ |
| GENERATOR.PINK.LPF_ENABLE |
| GENERATOR.PINK.LPF_FREQ |
| GENERATOR.PINK.HPF_ENABLE |
| GENERATOR.PINK.HPF_FREQ |
| MIX.COUNT |
| MIX-{MID}.NAME |
| MIX-{MID}.GAIN-{IID} |
| ROUT-{RID}.SRC |
| ROUT-{RID}.SRC_CHANNEL |
| ROUT-{RID}.GAIN |

#### 1.3.2 Registers Removed

| Register Name |
|---------------|
| GENERATOR.ENABLE |

---

### 1.4 Firmware 1.3 Changes

- **Added:** Output Gain
- **Added:** Clip Limiter Mode
- **Added:** Security Registers for WebPage Security
- **Added:** Input Gain Min + Input Gain Max
- **Added:** Analog Volume Control Value register as Value
- **Removed:** Analog Volume Control Volume register
- **Updated:** Input Gain - Range increase from [-10, 10] to [-15, 15] dB
- **Updated:** Zone Gain - when using Analog Volume Control
- **Updated:** `SETUP.LAN` and `SETUP.WIFI` registers as readonly

#### 1.4.1 Registers Added

| Register Name |
|---------------|
| ZONE-{ZID}.GAIN_MIN |
| ZONE-{ZID}.GAIN_MAX |
| OUT-{OID}.GAIN |
| OUT-{OID}.CLIP_LIMITER.MODE |
| VC-{VID}.VALUE |
| SYSTEM.SECURITY.PASSWORD_ENABLE |
| SYSTEM.SECURITY.PASSWORD_HASH |

#### 1.4.2 Registers Updated

| Register Name | Change |
|---------------|--------|
| IN-{IID}.GAIN | Limits |
| ZONE-{ZID}.GAIN | Limits, more |
| SETUP.LAN.NETWORK_MODE | Read Only |
| SETUP.LAN.IP | Read Only |
| SETUP.LAN.MASK | Read Only |
| SETUP.LAN.GATEWAY | Read Only |
| SETUP.LAN.DNS1 | Read Only |
| SETUP.LAN.DNS2 | Read Only |
| SETUP.WIFI.ENABLE | Read Only |
| SETUP.WIFI.DISABLE_LAN_CONNECTED | Read Only |
| SETUP.WIFI.DISABLE_AFTER | Read Only |
| SETUP.WIFI.MODE | Read Only |
| SETUP.WIFI.AP_SSID | Read Only |
| SETUP.WIFI.AP_PASS | Read Only |
| SETUP.WIFI.STA_SSID | Read Only |
| SETUP.WIFI.STA_PASS | Read Only |

#### 1.4.3 Registers Removed

| Register Name |
|---------------|
| VC-{VID}.VOLUME |

---

### 1.5 Firmware 1.2 Changes

- INC Command support for Input Gain
- Added Frequency parameter for SUBSCRIBE command
- Pink Noise Generator

#### 1.5.1 Registers Added

| Register Name |
|---------------|
| SETUP.DEVICE.SERIAL |
| SETUP.DEVICE.FIRMWARE |
| SETUP.DEVICE.MAC |
| SETUP.DEVICE.WIFI_MAC |
| OUT-{OID}.LIMITER.AUTO |
| OUT-{OID}.LIMITER.THRESHOLD |
| OUT-{OID}.LIMITER.ATTACK |
| OUT-{OID}.LIMITER.RELEASE |
| OUT-{OID}.LIMITER.HOLD |

---

### 1.6 Firmware 1.1 Changes

#### 1.6.1 Registers Added

| Register Name |
|---------------|
| ZONE-{ZID}.COMPRESSOR.HOLD |
| OUT-{OID}.PRESET.NAME |
| OUT-{OID}.PRESET.ID |
| OUT-{OID}.PRESET.LOCKED |
| OUT-{OID}.POLARITY.PROTECTED |
| OUT-{OID}.OUTPUT_MODE.PROTECTED |
| OUT-{OID}.SPEAKER_DELAY.PROTECTED |
| OUT-{OID}.LIMITER.PROTECTED |
| OUT-{OID}.SPEAKER_EQ.PROTECTED |
| OUT-{OID}.XR.PROTECTED |
| OUT-{OID}.FIR.PROTECTED |
| OUT-{OID}.PEAK_LIMITER.BYPASS |
| OUT-{OID}.PEAK_LIMITER.KNEE |
| OUT-{OID}.RMS_LIMITER.BYPASS |
| OUT-{OID}.RMS_LIMITER.THRESHOLD |
| OUT-{OID}.RMS_LIMITER.ATTACK |
| OUT-{OID}.RMS_LIMITER.RELEASE |
| OUT-{OID}.RMS_LIMITER.HOLD |
| OUT-{OID}.RMS_LIMITER.KNEE |
| OUT-{OID}.CLIP_LIMITER.BYPASS |
| OUT-{OID}.FIR.BYPASS |
| OUT-{OID}.FIR.TAPS |

---

## 2. Getting Started

### 2.1 Connecting to the Amplifier

Out of the box the amplifier is hard-coded with the Ethernet Address `192.168.64.100`.

It is also possible to connect via WiFi. Connect to the WiFi AP (SSID) and use the default IP address `192.168.4.1`.

### 2.2 Discovery

If the application requires the amplifier to have a dynamic IP address, use **mDNS** to locate the amplifier.

**Service type:** `_pasconnect._tcp`

**mDNS Properties:**

| Property | Description |
|----------|-------------|
| `api_version` | The API version of the device |
| `device_type` | Device type — always `PasAmpControl` for amplifiers |
| `model` | The model name of the device |
| `software_id` | Software ID (Manufacturer and Model Specific) |
| `hardware_id` | Hardware ID (Model ID) |

**Example (Avahi for Linux):**

```bash
$> avahi-browse -t -r _pasconnect._tcp

hostname = [{{ api_mdns_hostname }}.local]
address  = [192.168.64.100]
port     = [80]
txt      = {{ api_mdns_txt }}
```

---

## 3. Definitions

### 3.1 Variable Types

| Type | Description |
|------|-------------|
| **Float** | Float format, delimited with `.` |
| **Integer** | Normal integer |
| **Enum** | String with a predefined set of options |
| **String** | String — may have character length limitations. Values containing spaces must be enclosed in double-quotes. |

---

### 3.2 {IID} Input Channels

| ID | Description |
|----|-------------|
| 100 | Analog Input 1 |
| 101 | Analog Input 2 |
| 102 | Analog Input 3 |
| 103 | Analog Input 4 |
| 104 | Analog Input 5 *(8 channel version only)* |
| 105 | Analog Input 6 *(8 channel version only)* |
| 106 | Analog Input 7 *(8 channel version only)* |
| 107 | Analog Input 8 *(8 channel version only)* |
| 200 | SPDIF 1 (Left) |
| 201 | SPDIF 1 (Right) |
| 300 | Dante 1 *(Dante Enabled Amplifiers only)* |
| 301 | Dante 2 *(Dante Enabled Amplifiers only)* |
| 302 | Dante 3 *(Dante Enabled Amplifiers only)* |
| 303 | Dante 4 *(Dante Enabled Amplifiers only)* |
| 400 | Noise Generator |

---

### 3.3 {MID} Mix Channels

| ID | Description |
|----|-------------|
| 1 | Mix 1 |
| 2 | Mix 2 |
| 3 | Mix 3 *(4 and 8 channel versions only)* |
| 4 | Mix 4 *(4 and 8 channel versions only)* |
| 5 | Mix 5 *(8 channel version only)* |
| 6 | Mix 6 *(8 channel version only)* |
| 7 | Mix 7 *(8 channel version only)* |
| 8 | Mix 8 *(8 channel version only)* |

---

### 3.4 {ZID} Zones

| ID | Description |
|----|-------------|
| A | Zone A |
| B | Zone B |
| C | Zone C *(4 and 8 channel versions only)* |
| D | Zone D *(4 and 8 channel versions only)* |
| E | Zone E *(8 channel version only)* |
| F | Zone F *(8 channel version only)* |
| G | Zone G *(8 channel version only)* |
| H | Zone H *(8 channel version only)* |

---

### 3.5 {OID} Output Channels

| ID | Description |
|----|-------------|
| 1 | Output 1 |
| 2 | Output 2 |
| 3 | Output 3 *(4 and 8 channel versions only)* |
| 4 | Output 4 *(4 and 8 channel versions only)* |
| 5 | Output 5 *(8 channel version only)* |
| 6 | Output 6 *(8 channel version only)* |
| 7 | Output 7 *(8 channel version only)* |
| 8 | Output 8 *(8 channel version only)* |

---

### 3.6 {RID} Output Route Channels

| ID | Description |
|----|-------------|
| 1 | Output 1 |
| 2 | Output 2 |

---

### 3.7 {SID} Input Source

| ID | Description |
|----|-------------|
| 0 | Unused Input (Silent) |
| 100 | Analog Input 1 |
| 101 | Analog Input 2 |
| 102 | Analog Input 3 |
| 103 | Analog Input 4 |
| 104 | Analog Input 5 *(8 channel version only)* |
| 105 | Analog Input 6 *(8 channel version only)* |
| 106 | Analog Input 7 *(8 channel version only)* |
| 107 | Analog Input 8 *(8 channel version only)* |
| 200 | SPDIF 1 (Left) |
| 201 | SPDIF 1 (Right) |
| 300 | Dante 1 *(Dante Enabled Amplifiers only)* |
| 301 | Dante 2 *(Dante Enabled Amplifiers only)* |
| 302 | Dante 3 *(Dante Enabled Amplifiers only)* |
| 303 | Dante 4 *(Dante Enabled Amplifiers only)* |
| 400 | Noise Generator |
| 500 | Mix 1 |
| 501 | Mix 2 |
| 502 | Mix 3 *(4 and 8 channel versions only)* |
| 503 | Mix 4 *(4 and 8 channel versions only)* |
| 504 | Mix 5 *(8 channel version only)* |
| 505 | Mix 6 *(8 channel version only)* |
| 506 | Mix 7 *(8 channel version only)* |
| 507 | Mix 8 *(8 channel version only)* |

---

### 3.8 {RSID} Route Source

| ID | Description |
|----|-------------|
| 0 | Unused (Silent) |
| 100 | Analog Input 1 |
| 101 | Analog Input 2 |
| 102 | Analog Input 3 |
| 103 | Analog Input 4 |
| 104 | Analog Input 5 *(8 channel version only)* |
| 105 | Analog Input 6 *(8 channel version only)* |
| 106 | Analog Input 7 *(8 channel version only)* |
| 107 | Analog Input 8 *(8 channel version only)* |
| 200 | SPDIF 1 (Left) |
| 201 | SPDIF 1 (Right) |
| 300 | Dante 1 |
| 301 | Dante 2 |
| 302 | Dante 3 |
| 303 | Dante 4 |
| 500 | Mix A |
| 501 | Mix B |
| 502 | Mix C |
| 503 | Mix D |
| 1000 | Zone A |
| 1001 | Zone B |
| 1002 | Zone C *(4 and 8 channel versions only)* |
| 1003 | Zone D *(4 and 8 channel versions only)* |
| 1004 | Zone E *(8 channel version only)* |
| 1005 | Zone F *(8 channel version only)* |
| 1006 | Zone G *(8 channel version only)* |
| 1007 | Zone H *(8 channel version only)* |

---

### 3.9 {VID} Volume Controls

| ID | Description |
|----|-------------|
| 0 | OFF |
| 1 | GPIO PIN 4 Volume Control |
| 2 | GPIO PIN 5 Volume Control |
| 3 | GPIO PIN 6 Volume Control |
| 4 | GPIO PIN 7 Volume Control |

---

### 3.10 {EID} Equalizer Bands

| ID | Description |
|----|-------------|
| 1–5 | Equalizer Bands 1–5 |
| 6–10 | Equalizer Bands 6–10 *(Output and Speaker EQ Only)* |
| 11–15 | Equalizer Bands 11–15 *(Speaker EQ Only)* |

---

## 4. API Endpoints

### 4.1 Raw Socket API

The primary API uses a **TCP Socket connection on port 7621** and is line-based — every line is delimited by newline `\n`.

Each line contains a single message. The API consists of two parts:
- **Command/Response interface**
- **Publish/Subscribe interface**

### 4.2 WebSocket API

Also available via WebSocket. The command syntax is identical to the Socket API, though a single WebSocket message may contain/return multiple lines.

**WebSocket URL:** `ws://{DEVICE_IP}/ws`

### 4.3 Examples

#### 4.3.1 NCat

```powershell
# PowerShell
$> "POWER_ON" | ncat 192.168.64.100 7621 --no-shutdown -i 1
*POWER_ON
```

```bash
# Bash
$> echo "POWER_ON" | ncat 192.168.64.100 7621 --no-shutdown -i 1
*POWER_ON
```

#### 4.3.2 Python — Raw Socket Example

```python
import socket

TARGET = '192.168.64.100'
PORT = 7621

def get_all():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((TARGET, PORT))
        cmd = "GET *\n"
        s.sendall(cmd.encode())
        while True:
            reply = s.recv(64*1024)
            if reply:
                reply = reply.decode()
                print(reply)
            if not reply or f'*{cmd}' in reply:
                break

def subscribe_all():
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.connect((TARGET, PORT))
        cmd = "SUBSCRIBE *\n"
        s.sendall(cmd.encode())
        for _ in range(5):
            reply = s.recv(64*1024)
            if reply:
                reply = reply.decode()
                print(reply)

get_all()
subscribe_all()
```

#### 4.3.3 Python — WebSocket Example

```python
# Requires: pip install websockets
from websockets.sync.client import connect

TARGET = '192.168.64.100'

def get_all():
    with connect(f"ws://{TARGET}/ws") as websocket:
        cmd = "GET *"
        websocket.send(cmd)
        reply = websocket.recv(timeout=0.5)
        print(reply)
        websocket.close_socket()

def subscribe_all():
    with connect(f"ws://{TARGET}/ws") as websocket:
        cmd = "SUBSCRIBE *"
        websocket.send(cmd)
        for i in range(5):
            reply = websocket.recv(timeout=0.5)
            print(reply)
        websocket.close_socket()

get_all()
subscribe_all()
```

---

## 5. Command/Response

The Command/Response interface allows for querying/updating registers and executing commands.

**Response patterns:**

```
# Success
>> {COMMAND}
<< *{COMMAND}

# Error
>> {COMMAND}
<< #{Error Message}

# Success with data
>> {COMMAND}
<< +{RESPONSE}
<< *{COMMAND}
```

---

### 5.1 Command Types

#### 5.1.1 GET

Get the value of an amplifier register. Supports wildcards (`*`).

```
>> GET {REGISTER}
<< +{RESPONSE(s)}
<< *{COMMAND}
```

**Examples:**

```
>> GET IN-100.NAME
<< +IN-100.NAME "Analog 1"
<< *GET IN-100.NAME

>> GET IN-*.NAME
<< +IN-100.NAME "Analog 1"
<< +IN-101.NAME "Analog 2"
<< +IN-102.NAME "Analog 3"
<< +IN-103.NAME "Analog 4"
<< +IN-200.NAME "S/PDIF 1L"
<< +IN-201.NAME "S/PDIF 1R"
<< +IN-400.NAME "Noise Generator"
<< *GET IN-*.NAME
```

#### 5.1.2 SET

Set a value in an amplifier register. Does **not** support wildcards.

```
>> SET {REGISTER} {VALUE}
<< *{COMMAND}
```

**Example:**

```
>> SET IN-100.NAME "Streamer"
<< +IN-100.NAME "Streamer"
<< *SET IN-100.NAME "Streamer"
```

#### 5.1.3 INC

Modifies a register value by the specified amount (positive or negative). Does **not** support wildcards.

```
>> INC {REGISTER} {VALUE}
<< +{REGISTER} {MODIFIED VALUE}
<< *{COMMAND}
```

**Example:**

```
>> INC ZONE-A.GAIN -5
<< +ZONE-A.GAIN -5.00
<< *INC ZONE-A.GAIN -5
```

#### 5.1.4 SUBSCRIBE

Subscribe to changes in all registers and dynamic values.

```
>> SUBSCRIBE
<< +IN-100.DYN.SIGNAL -49.9777
<< +IN-100.DYN.CLIP 0
...
<< *SUBSCRIBE
```

##### 5.1.4.1 SUBSCRIBE \<BLANK|\*|REG|DYN\> \<FREQ\>

| Parameter | Description |
|-----------|-------------|
| `REG` | Register updates only |
| `DYN` | Dynamic updates only |
| `*` | All register updates (same as BLANK) |
| *(blank)* | Both dynamic and register updates |
| `<FREQ>` | Update frequency: `1` = 1/sec, `0.5` = 1 every 5 sec |

#### 5.1.5 UNSUBSCRIBE

##### 5.1.5.1 UNSUBSCRIBE \<BLANK|\*|REG|DYN\>

| Parameter | Description |
|-----------|-------------|
| `REG` | Unsubscribe register updates only |
| `DYN` | Unsubscribe dynamic updates only |
| *(blank)* | Unsubscribe both |

> **Note:** An `UNSUBSCRIBE` with blank value will NOT unsubscribe a subscription to register-only updates.

```
>> UNSUBSCRIBE DYN
<< *UNSUBSCRIBE DYN
```

#### 5.1.6 POWER_ON

```
>> POWER_ON
<< *POWER_ON
```

#### 5.1.7 POWER_OFF

```
>> POWER_OFF
<< *POWER_OFF
```

---

### 5.2 Registers

#### 5.2.1 Base Registers

| Register Name | Type | Access | Notes |
|---------------|------|--------|-------|
| API_VERSION | String | Get | |
| SYSTEM.STATUS.STATE | Enum | Get | `{INIT, STANDBY, ON, FAULT}` |
| SYSTEM.STATUS.SIGNAL_IN | Enum | Get | `{OFF, NO_SIGNAL, SIGNAL, CLIP}` |
| SYSTEM.STATUS.SIGNAL_OUT | Enum | Get | `{OFF, NO_SIGNAL, SIGNAL, CLIP, FAULT}` |
| SYSTEM.STATUS.LAN | String | Get | IP Address or Empty |
| SYSTEM.STATUS.WIFI | String | Get | IP Address or Empty |

##### 5.2.1.1 API_VERSION

- **Type:** Register | **Methods:** Get | **Values:** String

```
>> GET API_VERSION
<< +API_VERSION "1.6"
<< *GET API_VERSION
```

##### 5.2.1.2 SYSTEM.STATUS.STATE

- **Type:** Register | **Methods:** Get | **Values:** Enum

| Value | Description |
|-------|-------------|
| `INIT` | Amplifier is initializing |
| `STANDBY` | Amplifier is in standby |
| `ON` | Amplifier is on |
| `FAULT` | Amplifier has non-recoverable error |

```
>> GET SYSTEM.STATUS.STATE
<< +SYSTEM.STATUS.STATE "ON"
<< *GET SYSTEM.STATUS.STATE
```

##### 5.2.1.3 SYSTEM.STATUS.SIGNAL_IN

- **Type:** Register | **Methods:** Get | **Values:** Enum

| Value | Description |
|-------|-------------|
| `OFF` | Input(s) is Off |
| `NO_SIGNAL` | Input(s) has no signal (below threshold) |
| `SIGNAL` | Input(s) has signal (above threshold) |
| `CLIP` | Input(s) is clipping ADC — decrease sensitivity |

```
>> GET SYSTEM.STATUS.SIGNAL_IN
<< +SYSTEM.STATUS.SIGNAL_IN "SIGNAL"
<< *GET SYSTEM.STATUS.SIGNAL_IN
```

##### 5.2.1.4 SYSTEM.STATUS.SIGNAL_OUT

- **Type:** Register | **Methods:** Get | **Values:** Enum

| Value | Description |
|-------|-------------|
| `OFF` | Output(s) is Off |
| `NO_SIGNAL` | Output(s) has no signal (below threshold) |
| `SIGNAL` | Output(s) has signal (above threshold) |
| `CLIP` | Output(s) is clipping — decrease volume |
| `FAULT` | Output(s) has unspecified fault |

```
>> GET SYSTEM.STATUS.SIGNAL_OUT
<< +SYSTEM.STATUS.SIGNAL_OUT "SIGNAL"
<< *GET SYSTEM.STATUS.SIGNAL_OUT
```

##### 5.2.1.5 SYSTEM.STATUS.LAN

- **Type:** Register | **Methods:** Get | **Values:** String

```
>> GET SYSTEM.STATUS.LAN
<< +SYSTEM.STATUS.LAN "192.168.64.100"
<< *GET SYSTEM.STATUS.LAN
```

##### 5.2.1.6 SYSTEM.STATUS.WIFI

- **Type:** Register | **Methods:** Get | **Values:** String

```
>> GET SYSTEM.STATUS.WIFI
<< +SYSTEM.STATUS.WIFI "192.168.4.1"
<< *GET SYSTEM.STATUS.WIFI
```

---

#### 5.2.2 Device Information Registers

| Register Name | Type | Access | Notes |
|---------------|------|--------|-------|
| SYSTEM.DEVICE.SWID | Integer | Get | |
| SYSTEM.DEVICE.HWID | Integer | Get | |
| SYSTEM.DEVICE.VENDOR_NAME | String | Get | Max 32 chars |
| SYSTEM.DEVICE.MODEL_NAME | String | Get | Max 32 chars |
| SYSTEM.DEVICE.SERIAL | String | Get | Max 32 chars |
| SYSTEM.DEVICE.FIRMWARE | String | Get | Max 32 chars |
| SYSTEM.DEVICE.FIRMWARE_DATE | String | Get | Max 32 chars |
| SYSTEM.DEVICE.MAC | String | Get | Max 32 chars |
| SYSTEM.DEVICE.WIFI_MAC | String | Get | Max 32 chars |

**Examples:**

```
>> GET SYSTEM.DEVICE.HWID
<< +SYSTEM.DEVICE.HWID 4
<< *GET SYSTEM.DEVICE.HWID

>> GET SYSTEM.DEVICE.SERIAL
<< +SYSTEM.DEVICE.SERIAL "2122023201X00031"
<< *GET SYSTEM.DEVICE.SERIAL

>> GET SYSTEM.DEVICE.FIRMWARE
<< +SYSTEM.DEVICE.FIRMWARE "1.0.0"
<< *GET SYSTEM.DEVICE.FIRMWARE

>> GET SYSTEM.DEVICE.FIRMWARE_DATE
<< +SYSTEM.DEVICE.FIRMWARE_DATE "Nov 5 2021 07:51:56"
<< *GET SYSTEM.DEVICE.FIRMWARE_DATE

>> GET SYSTEM.DEVICE.MAC
<< +SYSTEM.DEVICE.MAC "C4:5B:BE:31:42:F3"
<< *GET SYSTEM.DEVICE.MAC

>> GET SYSTEM.DEVICE.WIFI_MAC
<< +SYSTEM.DEVICE.WIFI_MAC "C4:5B:BE:31:42:F0"
<< *GET SYSTEM.DEVICE.WIFI_MAC
```

---

#### 5.2.3 System Information Registers

| Register Name | Type | Access | Notes |
|---------------|------|--------|-------|
| SETUP.SYSTEM.DEVICE_NAME | String[32] | Get, Set | |
| SETUP.SYSTEM.VENUE_NAME | String[32] | Get, Set | |
| SETUP.SYSTEM.CUSTOMER_NAME | String[32] | Get, Set | |
| SETUP.SYSTEM.ASSET_TAG | String[32] | Get, Set | |
| SETUP.SYSTEM.INSTALLER_NAME | String[32] | Get, Set | |
| SETUP.SYSTEM.CONTACT_INFO | String[32] | Get, Set | |
| SETUP.SYSTEM.INSTALL_DATE | String[64] | Get, Set | |
| SETUP.SYSTEM.INSTALL_NOTES | String[512] | Get, Set | |
| SETUP.SYSTEM.LOCATING | Boolean | Get, Set | |
| SETUP.SYSTEM.CUSTOM1 | String[8192] | Get, Set | |
| SETUP.SYSTEM.CUSTOM2 | String[8192] | Get, Set | |
| SETUP.SYSTEM.CUSTOM3 | String[8192] | Get, Set | |

**Examples:**

```
>> GET SETUP.SYSTEM.DEVICE_NAME
<< +SETUP.SYSTEM.DEVICE_NAME "MyAmplifier"
<< *GET SETUP.SYSTEM.DEVICE_NAME

>> SET SETUP.SYSTEM.DEVICE_NAME "MyBlaze"
<< *SET SETUP.SYSTEM.DEVICE_NAME "MyBlaze"

>> SET SETUP.SYSTEM.VENUE_NAME "THouse"
<< *SET SETUP.SYSTEM.VENUE_NAME "THouse"

>> SET SETUP.SYSTEM.INSTALL_DATE "01-01-2021"
<< *SET SETUP.SYSTEM.INSTALL_DATE "01-01-2021"

>> SET SETUP.SYSTEM.LOCATING 1
<< *SET SETUP.SYSTEM.LOCATING 1
```

---

#### 5.2.4 Input Registers

| Register Name | Type | Access | Unit | Range |
|---------------|------|--------|------|-------|
| IN.COUNT | Integer | Get | | IID in [1, .COUNT] |
| IN-{IID}.NAME | String[32] | Get, Set | | |
| IN-{IID}.SENS | Enum | Get, Set | | `{14DBU, 4DBU, -10DBV, MIC}` |
| IN-{IID}.GAIN | Float | Get, Set | dB | [-15.0, 15.0] / [-48, 0] for Generator |
| IN-{IID}.STEREO | Boolean | Get, Set | | Primary channels only: 100, 102, 200 |
| IN-{IID}.HPF_ENABLE | Boolean | Get, Set | | Analog channels only: 100–199 |
| IN-{IID}.DYN.SIGNAL | Float | Subscribe | dB | [-144, 20.0] — updated every 50ms |
| IN-{IID}.DYN.CLIP | Boolean | Subscribe | | ADC clipping — updated every 50ms |

##### IN-{IID}.SENS Values

| Value | Description |
|-------|-------------|
| `14DBU` | 14 DBU Sensitivity — Max input (ADC Clip) +24 DBU |
| `4DBU` | 4 DBU Sensitivity — Max input (ADC Clip) +14 DBU |
| `-10DBV` | -10 dBV Sensitivity — Max input (ADC Clip) +4 DBU |
| `MIC` | Max sensitivity for Microphone |

**Examples:**

```
>> GET IN.COUNT
<< +IN.COUNT 7
<< *GET IN.COUNT

>> SET IN-100.NAME "CD Player"
<< *SET IN-100.NAME "CD Player"

>> SET IN-100.SENS "-10DBV"
<< *SET IN-100.SENS "-10DBV"

>> SET IN-100.GAIN -4.0
<< *SET IN-100.GAIN -4.0

>> SET IN-100.STEREO 1
<< *SET IN-100.STEREO 1

>> SET IN-100.HPF_ENABLE 1
<< *SET IN-100.HPF_ENABLE 1
```

---

#### 5.2.5 Input EQ Registers

| Register Name | Type | Access | Unit | Range |
|---------------|------|--------|------|-------|
| IN.EQ.COUNT | Integer | Get | | EID in [1, .COUNT] |
| IN-{IID}.EQ.BYPASS | Boolean | Get, Set | | Analog inputs only: 100–199 |
| IN-{IID}.EQ-{EID}.TYPE | Enum | Get, Set | | `{PARAMETRIC, LOWPASS_12, HIGHPASS_12, LOW_SHELF_Q, HIGH_SHELF_Q}` |
| IN-{IID}.EQ-{EID}.GAIN | Float | Get, Set | dB | [-15, 15] |
| IN-{IID}.EQ-{EID}.FREQ | Float | Get, Set | Hz | [20, 20000] |
| IN-{IID}.EQ-{EID}.Q | Float | Get, Set | | [0.4, 30] |
| IN-{IID}.EQ-{EID}.BYPASS | Boolean | Get, Set | | Analog channels: 100–199 |

> **Note:** All Input EQ registers are only valid for Analog inputs (100–199).

**Examples:**

```
>> GET IN.EQ.COUNT
<< +IN.EQ.COUNT 5
<< *GET IN.EQ.COUNT

>> SET IN-100.EQ.BYPASS 1
<< *SET IN-100.EQ.BYPASS 1

>> SET IN-100.EQ-1.TYPE NOTCH
<< *SET IN-100.EQ-1.TYPE NOTCH

>> SET IN-100.EQ-1.GAIN 1.0
<< *SET IN-100.EQ-1.GAIN 1.0

>> SET IN-100.EQ-1.FREQ 200
<< *SET IN-100.EQ-1.FREQ 200

>> SET IN-100.EQ-1.Q 1.5
<< *SET IN-100.EQ-1.Q 1.5
```

---

#### 5.2.6 Zone Registers

| Register Name | Type | Access | Unit | Range |
|---------------|------|--------|------|-------|
| ZONE.COUNT | Integer | Get | | ZID in [1, .COUNT] |
| ZONE-{ZID}.NAME | String[32] | Get, Set | | |
| ZONE-{ZID}.PRIMARY_SRC | Integer | Get, Set | | Valid SID |
| ZONE-{ZID}.PRIORITY_SRC | Integer | Get, Set | | Valid SID |
| ZONE-{ZID}.GAIN | Float | Get, Set | dB | [GAIN_MIN, GAIN_MAX] |
| ZONE-{ZID}.GAIN_MIN | Float | Get, Set | dB | [-80, GAIN_MAX] |
| ZONE-{ZID}.GAIN_MAX | Float | Get, Set | dB | [GAIN_MIN, 0] |
| ZONE-{ZID}.STEREO | Boolean | Get, Set | | Primary zones A and C only |
| ZONE-{ZID}.GPIO_VC | Integer | Get, Set | | Valid VID, 0 for OFF |
| ZONE-{ZID}.MUTE | Boolean | Get, Set | | |
| ZONE-{ZID}.MUTE_ENABLE | Boolean | Get, Set | | |
| ZONE-{ZID}.SRC-{SID}.ENABLED | Boolean | Get, Set | | Limits selectable inputs |
| ZONE-{ZID}.DYN.SIGNAL | Float | Subscribe | dB | [-144, 20.0] — updated every 50ms |

> **Note:** `ZONE-{ZID}.GAIN` is Read-Only if `ZONE-{ZID}.GPIO_VC` is set on the zone.

**Examples:**

```
>> GET ZONE.COUNT
<< +ZONE.COUNT 2

>> SET ZONE-A.NAME "Bar"
<< *SET ZONE-A.NAME "Bar"

>> SET ZONE-A.PRIMARY_SRC 100
<< *SET ZONE-A.PRIMARY_SRC 100

>> SET ZONE-A.GAIN -20.0
<< *SET ZONE-A.GAIN -20.0

>> SET ZONE-A.MUTE 1
<< *SET ZONE-A.MUTE 1

>> SET ZONE-A.SRC-100.ENABLED 0
<< *SET ZONE-A.SRC-100.ENABLED 0
```

---

#### 5.2.7 Zone Ducker Registers

| Register Name | Type | Access | Unit | Range |
|---------------|------|--------|------|-------|
| ZONE-{ZID}.DUCK.MODE | Enum | Get, Set | | `{OFF, DUCKER, OVERRIDE}` |
| ZONE-{ZID}.DUCK.AUTO | Boolean | Get, Set | | |
| ZONE-{ZID}.DUCK.THRESHOLD | Float | Get, Set | dB | [-80, 0] |
| ZONE-{ZID}.DUCK.DEPTH | Float | Get, Set | dB | [-144, 0] |
| ZONE-{ZID}.DUCK.ATTACK | Float | Get, Set | sec | [0.001, 0.2] |
| ZONE-{ZID}.DUCK.RELEASE | Float | Get, Set | sec | [0.010, 10.0] |
| ZONE-{ZID}.DUCK.HOLD | Float | Get, Set | sec | [0, 10] |
| ZONE-{ZID}.DUCK.OVERRIDE_GAIN | Float | Get, Set | dB | [-60, 15] |
| ZONE-{ZID}.DUCK.OVERRIDE_GAIN_ENABLE | Boolean | Get, Set | | |

##### DUCK.MODE Values

| Value | Description |
|-------|-------------|
| `OFF` | Ducker is Off |
| `DUCKER` | Ducking Mode |
| `OVERRIDE` | Input Override Mode |

**Examples:**

```
>> SET ZONE-A.DUCK.MODE OVERRIDE
<< *SET ZONE-A.DUCK.MODE 1

>> SET ZONE-A.DUCK.THRESHOLD -5
<< *SET ZONE-A.DUCK.THRESHOLD -5

>> SET ZONE-A.DUCK.ATTACK 0.1
<< *SET ZONE-A.DUCK.ATTACK 0.1

>> SET ZONE-A.DUCK.RELEASE 1.0
<< *SET ZONE-A.DUCK.RELEASE 1.0

>> SET ZONE-A.DUCK.OVERRIDE_GAIN -20
<< *SET ZONE-A.DUCK.OVERRIDE_GAIN -20
```

---

#### 5.2.8 Zone Compressor Registers

| Register Name | Type | Access | Unit | Range |
|---------------|------|--------|------|-------|
| ZONE-{ZID}.COMPRESSOR.AUTO | Boolean | Get, Set | | Auto parameters based on crossover freq |
| ZONE-{ZID}.COMPRESSOR.THRESHOLD | Float | Get, Set | dBFS | [-40, 20] |
| ZONE-{ZID}.COMPRESSOR.ATTACK | Float | Get, Set | sec | [0.0003, 0.050] |
| ZONE-{ZID}.COMPRESSOR.RELEASE | Float | Get, Set | sec | [0.001, 1.0] |
| ZONE-{ZID}.COMPRESSOR.HOLD | Float | Get, Set | sec | [0, 1] |
| ZONE-{ZID}.COMPRESSOR.RATIO | Float | Get, Set | | [1, 50] |
| ZONE-{ZID}.COMPRESSOR.KNEE | Float | Get, Set | dB | [0, 12] |
| ZONE-{ZID}.COMPRESSOR.BYPASS | Boolean | Get, Set | | 0 = enabled, 1 = disabled |

**Examples:**

```
>> SET ZONE-A.COMPRESSOR.AUTO 0
<< *SET ZONE-A.COMPRESSOR.AUTO 0

>> SET ZONE-A.COMPRESSOR.THRESHOLD -10
<< *SET ZONE-A.COMPRESSOR.THRESHOLD -10

>> SET ZONE-A.COMPRESSOR.RATIO 12
<< *SET ZONE-A.COMPRESSOR.RATIO 12

>> SET ZONE-A.COMPRESSOR.BYPASS 0
<< *SET ZONE-A.COMPRESSOR.BYPASS 0
```

---

#### 5.2.9 Output Registers

| Register Name | Type | Access | Unit | Range |
|---------------|------|--------|------|-------|
| OUTPUT.COUNT | Integer | Get | | OID in [1, .COUNT] |
| OUT-{OID}.NAME | String[32] | Get, Set | | |
| OUT-{OID}.SRC | String[1] | Get, Set | | ZID |
| OUT-{OID}.SRC_CHANNEL | Enum | Get, Set | | `{L, R, S}` |
| OUT-{OID}.POLARITY | Integer | Get, Set | | `{1, -1}` |
| OUT-{OID}.OUTPUT_MODE | Enum | Get, Set | | `{OFF, 8R, 70V, 100V, BTL}` |
| OUT-{OID}.OUTPUT_HIGHPASS | Float | Get, Set | Hz | `{0, [20-1000)}` |
| OUT-{OID}.GAIN | Float | Get, Set | dB | [-30.0, 15.0] |
| OUT-{OID}.MUTE | Boolean | Get, Set | | |
| OUT-{OID}.DYN.SIGNAL | Float | Subscribe | dB | [-144, 20.0] — updated every 50ms |
| OUT-{OID}.DYN.CLIP | Boolean | Subscribe | | DAC clipping — updated every 50ms |

##### OUT-{OID}.SRC_CHANNEL Values

| Value | Description |
|-------|-------------|
| `L` | Left Channel Only |
| `R` | Right Channel Only |
| `S` | Sum of Left and Right Channels |

##### OUT-{OID}.OUTPUT_MODE Values

| Value | Description |
|-------|-------------|
| `OFF` | Output is Off |
| `8R` | Output is LowZ |
| `70V` | Output is HiZ 70 Volt |
| `100V` | Output is HiZ 100 Volt |
| `BTL` | Output is Bridged *(not supported for all models)* |

**Examples:**

```
>> GET OUTPUT.COUNT
<< +OUT.COUNT 2

>> SET OUT-1.NAME "Left Speaker"
<< *SET OUT-1.NAME "Left Speaker"

>> SET OUT-1.SRC B
<< *SET OUT-1.SRC B

>> SET OUT-1.SRC_CHANNEL L
<< *SET OUT-1.SRC_CHANNEL L

>> SET OUT-1.POLARITY -1
<< *SET OUT-1.POLARITY -1

>> SET OUT-1.OUTPUT_MODE "100V"
<< *SET OUT-1.OUTPUT_MODE "100V"

>> SET OUT-1.OUTPUT_HIGHPASS 80
<< *SET OUT-1.OUTPUT_HIGHPASS 80

>> SET OUT-1.GAIN 1
<< *SET OUT-1.GAIN 1.0

>> SET OUT-1.MUTE 1
<< *SET OUT-1.MUTE 1
```

---

#### 5.2.10 Output Delay Registers

| Register Name | Type | Access | Unit | Range |
|---------------|------|--------|------|-------|
| OUT-{OID}.DELAY.TIME | Float | Get, Set | sec | [0.0, 0.1] |
| OUT-{OID}.DELAY.BYPASS | Boolean | Get, Set | | |

**Examples:**

```
>> SET OUT-1.DELAY.TIME 0.01
<< *SET OUT-1.DELAY.TIME 0.01

>> SET OUT-1.DELAY.BYPASS 0
<< *SET OUT-1.DELAY.BYPASS 0
```

---

#### 5.2.11 Generator Registers

| Register Name | Type | Access | Unit | Range |
|---------------|------|--------|------|-------|
| GENERATOR.TYPE | Enum | Get, Set | | `{PINK, SINE}` |
| GENERATOR.SINE.FREQ | Float | Get, Set | Hz | [20, 20000] |
| GENERATOR.PINK.LPF_ENABLE | Boolean | Get, Set | | |
| GENERATOR.PINK.LPF_FREQ | Float | Get, Set | Hz | [20, 20000] |
| GENERATOR.PINK.HPF_ENABLE | Boolean | Get, Set | | |
| GENERATOR.PINK.HPF_FREQ | Float | Get, Set | Hz | [20, 20000] |

##### GENERATOR.TYPE Values

| Value | Description |
|-------|-------------|
| `PINK` | Pink Noise Generator |
| `SINE` | Sine Generator |

**Examples:**

```
>> SET GENERATOR.TYPE PINK
<< *SET GENERATOR.TYPE PINK

>> SET GENERATOR.SINE.FREQ 1200
<< *SET GENERATOR.SINE.FREQ 1200

>> SET GENERATOR.PINK.LPF_ENABLE 1
<< *SET GENERATOR.PINK.LPF_ENABLE 1

>> SET GENERATOR.PINK.LPF_FREQ 1000
<< *SET GENERATOR.PINK.LPF_FREQ 1000

>> SET GENERATOR.PINK.HPF_ENABLE 1
<< *SET GENERATOR.PINK.HPF_ENABLE 1

>> SET GENERATOR.PINK.HPF_FREQ 1000
<< *SET GENERATOR.PINK.HPF_FREQ 1000
```

---

#### 5.2.12 Advanced Registers

> **Note:** Please contact your manufacturer for help integrating the advanced APIs described below.

##### 5.2.12.1 Mix Registers

| Register Name | Type | Access | Unit | Range |
|---------------|------|--------|------|-------|
| MIX.COUNT | Integer | Get | | |
| MIX-{MID}.NAME | String | Get, Set | | |
| MIX-{MID}.GAIN-{SID} | Float | Get, Set | dB | [-80, 0] |

##### 5.2.12.2 Output Speaker Preset

| Register Name | Type | Access |
|---------------|------|--------|
| OUT-{OID}.PRESET.NAME | String | Get |
| OUT-{OID}.PRESET.ID | String | Get |
| OUT-{OID}.PRESET.LOCKED | Boolean | Get |
| OUT-{OID}.PRESET.CUSTOMIZED | Boolean | Get |
| OUT-{OID}.POLARITY.PROTECTED | Boolean | Get |
| OUT-{OID}.OUTPUT_MODE.PROTECTED | Boolean | Get |
| OUT-{OID}.SPEAKER_DELAY.PROTECTED | Boolean | Get |
| OUT-{OID}.LIMITER.PROTECTED | Boolean | Get |
| OUT-{OID}.SPEAKER_EQ.PROTECTED | Boolean | Get |
| OUT-{OID}.XR.PROTECTED | Boolean | Get |
| OUT-{OID}.FIR.PROTECTED | Boolean | Get |

##### 5.2.12.3 Output Speaker Delay Registers

| Register Name | Type | Access | Unit | Range |
|---------------|------|--------|------|-------|
| OUT-{OID}.SPEAKER_DELAY.TIME | Float | Get, Set | sec | [0.0, 0.01] |
| OUT-{OID}.SPEAKER_DELAY.BYPASS | Boolean | Get, Set | | |

##### 5.2.12.4 Output Peak Limiter Registers

| Register Name | Type | Access | Unit | Range |
|---------------|------|--------|------|-------|
| OUT-{OID}.PEAK_LIMITER.BYPASS | Boolean | Get, Set | | |
| OUT-{OID}.PEAK_LIMITER.AUTO | Boolean | Get, Set | | |
| OUT-{OID}.PEAK_LIMITER.THRESHOLD | Float | Get, Set | Vpeak | [1, 200] |
| OUT-{OID}.PEAK_LIMITER.ATTACK | Float | Get, Set | sec | [0.0008, 0.100] |
| OUT-{OID}.PEAK_LIMITER.RELEASE | Float | Get, Set | sec | [0.004, 2.0] |
| OUT-{OID}.PEAK_LIMITER.HOLD | Float | Get, Set | sec | [0, 1.0] |
| OUT-{OID}.PEAK_LIMITER.KNEE | Float | Get, Set | dB | [0, 6.0] |

##### 5.2.12.5 Output RMS Limiter Registers

| Register Name | Type | Access | Unit | Range |
|---------------|------|--------|------|-------|
| OUT-{OID}.RMS_LIMITER.BYPASS | Boolean | Get, Set | | |
| OUT-{OID}.RMS_LIMITER.THRESHOLD | Float | Get, Set | Vpeak | [1, 150] |
| OUT-{OID}.RMS_LIMITER.ATTACK | Float | Get, Set | sec | [0.010, 30] |
| OUT-{OID}.RMS_LIMITER.RELEASE | Float | Get, Set | sec | [0.010, 30] |
| OUT-{OID}.RMS_LIMITER.HOLD | Float | Get, Set | sec | [0, 1.0] |
| OUT-{OID}.RMS_LIMITER.KNEE | Float | Get, Set | dB | [0, 6.0] |

##### 5.2.12.6 Output Clip Limiter Registers

| Register Name | Type | Access | Range |
|---------------|------|--------|-------|
| OUT-{OID}.CLIP_LIMITER.BYPASS | Boolean | Get, Set | |
| OUT-{OID}.CLIP_LIMITER.MODE | Enum | Get, Set | `{NORMAL, FAST}` |

##### 5.2.12.7 Output EQ Registers

| Register Name | Type | Access | Unit | Range |
|---------------|------|--------|------|-------|
| OUT.EQ.COUNT | Integer | Get | | EID in [1, .COUNT] |
| OUT-{OID}.EQ.BYPASS | Boolean | Get, Set | | |
| OUT-{OID}.EQ-{EID}.TYPE | Enum | Get, Set | | `{PARAMETRIC, LOWPASS_6, HIGHPASS_6, LOWPASS_12, HIGHPASS_12, LOW_SHELF, LOW_SHELF_Q, LOW_SHELF_6, LOW_SHELF_12, HIGH_SHELF, HIGH_SHELF_Q, HIGH_SHELF_6, HIGH_SHELF_12, BANDPASS, NOTCH, ALLPASS_1, ALLPASS_2}` |
| OUT-{OID}.EQ-{EID}.GAIN | Float | Get, Set | dB | [-15, 15] |
| OUT-{OID}.EQ-{EID}.FREQ | Float | Get, Set | Hz | [20, 20000] |
| OUT-{OID}.EQ-{EID}.Q | Float | Get, Set | | [0.4, 30] |
| OUT-{OID}.EQ-{EID}.BYPASS | Boolean | Get, Set | | |

##### 5.2.12.8 Output Speaker EQ Registers

| Register Name | Type | Access | Unit | Range |
|---------------|------|--------|------|-------|
| OUT.SPEAKER_EQ.COUNT | Integer | Get | | EID in [1, .COUNT] |
| OUT-{OID}.SPEAKER_EQ.BYPASS | Boolean | Get, Set | | |
| OUT-{OID}.SPEAKER_EQ-{EID}.TYPE | Enum | Get, Set | | `{PARAMETRIC, LOWPASS_6, HIGHPASS_6, LOWPASS_12, HIGHPASS_12, LOW_SHELF_6, LOW_SHELF_12, HIGH_SHELF, HIGH_SHELF_Q, HIGH_SHELF_6, HIGH_SHELF_12, BANDPASS, NOTCH, ALLPASS_1, ALLPASS_2}` |
| OUT-{OID}.SPEAKER_EQ-{EID}.GAIN | Float | Get, Set | dB | [-15, 15] |
| OUT-{OID}.SPEAKER_EQ-{EID}.FREQ | Float | Get, Set | Hz | [20, 20000] |
| OUT-{OID}.SPEAKER_EQ-{EID}.Q | Float | Get, Set | | [0.4, 30] |
| OUT-{OID}.SPEAKER_EQ-{EID}.BYPASS | Boolean | Get, Set | | |

##### 5.2.12.9 Output Crossover Registers

| Register Name | Type | Access | Unit | Range |
|---------------|------|--------|------|-------|
| OUT-{OID}.XR.BYPASS | Boolean | Get, Set | | |
| OUT-{OID}.XR.GAIN | Float | Get, Set | dB | [-15, 15] |
| OUT-{OID}.XR.LOWPASS_TYPE | Enum | Get, Set | | `{OFF, BUT6, BUT12, BUT18, BUT24, BUT48, BES12, BES24, BES48, LR12, LR24, LR36, LR48}` |
| OUT-{OID}.XR.LOWPASS_FREQUENCY | Float | Get, Set | Hz | [20, 20000] |
| OUT-{OID}.XR.HIGHPASS_TYPE | Enum | Get, Set | | `{OFF, BUT6, BUT12, BUT18, BUT24, BUT48, BES12, BES24, BES48, LR12, LR24, LR36, LR48}` |
| OUT-{OID}.XR.HIGHPASS_FREQUENCY | Float | Get, Set | Hz | [20, 20000] |

##### 5.2.12.10 Output FIR

| Register Name | Type | Access | Unit | Range |
|---------------|------|--------|------|-------|
| OUT-{OID}.FIR.BYPASS | Boolean | Get, Set | | |
| OUT-{OID}.FIR.TAPS | Integer | Get | | [0, 512] |

##### 5.2.12.11 Output Routing Registers

| Register Name | Type | Access | Unit | Range |
|---------------|------|--------|------|-------|
| ROUT-{RID}.SRC | Integer | Get | | |
| ROUT-{RID}.SRC_CHANNEL | String | Get, Set | | `{S, L, R}` |
| ROUT-{RID}.GAIN | Float | Get, Set | dB | [-80, 0] |

##### 5.2.12.12 Analog Volume Control Registers

| Register Name | Type | Access | Unit | Range |
|---------------|------|--------|------|-------|
| VC.COUNT | Integer | Get | | VID in [1, VC.Count] |
| VC-{VID}.NAME | String | Get | | |
| VC-{VID}.VALUE | Float | Get | % | [0, 100] |

##### 5.2.12.13 Power Management Registers

| Register Name | Type | Access | Unit | Range |
|---------------|------|--------|------|-------|
| SETUP.POWER.POWER_ON | Enum | Get, Set | | `{AUDIO, AUDIO_ECO, TRIGGER, TRIGGER_ECO, NETWORK, AUDIO_DSP}` |
| SETUP.POWER.MUTE_TIME | Integer | Get, Set | sec | [0, 3600] |
| SETUP.POWER.STANDBY_TIME | Integer | Get, Set | sec | [0, 3600] |

##### 5.2.12.14 GPIO Registers

| Register Name | Type | Access | Range |
|---------------|------|--------|-------|
| SETUP.GPIO.PIN2 | Enum | Get, Set | `{OFF, STANDBY_NO, STANDBY_NC, MUTE_NO, MUTE_NC}` |
| SETUP.GPIO.PIN4 | Enum | Get, Set | `{OFF, VOLUME_CONTROL}` |
| SETUP.GPIO.PIN5 | Enum | Get, Set | `{OFF, VOLUME_CONTROL}` |
| SETUP.GPIO.PIN6 | Enum | Get, Set | `{OFF, VOLUME_CONTROL, TRIGGER_12V_IN}` |
| SETUP.GPIO.PIN7 | Enum | Get, Set | `{OFF, VOLUME_CONTROL, TRIGGER_12V_OUT}` |
| SETUP.GPIO.PIN8 | Enum | Get, Set | `{VCC_3V3}` |

##### 5.2.12.15 LAN Registers

| Register Name | Type | Access | Range |
|---------------|------|--------|-------|
| SETUP.LAN.NETWORK_MODE | Enum | Get *(Read Only)* | `{STATIC, DHCP}` |
| SETUP.LAN.IP | String | Get *(Read Only)* | |
| SETUP.LAN.MASK | String | Get *(Read Only)* | |
| SETUP.LAN.GATEWAY | String | Get *(Read Only)* | |
| SETUP.LAN.DNS1 | String | Get *(Read Only)* | |
| SETUP.LAN.DNS2 | String | Get *(Read Only)* | |

##### 5.2.12.16 WiFi Registers

| Register Name | Type | Access | Unit | Range |
|---------------|------|--------|------|-------|
| SETUP.WIFI.ENABLE | Boolean | Get *(Read Only)* | | |
| SETUP.WIFI.DISABLE_LAN_CONNECTED | Boolean | Get *(Read Only)* | | |
| SETUP.WIFI.DISABLE_AFTER | Float | Get *(Read Only)* | sec | [0, 3600] |
| SETUP.WIFI.MODE | Enum | Get *(Read Only)* | | `{AP, STA}` |
| SETUP.WIFI.AP_SSID | String | Get *(Read Only)* | | |
| SETUP.WIFI.AP_PASS | String | Get *(Read Only)* | | |
| SETUP.WIFI.STA_SSID | String | Get *(Read Only)* | | |
| SETUP.WIFI.STA_PASS | String | Get *(Read Only)* | | |

##### 5.2.12.17 Security Registers

| Register Name | Type | Access |
|---------------|------|--------|
| SYSTEM.SECURITY.PASSWORD_ENABLE | Boolean | Get, Set |
| SYSTEM.SECURITY.PASSWORD_HASH | String | Get, Set |

##### 5.2.12.18 Dante Registers

| Register Name | Type | Access |
|---------------|------|--------|
| SYSTEM.DANTE.SOFTWARE_VERSION | String | Get, Set |
| SYSTEM.DANTE.FIRMWARE_VERSION | String | Get, Set |
| SYSTEM.DANTE.IP | String | Get, Set |
| SYSTEM.DANTE.MAC | String | Get, Set |
| SYSTEM.DANTE.LINK_SPEED | Float | Get, Set |
| SYSTEM.DANTE.AES67_ENABLED | String | Get, Set |
| SYSTEM.DANTE.DEVICE_NAME | String | Get, Set |
| SYSTEM.DANTE.ENCODING | String | Get, Set |
| SYSTEM.DANTE.SAMPLE_RATE | Float | Get, Set |
| SYSTEM.DANTE.CLOCK_STATE | String | Get, Set |
| SYSTEM.DANTE.MUTE_STATE | String | Get, Set |

---

*End of Document — Blaze Open API for Installers v1.6*
