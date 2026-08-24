const createMenu = (buttonElement) => {
  const existingMenu = document.getElementById('ha-timestamp-menu');
  if (existingMenu) {
    existingMenu.remove();
    return;
  }

  const videoElement = document.querySelector('video');
  const currentTime = videoElement ? Math.floor(videoElement.currentTime) : 0;

  const menu = document.createElement('div');
  menu.id = 'ha-timestamp-menu';
  
  // Base Container Styling
  menu.style.position = 'fixed';
  menu.style.backgroundColor = '#212121';
  menu.style.color = '#ffffff';
  menu.style.borderRadius = '12px';
  menu.style.padding = '8px 0';
  menu.style.boxShadow = '0 4px 20px rgba(0, 0, 0, 0.5)';
  menu.style.zIndex = '9999';
  menu.style.minWidth = '220px';
  menu.style.fontFamily = 'Roboto, Arial, sans-serif';

  // Centered Header Element
  const header = document.createElement('div');
  header.textContent = 'HA QuickTools';
  header.style.padding = '6px 16px 8px 16px';
  header.style.fontSize = '12px';
  header.style.fontWeight = '600';
  header.style.color = '#aaaaaa';
  header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
  header.style.marginBottom = '4px';
  header.style.textTransform = 'uppercase';
  header.style.letterSpacing = '0.5px';
  header.style.textAlign = 'center';
  menu.appendChild(header);

  // Dispatcher function
  const send = (target, includeTimestamp) => {
    let url = window.location.href.split('&t=')[0].split('?t=')[0];
    if (includeTimestamp && currentTime > 0) {
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}t=${currentTime}s`;
    }
    
    const messageType = target === 'PHONE' ? "SEND_TO_PHONE" : "SEND_TO_HA";
    browser.runtime.sendMessage({ type: messageType, url: url });
    menu.remove();
  };

  // Helper to build menu row
  const createOptionRow = (label, target) => {
    const row = document.createElement('div');
    row.className = 'ha-menu-row';
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.padding = '10px 16px';
    row.style.cursor = 'pointer';
    row.style.color = '#ffffff';
    row.style.fontSize = '14px';

    // Center text when at 0s, align space-between when timestamp checkbox exists
    if (currentTime > 0) {
      row.style.justifyContent = 'space-between';
    } else {
      row.style.justifyContent = 'center';
    }

    // Hover effect
    row.onmouseenter = () => { row.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; };
    row.onmouseleave = () => { row.style.backgroundColor = 'transparent'; };

    const textSpan = document.createElement('span');
    textSpan.textContent = label;
    textSpan.style.fontWeight = '400';
    if (currentTime > 0) {
      textSpan.style.flexGrow = '1';
    } else {
      textSpan.style.textAlign = 'center';
    }

    row.appendChild(textSpan);

    // Only append timestamp checkbox if video is past 0s
    let checkbox = null;
    if (currentTime > 0) {
      const labelContainer = document.createElement('label');
      labelContainer.style.display = 'flex';
      labelContainer.style.alignItems = 'center';
      labelContainer.style.fontSize = '13px';
      labelContainer.style.cursor = 'pointer';
      labelContainer.style.marginLeft = '12px';
      labelContainer.style.color = '#cccccc';

      checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.style.marginRight = '6px';
      checkbox.style.cursor = 'pointer';
      checkbox.style.accentColor = '#3ea6ff';

      labelContainer.appendChild(checkbox);
      labelContainer.appendChild(document.createTextNode(`at ${currentTime}s`));
      labelContainer.onclick = (e) => e.stopPropagation();

      row.appendChild(labelContainer);
    }

    // Row Click Handler
    row.onclick = (e) => {
      e.stopPropagation();
      send(target, checkbox ? checkbox.checked : false);
    };

    return row;
  };

  const rowTV = createOptionRow('Play on TV', 'TV');
  const rowPhone = createOptionRow('Send to phone', 'PHONE');

  menu.appendChild(rowTV);
  menu.appendChild(rowPhone);

  document.body.appendChild(menu);

  // Position Menu above Button
  const rect = buttonElement.getBoundingClientRect();
  menu.style.left = `${rect.left}px`;
  menu.style.top = `${rect.top - (currentTime > 0 ? 120 : 110)}px`;

  // Close Menu on Outside Click
  const closeMenu = (e) => {
    if (!menu.contains(e.target) && e.target !== buttonElement) {
      menu.remove();
      window.removeEventListener('click', closeMenu);
    }
  };
  setTimeout(() => window.addEventListener('click', closeMenu), 10);
};

const injectButton = () => {
  const targetParent = document.querySelector('ytd-menu-renderer.ytd-watch-metadata > div:nth-child(1)');
  
  if (!targetParent || document.getElementById('send-to-ha-btn-wrapper')) return;

  const viewModel = document.createElement('yt-button-view-model');
  viewModel.id = 'send-to-ha-btn-wrapper';
  viewModel.className = 'ytd-menu-renderer';

  const host = document.createElement('button-view-model');
  host.className = 'ytSpecButtonViewModelHost style-scope ytd-menu-renderer';

  const button = document.createElement('button');
  button.className = 'ytSpecButtonShapeNextHost ytSpecButtonShapeNextTonal ytSpecButtonShapeNextMono ytSpecButtonShapeNextSizeM ytSpecButtonShapeNextEnableBackdropFilterExperiment';
  button.title = 'Send to Home Assistant / Phone';

  host.appendChild(button);
  viewModel.appendChild(host);

  // Always show menu on click regardless of timestamp
  button.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation();
    createMenu(button);
  });

  targetParent.prepend(viewModel);
};

const observer = new MutationObserver(() => injectButton());
observer.observe(document.body, { childList: true, subtree: true });
setTimeout(injectButton, 2000);