# ha-quicktools
Send YouTube links, text, links, or images directly to Home Assistant and Mobile Devices
=======
# HA QuickTools

HA QuickTools is a WebExtension designed for Firefox and Zen Browser. It adds native context menu integrations and embedded YouTube controls to dispatch links, selected text, images, or media streams directly to Home Assistant webhooks and mobile device clipboards.

---

## Features

- Context Menu Integration: Right-click menu tree to send links, highlighted text, or images straight to your mobile device clipboard via Home Assistant webhooks.
- Embedded YouTube Action Pill: Injects a native-styled action button into the YouTube watch metadata menu.
- Media Dispatching Options:
  - Play on TV: Dispatches the current YouTube URL to Home Assistant for media player casting.
  - Send to Phone: Copies the active URL directly to your phone's clipboard.
  - Dynamic Timestamping: Toggles timestamps (?t=Xs) conditionally using an interactive inline checkbox when past 0s.
- Responsive Themeing: Clean, high-contrast dark UI modeled after YouTube's dark mode palette.

---

## Prerequisites

- Home Assistant: A running instance accessible on your local network (or remote via Nginx Proxy Manager/Cloudflare).
- Android Companion Setup:
  - Tasker installed on target Android device.
  - AutoNotification plugin (by joaomgcd) installed on target Android device.
- Webhooks Configured: Two active webhooks inside Home Assistant:
  1. TV Webhook: Accepts application/x-www-form-urlencoded POST requests containing url.
  2. Phone Clipboard Webhook: Accepts application/json POST requests containing { "text": "payload" }.

---

## Tasker & AutoNotification Setup (Phone Clipboard Integration)

To parse incoming webhook notifications from Home Assistant and write them to your Android device clipboard automatically:

### 1. Install Required Android Apps
- Tasker
- AutoNotification (Google Play Store or AutoApps ecosystem)

### 2. Home Assistant Automation Setup
Configure Home Assistant to send a persistent notification to your phone whenever the Phone Webhook is triggered:

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
	  
### 3. Tasker Setup (Clipboard Sync)

To import the Tasker Profile and Task into your mobile device:

1. Download [`Clipboard_from_Computer.prf.xml`](./tasker/Clipboard_from_Computer.prf.xml).
2. Open **Tasker** on your Android device.
3. Long-press the **Profiles** tab header -> Select **Import Profile**.
4. Select the downloaded `.prf.xml` file.

#### Profile Overview:
- **Trigger:** Intercepts notifications from `io.homeassistant.companion.android` titled `CLIPBOARD_SYNC`.
- **Image URL Handling:** Matches image regex `^https?://.\.(png|jpg|jpeg|webp|gif)(\?.)?$`, downloads to `/storage/emulated/0/Download/temp_clip.png`, and sets image to device clipboard.
- **Text/URL Handling:** Directly copies non-image string payloads to clipboard.
- **Auto-Dismiss:** Uses AutoNotification to automatically cancel the notification post-execution.

---

## WebExtension Installation

### Manual Loading in Firefox / Zen Browser

1. Clone or download this repository:
   git clone https://github.com/your-username/ha-quicktools.git

2. Open your browser and navigate to about:debugging#/runtime/this-firefox.
3. Click Load Temporary Add-on....
4. Select the manifest.json file inside the cloned directory.

---

## Configuration

1. Click the HA QuickTools icon in your browser options or navigate to about:addons -> HA QuickTools -> Preferences.
2. Define your parameters:
   - Home Assistant Host: e.g., http://homeassistant.home:8123
   - Phone Clipboard Webhook ID: Your designated HA webhook identifier.
   - TV Webhook ID: Your designated TV player webhook identifier.
3. Click Save Configuration.

---

## Development & Architecture

- manifest.json: Manifest V3 extension configuration specifying host permissions and background script handlers.
- background.js: Controls context menu construction, message passing runtime listeners, base64 image conversion, and HTTP fetch requests to HA endpoints.
- content.js: Injects custom button view-models into YouTube's DOM layout and renders floating overlay popups for target selection.
- style.css: Provides fallback layout overrides for injected DOM targets.

---

## License

Distributed under the MIT License. See LICENSE for details.
