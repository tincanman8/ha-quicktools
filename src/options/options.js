const hostInput = document.getElementById('ha-host');
const ytWebhookInput = document.getElementById('yt-webhook-id');
const clipWebhookInput = document.getElementById('clip-webhook-id');
const saveButton = document.getElementById('save');
const status = document.getElementById('status');

// Load saved settings
browser.storage.sync.get(['haHost', 'webhookId', 'ytWebhookId', 'clipWebhookId']).then((result) => {
  if (result.haHost) hostInput.value = result.haHost;
  if (result.ytWebhookId) {
    ytWebhookInput.value = result.ytWebhookId;
  } else if (result.webhookId) {
    ytWebhookInput.value = result.webhookId; // fallback to existing ID
  }
  if (result.clipWebhookId) clipWebhookInput.value = result.clipWebhookId;
});

// Save settings
saveButton.addEventListener('click', () => {
  const haHost = hostInput.value.trim().replace(/\/$/, '');
  const ytWebhookId = ytWebhookInput.value.trim();
  const clipWebhookId = clipWebhookInput.value.trim();

  browser.storage.sync.set({ haHost, ytWebhookId, clipWebhookId }).then(() => {
    status.classList.add('show');
    setTimeout(() => status.classList.remove('show'), 2000);
  });
});