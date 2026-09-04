(function () {
  const aliases = {today:'tasks', fitness:'health'};

  document.addEventListener('click', (event) => {
    const button = event.target.closest('[data-nav],.nav-item');
    if (!button) return;
    let view = (button.dataset.nav || button.querySelector('span')?.textContent || '').trim().toLowerCase();
    view = aliases[view] || view;
    event.preventDefault();
    event.stopImmediatePropagation();
    if (view === 'profile') {
      openProfile();
      return;
    }
    if (['home','tasks','health','budget','journal'].includes(view)) {
      window.parent.postMessage({type:'personal-space:navigate', view}, '*');
    }
  }, true);

  function getProfile() {
    try { return JSON.parse(localStorage.getItem('personal-space-profile')) || {}; }
    catch (_) { return {}; }
  }

  function applyProfile(profile) {
    const name = profile.name || 'Johann';
    document.querySelectorAll('.app-title,.brand').forEach((element) => {
      if (/personal space/i.test(element.textContent)) element.textContent = `${name}'s Personal Space`;
    });
    document.querySelectorAll('.avatar,.avatar-circle').forEach((element) => {
      if (profile.avatar) {
        element.textContent = '';
        element.style.backgroundImage = `url(${profile.avatar})`;
        element.style.backgroundSize = 'cover';
        element.style.backgroundPosition = 'center';
      } else if (!element.style.backgroundImage) {
        element.textContent = name.charAt(0).toUpperCase();
      }
    });
  }

  function openProfile() {
    let modal = document.getElementById('globalProfile');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'globalProfile';
      modal.innerHTML = '<div class="gp-card"><button class="gp-x" aria-label="Close">×</button><h2>Your space</h2><p>Ikaw ang main character. Customize natin.</p><label>Name<input id="gpName" maxlength="40"></label><label>Currency<select id="gpCurrency"><option>PHP</option><option>USD</option><option>AUD</option></select></label><label>Profile photo<input id="gpAvatar" type="file" accept="image/*"></label><button class="gp-save">Save changes</button></div>';
      document.body.append(modal);
      modal.querySelector('.gp-x').onclick = () => modal.classList.remove('show');
      modal.onclick = (event) => { if (event.target === modal) modal.classList.remove('show'); };
      modal.querySelector('.gp-save').onclick = async () => {
        const old = getProfile();
        const file = modal.querySelector('#gpAvatar').files[0];
        let avatar = old.avatar || '';
        if (file && window.JDB) avatar = await JDB.compressImage(file, {maxDim:500, quality:.76});
        const profile = {name:modal.querySelector('#gpName').value.trim() || 'Johann', currency:modal.querySelector('#gpCurrency').value, avatar};
        localStorage.setItem('personal-space-profile', JSON.stringify(profile));
        applyProfile(profile);
        modal.classList.remove('show');
      };
    }
    const profile = getProfile();
    modal.querySelector('#gpName').value = profile.name || 'Johann';
    modal.querySelector('#gpCurrency').value = profile.currency || 'PHP';
    modal.querySelector('#gpAvatar').value = '';
    modal.classList.add('show');
  }

  const css = document.createElement('style');
  css.textContent = '#globalProfile{position:fixed;inset:0;background:#28152f66;display:none;align-items:flex-end;justify-content:center;z-index:9999;font-family:Inter,system-ui}#globalProfile.show{display:flex}.gp-card{width:min(100%,390px);background:#F9F6F8;border-radius:28px 28px 0 0;padding:24px 20px 30px;color:#1E1B22;position:relative}.gp-card h2{font-family:"Baloo 2",sans-serif;color:#3B2354;margin:0}.gp-card p{color:#746D78;font-size:13px}.gp-card label{display:block;color:#746D78;font-size:12px;font-weight:700;margin-top:12px}.gp-card input,.gp-card select{display:block;width:100%;margin-top:6px;border:1px solid #ECE3EA;background:#fff;border-radius:14px;padding:12px}.gp-save{width:100%;border:0;background:#E31C79;color:#fff;border-radius:14px;padding:13px;margin-top:18px;font-weight:800}.gp-x{position:absolute;right:18px;top:18px;width:34px;height:34px;border:0;border-radius:50%;background:#FCEAF3;color:#B81463;font-size:20px}';
  document.head.append(css);
  applyProfile(getProfile());
  const date = document.querySelector('.app-date,#fullDate');
  if (date) date.textContent = new Date().toLocaleDateString(undefined, {weekday:'long', month:'long', day:'numeric'});
})();
