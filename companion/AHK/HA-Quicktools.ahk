#Requires AutoHotkey v2.0

; ==============================================================================
; Configuration
; ==============================================================================

;sunshineUser 						:= "bigwass"
;sunshinePass 						:= "amarmasalmeh"
;tvUuid       						:= "76937906-CC79-D128-8A9C-CC55014B4931"
;tvName       						:= "DESKTOP-KINFPTM"
;haBaseUrl 							:= "http://192.168.1.166:8123/"
;clipboardAutomationWebhookId 		:= "-1W7q56JzQydahcNbF0mXstsX"
;TVasMonitorWebhookId 				:= "-hEnSpjF4PvRuI9iIpbsvDdzN"

; Specify path to configuration file (assumes config.ini is in the same folder)
ConfigFile := A_ScriptDir "\config.ini"

; Verify config file exists before proceeding
if !FileExist(ConfigFile) {
    MsgBox("Configuration file not found: " . ConfigFile, "Error", 16)
    ExitApp()
}

; --- Load Configuration Values ---

; Sunshine Credentials
SunshineUser := IniRead(ConfigFile, "Sunshine", "Username", "")
SunshinePass := IniRead(ConfigFile, "Sunshine", "Password", "")

; Moonlight Target Info
MoonlightDeviceUUID := IniRead(ConfigFile, "Moonlight", "HostUUID", "")
MoonlightDeviceName := IniRead(ConfigFile, "Moonlight", "HostName", "")

; Home Assistant Endpoints
HABaseURL             	:= IniRead(ConfigFile, "HomeAssistant", "BaseURL", "")
PhoneClipboardWebhookID := IniRead(ConfigFile, "HomeAssistant", "PhoneClipboardWebhookID", "")
TVMonitorWebhookID     	:= IniRead(ConfigFile, "HomeAssistant", "TVMonitorWebhookID", "")

; ==============================================================================
; Hotkeys
; ==============================================================================

; --- Hotkey: Win + Shift + C (Send Selected Text to Phone via HA) ---
+#c::
{
    clipSaved := ClipboardAll()

    A_Clipboard := ""
    Send("^c")
    
    if !ClipWait(1) {
        ToolTip("No text selected!")
        SetTimer(() => ToolTip(), -1500)
        A_Clipboard := clipSaved
        return
    }

    selectedText := A_Clipboard
    A_Clipboard := clipSaved
    clipSaved := ""

    ; Escape string for JSON
    cleanText := StrReplace(selectedText, "\", "\\")
    cleanText := StrReplace(cleanText, '"', '\"')
    cleanText := StrReplace(cleanText, "`n", "\n")
    cleanText := StrReplace(cleanText, "`r", "\r")
    cleanText := StrReplace(cleanText, "`t", "\t")

    payload := '{"payloadType": "text", "payloadData": "' . cleanText . '"}'

    send_ha_webhook(PhoneClipboardWebhookID, payload, "Sent to S24 Ultra!")
}

; --- Hotkey: Win + Shift + K (Toggle Moonlight/Sunshine Session) ---
#+k::
{
    clientState := get_sunshine_client_state(SunshineUser, SunshinePass)

    if (clientState = "CONNECTED") {
        ; --- CLIENT IS CONNECTED -> SEND QUIT & DEACTIVATE ---
        quitCmd := Format('curl.exe -k -u "{1}:{2}" "https://localhost:47990/api/apps/close" -X POST', SunshineUser, SunshinePass)
        RunWait(quitCmd, "", "Hide")

        payload := '{"uuid": "' . MoonlightDeviceUUID . '", "name": "' . MoonlightDeviceName . '", "action": "deactivate"}'
        send_ha_webhook(TVMonitorWebhookID, payload, "Deactivated monitor!")
    } else {
        ; --- CLIENT IS DISCONNECTED -> ACTIVATE VIA HA WEBHOOK ---
        payload := '{"uuid": "' . MoonlightDeviceUUID . '", "name": "' . MoonlightDeviceName . '", "action": "activate"}'
        send_ha_webhook(TVMonitorWebhookID, payload, "Activated monitor!")
    }
}

; ==============================================================================
; Helper Functions
; ==============================================================================

; Fetch and parse Sunshine log to determine current client connection status
get_sunshine_client_state(user, pass) {
    logCmd := Format('curl.exe -s -k -u "{1}:{2}" "https://localhost:47990/api/logs"', user, pass)
    exec := ComObject("WScript.Shell").Exec(A_ComSpec . ' /c ' . logCmd)
    logData := exec.StdOut.ReadAll()

    lines := StrSplit(logData, "`n", "`r")
    
    Loop lines.Length {
        currentLine := lines[lines.Length - A_Index + 1]

        if InStr(currentLine, "Executing Do Cmd") {
            return "CONNECTED"
        }
        if InStr(currentLine, "Executing Undo Cmd") {
            return "DISCONNECTED"
        }
    }

    return "DISCONNECTED"
}

; Send a JSON payload to Home Assistant via Webhook ID
send_ha_webhook(webhook_id, json_payload, success_msg := "Sent to Home Assistant!") {
    fullUrl   := HABaseURL . "api/webhook/" . webhook_id

    req := ComObject("MSXML2.XMLHTTP")
    req.open("POST", fullUrl, false)  ; Synchronous execution
    req.setRequestHeader("Content-Type", "application/json")

    try {
        req.send(json_payload)
        if (req.status == 200 || req.status == 204) {
            ToolTip(success_msg)
            SetTimer(() => ToolTip(), -2000)
        } else {
            ToolTip("Error: HTTP " . req.status)
            SetTimer(() => ToolTip(), -3000)
        }
    } catch {
        ToolTip("Failed to connect to HA")
        SetTimer(() => ToolTip(), -3000)
    }
}