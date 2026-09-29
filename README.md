# HA QuickTools

HA QuickTools is a browser extension and desktop automation suite designed for Firefox and Zen Browser. It adds native context menu integrations and embedded YouTube controls to dispatch links, selected text, images, or media streams directly to Home Assistant webhooks, mobile device clipboards, or toggle your TV as a second monitor via Sunshine and Moonlight.

---

## Features

- **Context Menu Integration:** Right-click menu tree to send links, highlighted text, or images straight to your mobile device clipboard via Home Assistant webhooks.
- **Embedded YouTube Action Pill:** Injects a native-styled action button into the YouTube watch metadata menu.
- **Media & Display Automation:**
  - **TV as Second Monitor:** Toggle your TV as an extended virtual desktop monitor via Sunshine, Moonlight, and AutoHotkey.
  - **Play on TV:** Dispatches the current YouTube URL to Home Assistant for media player casting.
  - **Send to Phone:** Copies the active URL directly to your phone's clipboard.
  - **Dynamic Timestamping:** Toggles timestamps (`?t=Xs`) conditionally using an interactive inline checkbox when past 0s.
- **Responsive Themeing:** Clean, high-contrast dark UI modeled after YouTube's dark mode palette.

---

## Prerequisites

- **Home Assistant:** A running instance accessible on your local network (or remote via proxy/Cloudflare).
- **Android Companion Setup:**
  - Tasker installed on target Android device.
  - AutoNotification plugin (by joaomgcd) installed on target Android device.
- **TV & PC Automation Setup:**
  - Sunshine installed on host PC and Moonlight installed on client device/TV.
  - AutoHotkey v2 installed on host PC.
- **Webhooks Configured:** Three active webhooks inside Home Assistant:
  1. **Phone Clipboard Webhook:** Accepts `application/json` POST requests containing `{ "text": "payload" }`.
  2. **TV Webhook:** Accepts `application/x-www-form-urlencoded` POST requests containing `url`.
  3. **TV as Monitor Webhook:** Accepts trigger requests to launch/terminate the PC stream session.

---

## Setup Instructions

### 1. Sunshine & Moonlight Setup (TV as Second Monitor)

Follow these steps to configure your host PC and client TV to use a virtual secondary display.

1. **Initial Pairing:**
   - Install Sunshine on your host PC and Moonlight on your TV.
   - Create a Sunshine admin account (purely local).
   - Pair Moonlight with Sunshine following the standard pairing process (both must be on the same local network).
   - Note down your host computer name and UUID from Moonlight.
   - Test the stream to verify connection (it will duplicate your main screen initially).

