#Requires AutoHotkey v2.0

; Hotkey: Win + Shift + C
+#c::
{
    ; 1. Save the current clipboard and all its formatting data
    clipSaved := ClipboardAll()

    ; 2. Clear clipboard and capture the currently selected text
    A_Clipboard := ""
    Send("^c")
    
    ; Wait up to 1 second for text to load into the clipboard
    if !ClipWait(1) {
        ToolTip("No text selected!")
        SetTimer(() => ToolTip(), -1500)
        A_Clipboard := clipSaved  ; Restore original clipboard before exiting
        return
    }

    ; 3. Store the selected text and instantly restore your old clipboard
    selectedText := A_Clipboard
    A_Clipboard := clipSaved
    clipSaved := ""  ; Free up memory

    ; Configure your Home Assistant Endpoint
    haWebhookUrl := "http://192.168.1.166:8123/api/webhook/-1W7q56JzQydahcNbF0mXstsX"

    ; Prepare HTTP request
    req := ComObject("Msxml2.XMLHTTP")
    req.open("POST", haWebhookUrl, false)
    req.setRequestHeader("Content-Type", "application/json")

    ; Escape selected text string for JSON
    cleanText := StrReplace(selectedText, "\", "\\")
    cleanText := StrReplace(cleanText, '"', '\"')
    cleanText := StrReplace(cleanText, "`n", "\n")
    cleanText := StrReplace(cleanText, "`r", "\r")
    cleanText := StrReplace(cleanText, "`t", "\t")

    jsonPayload := '{"text": "' . cleanText . '"}'

    try {
        req.send(jsonPayload)
        if (req.status == 200 || req.status == 204) {
            ToolTip("Sent to S24 Ultra!")
        } else {
            ToolTip("Error: HTTP " . req.status)
        }
    } catch {
        ToolTip("Failed to connect to HA")
    }

    SetTimer(() => ToolTip(), -1500)
}
