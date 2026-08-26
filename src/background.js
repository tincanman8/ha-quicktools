// Register menus on install & startup
const createMenus = () => {
  browser.contextMenus.removeAll().then(() => {
    // Parent Submenu
    browser.contextMenus.create({
      id: "ha-quicktools-parent",
      title: "HA QuickTools",
      contexts: ["selection", "link", "image"]
    });

    // 1. Selected Text
    browser.contextMenus.create({
      id: "action-copy-text",
      parentId: "ha-quicktools-parent",
      title: "Copy Selected Text to Phone Clipboard",
      contexts: ["selection"]
    });

    // 2. YouTube Links -> Play on TV
    browser.contextMenus.create({
      id: "action-play-tv",
      parentId: "ha-quicktools-parent",
      title: "Play Video on TV",
      contexts: ["link"],
      targetUrlPatterns: [
        "*://www.youtube.com/watch?v=*",
        "*://youtube.com/watch?v=*",
        "*://youtu.be/*",
        "*://www.youtu.be/*"
      ]
    });
	
	// 3. YouTube Links -> Play on Phone
    browser.contextMenus.create({
      id: "action-play-phone",
      parentId: "ha-quicktools-parent",
      title: "Play Video on Phone",
      contexts: ["link"],
      targetUrlPatterns: [
        "*://www.youtube.com/watch?v=*",
        "*://youtube.com/watch?v=*",
        "*://youtu.be/*",
        "*://www.youtu.be/*"
      ]
    });

    // 4. Standard Links (Shows up for non-YouTube links)
    browser.contextMenus.create({
      id: "action-copy-link",
      parentId: "ha-quicktools-parent",
      title: "Copy Link URL to Phone Clipboard",
      contexts: ["link"]
    });

    // 5. Image Data
    browser.contextMenus.create({
      id: "action-copy-img",
      parentId: "ha-quicktools-parent",
      title: "Copy Image to Phone Clipboard",
      contexts: ["image"]
    });
  });
};

browser.runtime.onInstalled.addListener(createMenus);
browser.runtime.onStartup.addListener(createMenus);

// Helper to check YouTube URLs
const isYouTubeUrl = (url) => {
  if (!url) return false;
  return /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+$/.test(url);
};

// Send payload to HA Phone Webhook
const sendToPhone = (payloadData, payloadType = "text") => {
  browser.storage.sync.get(['haHost', 'clipWebhookId']).then((result) => {
    const haHost = result.haHost || 'http://homeassistant.home:8123';
    const webhookId = result.clipWebhookId || '-1W7q56JzQydahcNbF0mXstsX';
    const webhookUrl = `${haHost}/api/webhook/${webhookId}`;

    const payload = {
      payloadType: payloadType,
      payloadData: payloadData
    };

    fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    })
    .then(() => console.log(`Payload (${payloadType}) dispatched to HA phone webhook.`))
    .catch(err => console.error("Phone Sync fetch failed:", err));
  });
};

// Send YouTube URL to TV Webhook
const sendYouTubeToTV = (videoUrl) => {
  browser.storage.sync.get(['haHost', 'webhookId', 'ytWebhookId']).then((result) => {
    const haHost = result.haHost || 'http://homeassistant.home:8123';
    const webhookId = result.ytWebhookId || result.webhookId || '-xJ8-jc3CsddRskLGtGVPL3Gx';
    const webhookUrl = `${haHost}/api/webhook/${webhookId}`;

    const formData = new URLSearchParams();
    formData.append('url', videoUrl);

    fetch(webhookUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: formData.toString()
    });
  });
};

// Handle Context Menu Clicks
browser.contextMenus.onClicked.addListener((info) => {
  const cleanLink = info.linkUrl ? info.linkUrl.split('&t=')[0].split('?t=')[0] : null;

  switch (info.menuItemId) {
    case "action-play-tv":
      if (cleanLink) sendYouTubeToTV(cleanLink);
      break;

    case "action-copy-link":
      if (cleanLink) sendToPhone(cleanLink, "link");
      break;

    case "action-copy-text":
      if (info.selectionText) sendToPhone(info.selectionText, "text");
      break;

    case "action-copy-img":
	  if (info.srcUrl) sendToPhone(info.srcUrl, "image");
	  break;

    case "action-play-phone":
	  if (cleanLink) sendToPhone(cleanLink, "youtubevideo");
	  break;
  }
});

// Updated background listener to accept payloadType dynamically from content.js
browser.runtime.onMessage.addListener((message) => {
  if (message.type === "SEND_TO_HA") {
    sendYouTubeToTV(message.url);
  } else if (message.type === "SEND_TO_PHONE") {
    const payloadType = message.payloadType || "youtubevideo";
    sendToPhone(message.url, payloadType);
  }
});