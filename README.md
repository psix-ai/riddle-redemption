# Riddle Redemption

A standalone GitHub Pages site that shows a riddle, accepts a code, and unlocks encrypted redemption text.

## Files

- `index.html` is the public page.
- `styles.css` controls the layout.
- `script.js` contains the riddle configuration and unlock logic.
- `tools/setup.html` generates a new encrypted config locally.

## Customize

1. Open `tools/setup.html` in a browser.
2. Enter the title, riddle, optional hint, correct code, and redemption text.
3. Copy the generated `const CONFIG = ...;` output.
4. Replace the `CONFIG` object at the top of `script.js`.
5. Open `index.html` and test the code.

The code is normalized with `trim().toLowerCase()`, so `My Code`, `my code`, and ` my code ` are treated as the same answer.

## Publish on GitHub Pages

1. Create a new repository named `riddle-redemption` under `psix-ai`.
2. Add these files to the repository.
3. In GitHub, go to Settings > Pages.
4. Set the source to deploy from the `main` branch and the root folder.
5. The site should publish at:

```text
https://psix-ai.github.io/riddle-redemption/
```

## Security note

This is much better than putting the reward in plain text, but it is still a static website. Anyone can download the page and attempt to brute-force the code offline. Use a long, specific code if the redemption has real value.
