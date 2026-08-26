const createMenu = (buttonElement) => {
  const existingMenu = document.getElementById('ha-timestamp-menu');
  if (existingMenu) {
    existingMenu.remove();
    return;
  }

  const videoElement = document.querySelector('video');
  const currentTime = videoElement ? Math.floor(videoElement.currentTime) : 0;

  // Helper to format timestamp into MM:SS or HH:MM:SS
  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    const pad = (n) => String(n).padStart(2, '0');
    return hrs > 0 ? `${hrs}:${pad(mins)}:${pad(secs)}` : `${pad(mins)}:${pad(secs)}`;
  };

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
  menu.style.minWidth = '230px';
  menu.style.fontFamily = 'Roboto, Arial, sans-serif';

  // Centered Header Title
  const header = document.createElement('div');
  header.style.padding = '6px 16px 8px 16px';
  header.style.fontSize = '12px';
  header.style.fontWeight = '600';
  header.style.color = '#aaaaaa';
  header.style.borderBottom = '1px solid rgba(255, 255, 255, 0.1)';
  header.style.marginBottom = '4px';
  header.style.textAlign = 'center';
  header.style.letterSpacing = '0.5px';
  header.textContent = 'HA QUICKTOOLS';
  menu.appendChild(header);

  let checkbox = null;

  // Dispatcher function
  const send = (type, payloadType) => {
    let url = window.location.href.split('&t=')[0].split('?t=')[0];
    const includeTimestamp = checkbox ? checkbox.checked : false;

    if (includeTimestamp && currentTime > 0) {
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}t=${currentTime}s`;
    }
    
    if (type === 'TV') {
      browser.runtime.sendMessage({ type: "SEND_TO_HA", url: url });
    } else if (type === 'PHONE') {
      browser.runtime.sendMessage({ 
        type: "SEND_TO_PHONE", 
        url: url, 
        payloadType: payloadType 
      });
    }
    menu.remove();
  };

  // Helper to build menu row
  const createOptionRow = (label, icon, type, payloadType, isSubitem = false) => {
    const row = document.createElement('div');
    row.className = 'ha-menu-row';
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.padding = isSubitem ? '8px 16px 8px 24px' : '10px 16px';
    row.style.cursor = 'pointer';
    row.style.color = isSubitem ? '#cccccc' : '#ffffff';
    row.style.fontSize = isSubitem ? '13px' : '14px';

    row.onmouseenter = () => { row.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'; };
    row.onmouseleave = () => { row.style.backgroundColor = 'transparent'; };

    if (icon) {
      const iconSpan = document.createElement('span');
      iconSpan.textContent = icon;
      iconSpan.style.marginRight = '10px';
      iconSpan.style.width = '16px';
      iconSpan.style.textAlign = 'center';
      row.appendChild(iconSpan);
    }

    const textSpan = document.createElement('span');
    textSpan.textContent = label;
    textSpan.style.fontWeight = '400';
    row.appendChild(textSpan);

    row.onclick = (e) => {
      e.stopPropagation();
      send(type, payloadType);
    };

    return row;
  };

  // 1. Play on TV
  const rowTV = createOptionRow('Play on TV', null, 'TV', null);
  menu.appendChild(rowTV);

  // 2. Submenu Header for Phone
  const phoneSectionHeader = document.createElement('div');
  phoneSectionHeader.textContent = 'SEND TO PHONE';
  phoneSectionHeader.style.padding = '10px 16px 4px 16px';
  phoneSectionHeader.style.fontSize = '11px';
  phoneSectionHeader.style.fontWeight = '600';
  phoneSectionHeader.style.color = '#888888';
  phoneSectionHeader.style.letterSpacing = '0.5px';
  menu.appendChild(phoneSectionHeader);

  // 3. Submenu Items
  const rowPhonePlay = createOptionRow('Play Video', '▶', 'PHONE', 'youtubevideo', true);
  const rowPhoneCopy = createOptionRow('Copy URL to Clipboard', '📋', 'PHONE', 'link', true);

  menu.appendChild(rowPhonePlay);
  menu.appendChild(rowPhoneCopy);

  // 4. Footer Section (Timestamp Checkbox)
  if (currentTime > 0) {
    const footer = document.createElement('div');
    footer.style.borderTop = '1px solid rgba(255, 255, 255, 0.1)';
    footer.style.marginTop = '6px';
    footer.style.padding = '8px 16px 2px 16px';
    footer.style.display = 'flex';
    footer.style.justifyContent = 'center';

    const labelContainer = document.createElement('label');
    labelContainer.style.display = 'flex';
    labelContainer.style.alignItems = 'center';
    labelContainer.style.fontSize = '12px';
    labelContainer.style.cursor = 'pointer';
    labelContainer.style.color = '#3ea6ff';

    checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = true;
    checkbox.style.webkitAppearance = 'checkbox';
    checkbox.style.appearance = 'checkbox';
    checkbox.style.display = 'inline-block';
    checkbox.style.width = '14px';
    checkbox.style.height = '14px';
    checkbox.style.margin = '0 6px 0 0';
    checkbox.style.cursor = 'pointer';
    checkbox.style.accentColor = '#3ea6ff';

    labelContainer.appendChild(checkbox);
    labelContainer.appendChild(document.createTextNode(`Include timestamp (${formatTime(currentTime)})`));
    labelContainer.onclick = (e) => e.stopPropagation();

    footer.appendChild(labelContainer);
    menu.appendChild(footer);
  }

  document.body.appendChild(menu);

  // Position Menu above Button
  const rect = buttonElement.getBoundingClientRect();
  menu.style.left = `${rect.left}px`;
  menu.style.top = `${rect.top - (currentTime > 0 ? 195 : 165)}px`;

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