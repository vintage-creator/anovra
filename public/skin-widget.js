(function() {
  // 1. Locate the widget script element to extract options
  const scriptEl = document.currentScript || (() => {
    const scripts = document.getElementsByTagName('script');
    for (let i = 0; i < scripts.length; i++) {
      if (scripts[i].src && scripts[i].src.includes('skin-widget.js')) {
        return scripts[i];
      }
    }
    return null;
  })();

  if (!scriptEl) return;

  const vendorSlug = scriptEl.getAttribute('data-vendor') || 'vintage';
  // Dynamically resolve target domain from script src URL (handles local test & production deployment)
  const scriptUrl = new URL(scriptEl.src);
  const targetOrigin = scriptUrl.origin; // e.g. "https://anovra.africa" or "http://localhost:5173"

  // 2. Create the floating button
  const button = document.createElement('button');
  button.id = 'anovra-skin-widget-btn';
  button.setAttribute('aria-label', 'Analyze Skin');
  
  // Style the floating button
  Object.assign(button.style, {
    position: 'fixed',
    bottom: '24px',
    right: '24px',
    width: '60px',
    height: '60px',
    borderRadius: '30px',
    backgroundColor: '#008236',
    boxShadow: '0 8px 30px rgba(0, 130, 54, 0.35)',
    border: 'none',
    cursor: 'pointer',
    zIndex: '999999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
  });

  // SVG Skin Scan Icon
  button.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M3 7V5a2 2 0 0 1 2-2h2"></path>
      <path d="M17 3h2a2 2 0 0 1 2 2v2"></path>
      <path d="M21 17v2a2 2 0 0 1-2 2h-2"></path>
      <path d="M7 21H5a2 2 0 0 1-2-2v-2"></path>
      <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
      <line x1="9" y1="9" x2="9.01" y2="9"></line>
      <line x1="15" y1="9" x2="15.01" y2="9"></line>
    </svg>
  `;

  // Hover animations
  button.addEventListener('mouseenter', () => {
    button.style.transform = 'scale(1.08) translateY(-3px)';
    button.style.boxShadow = '0 12px 35px rgba(0, 130, 54, 0.45)';
  });
  button.addEventListener('mouseleave', () => {
    button.style.transform = 'scale(1) translateY(0)';
    button.style.boxShadow = '0 8px 30px rgba(0, 130, 54, 0.35)';
  });

  // 3. Create the iframe overlay modal container
  const overlay = document.createElement('div');
  overlay.id = 'anovra-skin-widget-overlay';
  Object.assign(overlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    backgroundColor: 'rgba(26, 10, 5, 0.4)',
    backdropFilter: 'blur(8px)',
    webkitBackdropFilter: 'blur(8px)',
    zIndex: '1000000',
    display: 'none',
    opacity: '0',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.3s ease',
  });

  // Modal Container
  const modal = document.createElement('div');
  Object.assign(modal.style, {
    position: 'relative',
    width: '90%',
    maxWidth: '500px',
    height: '85vh',
    backgroundColor: '#FAF7F2',
    borderRadius: '24px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    overflow: 'hidden',
    transform: 'scale(0.95)',
    transition: 'transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    display: 'flex',
    flexDirection: 'column',
  });

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.setAttribute('aria-label', 'Close dialog');
  Object.assign(closeBtn.style, {
    position: 'absolute',
    top: '16px',
    right: '16px',
    width: '36px',
    height: '36px',
    borderRadius: '18px',
    backgroundColor: 'rgba(26, 10, 5, 0.05)',
    border: 'none',
    cursor: 'pointer',
    zIndex: '1000002',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  });
  closeBtn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a0a05" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"></line>
      <line x1="6" y1="6" x2="18" y2="18"></line>
    </svg>
  `;
  closeBtn.addEventListener('mouseenter', () => {
    closeBtn.style.backgroundColor = 'rgba(26, 10, 5, 0.1)';
  });
  closeBtn.addEventListener('mouseleave', () => {
    closeBtn.style.backgroundColor = 'rgba(26, 10, 5, 0.05)';
  });

  // Iframe Element
  const iframe = document.createElement('iframe');
  iframe.src = `${targetOrigin}/#/scan/${vendorSlug}`;
  Object.assign(iframe.style, {
    width: '100%',
    height: '100%',
    border: 'none',
  });

  modal.appendChild(closeBtn);
  modal.appendChild(iframe);
  overlay.appendChild(modal);

  // Append elements to DOM
  document.body.appendChild(button);
  document.body.appendChild(overlay);

  // Click handlers
  button.addEventListener('click', () => {
    overlay.style.display = 'flex';
    // Trigger transition
    setTimeout(() => {
      overlay.style.opacity = '1';
      modal.style.transform = 'scale(1)';
    }, 10);
  });

  const closeOverlay = () => {
    overlay.style.opacity = '0';
    modal.style.transform = 'scale(0.95)';
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 300);
  };

  closeBtn.addEventListener('click', closeOverlay);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) {
      closeOverlay();
    }
  });

})();
