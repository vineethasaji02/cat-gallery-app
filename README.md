# Cat Gallery — Waracle Frontend Challenge

A React Native app (React Native CLI, JavaScript) built against [The Cat API](https://thecatapi.com).

---

## AI Disclosure

Claude (Anthropic) was used as a development assistant during this project — helping with boilerplate, component structure, and speeding through repetitive code. All architectural decisions, design choices, and logic were directed and reviewed by me. Where Claude got things wrong, I fixed them.

---

## What it does

A clean, dark-themed gallery app for your cat photos. You can upload images straight from your phone's camera or library, favourite the ones you love, vote them up or down, and delete the ones that didn't make the cut.

- **Gallery** — responsive grid of your uploaded cats, scales neatly from wide screens down to 340px
- **Upload** — pick from your library or take a photo directly; large images are automatically compressed to fit the API's 2 MB limit
- **Favouriting** — tap the heart to save a favourite; tap again to remove it
- **Voting** — vote cats up or down; score can't drop below zero
- **Deleting** — remove a cat permanently with a confirmation prompt
- **Score** — displayed per cat as `(upvotes − downvotes)`

---

## Getting started

### 1. Install dependencies

```bash
npm install
npm install @react-navigation/native @react-navigation/native-stack
npm install react-native-screens react-native-safe-area-context
npm install react-native-image-picker
npm install react-native-image-resizer
npm install axios
```

For iOS, run pod install after:

```bash
cd ios && pod install && cd ..
```

### 2. Add your API key

Open `src/services/catApi.js` and replace:

```js
const API_KEY = 'YOUR_API_KEY_HERE';
```

Get a free key at [thecatapi.com](https://thecatapi.com).

### 3. Run

```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

If you hit a Metro cache issue:

```bash
npx react-native start --reset-cache
```

---

## Project structure

```
src/
  services/
    catApi.js        — All API calls (images, favourites, votes, delete)
  hooks/
    useGallery.js    — Data fetching + state management
  screens/
    GalleryScreen.js — Main gallery "/"
    UploadScreen.js  — Upload screen "/upload"
  components/
    CatCard.js       — Individual cat tile
  utils/
    theme.js         — Colours, spacing, typography
App.js               — Navigation root
```

---

## How it's built

**Service layer** (`catApi.js`) is pure async functions with no React in it — easy to test and easy to swap the HTTP client if needed.

**`useGallery` hook** is the single source of truth for all gallery state. It fetches images, favourites, and votes in parallel, then merges them so components just receive ready-to-render data — no joining or transforming in the UI.

**Optimistic updates** on votes mean the score changes instantly and reverts silently if the API call fails. Favourites wait for the API response before updating because you need the `favourite_id` back to be able to delete it later.

**Deleting** removes the card from local state immediately after the API confirms — no full reload needed, so the rest of the list stays put.

**Auto-compression** on upload — if a selected image is over 2 MB, it's compressed automatically (stepping through 80% → 60% → 40% quality) before the upload is attempted. The user sees a "Compressing…" state and a notice showing how much it was reduced.

**`CatCard`** is `memo()`-wrapped so only the cards that actually changed re-render, not the whole list.

---

## What I'd add with more time

- Pagination / infinite scroll on the gallery
- Skeleton loaders instead of a spinner while loading
- Haptic feedback on vote and favourite actions
- Swipe-to-delete as an alternative to the delete button
- Unit tests for the `useGallery` hook logic