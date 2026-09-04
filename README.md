# My Personal Space — Single-page PWA

This is the GitHub-ready version of the app. It has one `index.html`; Home, Tasks, Health, Budget, and Journal open inside that single app without loading separate HTML pages.

## Put it on GitHub Pages

1. Extract the ZIP.
2. Create a GitHub repository.
3. Upload **the extracted files and folders** to the repository root. `index.html` must be visible at the top level.
4. Open **Settings → Pages** in GitHub.
5. Choose **Deploy from a branch**, select `main` and `/ (root)`, then save.
6. Open the HTTPS link GitHub provides. Your browser can then install it as an app.

## What stays private and offline

- Tasks, journal entries, settings, and compressed pictures are stored in the browser on that device.
- Images are resized and compressed before local storage.
- The service worker caches the app so it can reopen offline after the first successful visit.
- Clearing that site's browser data removes local entries. Back up anything important before clearing it.

No ChatGPT Sites configuration or hosting files are included.
