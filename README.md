# Place To Go

Mobile-first travel wishlist website for Fiqry & Isyana. It runs on GitHub Pages and reads places from GitHub Issues.

## Setup

1. Push this folder to a GitHub repository.
2. Enable GitHub Pages for the repository.
3. Open `js/config.js` and set:

```js
githubOwner: "your-github-username",
githubRepo: "your-repository-name"
```

For a standard project page at `https://username.github.io/repository-name/`, the app can infer the repository automatically.

## Add Places

Use the floating add button on the website. It opens the GitHub Issue Form in `.github/ISSUE_TEMPLATE/place.yml`.

Open issues are shown as `Wishlist`. Closed issues are shown as `Visited`.
