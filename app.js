(function () {
  const frame = document.getElementById('app-frame');
  const loading = document.getElementById('loading');
  const validViews = new Set(['home', 'tasks', 'health', 'budget', 'journal']);

  function requestedView() {
    const fromHash = location.hash.replace(/^#\/?/, '').toLowerCase();
    if (fromHash === 'today' || fromHash === 'fitness') return fromHash === 'today' ? 'tasks' : 'health';
    return validViews.has(fromHash) ? fromHash : (localStorage.getItem('personal-space-last-view') || 'home');
  }

  function openView(view, updateHash = true) {
    if (view === 'today') view = 'tasks';
    if (view === 'fitness') view = 'health';
    if (!validViews.has(view)) return;
    const source = window.APP_VIEWS && window.APP_VIEWS[view];
    if (!source) return;
    loading.classList.remove('hidden');
    frame.srcdoc = source;
    localStorage.setItem('personal-space-last-view', view);
    if (updateHash && location.hash !== `#/${view}`) history.replaceState(null, '', `#/${view}`);
    frame.onload = () => loading.classList.add('hidden');
  }

  window.addEventListener('message', (event) => {
    if (event.source !== frame.contentWindow || !event.data) return;
    if (event.data.type === 'personal-space:navigate') openView(event.data.view);
  });
  window.addEventListener('hashchange', () => openView(requestedView(), false));

  function connectionState() {
    document.body.classList.toggle('is-offline', !navigator.onLine);
  }
  window.addEventListener('online', connectionState);
  window.addEventListener('offline', connectionState);
  connectionState();

  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => navigator.serviceWorker.register('./service-worker.js').catch(() => {}));
  }

  openView(requestedView());
})();