2. **Virtual Display Driver Installation:**
   - Download `VDDControl.exe` from [Virtual-Display-Driver Releases](https://github.com/VirtualDrivers/Virtual-Display-Driver/releases).
   - Download `MultiMonitorTool.exe` from [NirSoft MultiMonitorTool](https://www.nirsoft.net/utils/multi_monitor_tool.html).
   - Extract and run `VDDControl.exe` to install the driver.
   - Move `MultiMonitorTool.exe` into the created driver directory (typically `C:\VirtualDisplayDriver\`).
   - Enable the driver using PowerShell (required for step 3):
     ```powershell
     Get-PnpDevice -InstanceId 'ROOT\DISPLAY\0002' | Enable-PnpDevice -Confirm:$false
     ```
     *(To disable manually later: `Get-PnpDevice -InstanceId 'ROOT\DISPLAY\0002' | Disable-PnpDevice -Confirm:$false`)*

3. **Display Configuration:**
   - Open Windows **Display Settings** (Right-click desktop > Display Settings).
   - Position the new virtual monitor relative to your physical monitors where you want your TV space located.
   - Set multiple displays option to **"Extend these displays"**. Select your desired resolution and scale percentage.

4. **MultiMonitorTool Configuration Profiles:**
   - Run the following PowerShell command to save the active virtual display state:
     ```powershell
     C:\VirtualDisplayDriver\MultiMonitorTool.exe /SaveConfig C:\VirtualDisplayDriver\vdd_on.cfg
     ```
   - Launch `MultiMonitorTool.exe`, locate the virtual display adapter (scroll right to verify `Virtual Display Driver`), right-click it, and select **Disable Selected Monitors**.
   - Save the disabled configuration state via PowerShell:
     ```powershell
     C:\VirtualDisplayDriver\MultiMonitorTool.exe /SaveConfig C:\VirtualDisplayDriver\vdd_off.cfg
     ```

5. **Sunshine Display Automation:**
   - Enable the virtual display driver (`vdd_on.cfg`).
   - Open the Sunshine web UI and navigate to **Troubleshooting Logs**.
   - Locate the 36-character `device_id` string corresponding to your virtual display (e.g., `{44ec0e2b-434d-5e81-9693-564320468a80}`).
   - Go to **Configuration > Audio/Video > Display Id**, paste the device ID, and enable **"Activate the display automatically"** under Advanced Options.
   - Under **Resolution**, set **"Use manually entered resolution"** and enter the resolution chosen in Step 3. Save and apply settings.
   - Navigate to **Applications > Desktop > Edit > Command Preparations**:
     - **Do Command:**
       ```cmd
       C:\VirtualDisplayDriver\MultiMonitorTool.exe /LoadConfig C:\VirtualDisplayDriver\vdd_on.cfg; Start-Sleep -Milliseconds 10000
       ```
     - **Undo Command:**
       ```cmd
       C:\VirtualDisplayDriver\MultiMonitorTool.exe /LoadConfig C:\VirtualDisplayDriver\vdd_off.cfg
       ```
     - Save application settings.

---

### 2. AutoHotkey Script Setup

1. Locate the configuration template in `companion/AHK/config.ini.template`.
2. Make a copy of the file in the same directory and rename it to `config.ini`:
   - Path: `companion/AHK/config.ini`
3. Open `companion/AHK/config.ini` in a text editor and fill in your credentials:
   - **Sunshine Credentials:** Local admin `Username` and `Password`.
   - **Moonlight Target Info:** Host computer `HostUUID` and `HostName` as registered in Moonlight.
   - **Home Assistant Configuration:**
     - `BaseURL` (e.g., `http://homeassistant.local:8123`)
     - `PhoneClipboardWebhookID` ID
     - `TVMonitorWebhookID` ID
4. Save the file and launch the AutoHotkey script (`.ahk`).

---

### 3. Tasker & AutoNotification Setup (Phone Clipboard Integration)

To parse incoming webhook notifications from Home Assistant and write them to your Android device clipboard automatically:

#### Home Assistant Automation Setup
Configure Home Assistant to send a persistent notification to your phone whenever the Phone Webhook is triggered:

```yaml
alias: "HA QuickTools: Send to Phone Clipboard"
trigger:
  - platform: webhook
    webhook_id: YOUR_PHONE_CLIPBOARD_WEBHOOK_ID
    allowed_methods:
      - POST
    local_only: false
action:
  - service: notify.mobile_app_YOUR_DEVICE
    data:
      title: "HA_CLIPBOARD_SYNC"
      message: "{{ trigger_json.text }}"
```

#### Tasker Import
1. Download [`Clipboard_from_Computer.prf.xml`](./tasker/Clipboard_from_Computer.prf.xml).
2. Open **Tasker** on your Android device.
3. Long-press the **Profiles** tab header -> Select **Import Profile**.
4. Select the downloaded `.prf.xml` file.

**Profile Overview:**
- **Trigger:** Intercepts notifications from `io.homeassistant.companion.android` titled `CLIPBOARD_SYNC`.
- **Image URL Handling:** Matches image regex `^https?://.\.(png|jpg|jpeg|webp|gif)(\?.)?$`, downloads to `/storage/emulated/0/Download/temp_clip.png`, and sets image to device clipboard.
- **Text/URL Handling:** Directly copies non-image string payloads to clipboard.
- **Auto-Dismiss:** Uses AutoNotification to automatically cancel the notification post-execution.

---

## WebExtension Installation

### Manual Loading in Firefox / Zen Browser

1. Clone or download this repository:
   ```bash
   git clone [https://github.com/your-username/ha-quicktools.git](https://github.com/your-username/ha-quicktools.git)
2. Open your browser and navigate to `about:debugging#/runtime/this-firefox`.
3. Click **Load Temporary Add-on...**.
4. Select the `manifest.json` file inside the cloned directory.

---

## Extension Configuration

1. Click the HA QuickTools icon in your browser options or navigate to `about:addons` -> **HA QuickTools** -> **Preferences**.
2. Define your parameters:
   - **Home Assistant Host:** e.g., `http://homeassistant.local:8123`
   - **Phone Clipboard Webhook ID:** Your designated HA clipboard webhook identifier.
   - **TV Webhook ID:** Your designated TV player webhook identifier.
3. Click **Save Configuration**.

---

## Development & Architecture

- `manifest.json`: Manifest V3 extension configuration specifying host permissions and background script handlers.
- `background.js`: Controls context menu construction, message passing runtime listeners, base64 image conversion, and HTTP fetch requests to HA endpoints.
- `content.js`: Injects custom button view-models into YouTube's DOM layout and renders floating overlay popups for target selection.
- `style.css`: Provides fallback layout overrides for injected DOM targets.

---

## License

Distributed under the MIT License. See LICENSE for details.
