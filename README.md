# Pranav Arora — Portfolio Website

A minimalist dark-themed portfolio website with interactive elements.

## Structure

```
pranav-portfolio/
├── index.html          # Main HTML file
├── css/
│   └── style.css       # All styles
├── js/
│   └── main.js         # All JavaScript
└── README.md
```

## Features

- 🎨 Dark minimalist design with lime-green accents
- ⌨️ Animated terminal hero with typewriter effect
- 🎮 Interactive skills arena — click skill cards to inspect them
- 📁 Live GitHub repo fetch via GitHub API
- ✉️ Contact form powered by Formspree (sends to your Gmail)
- 🖱️ Custom cursor with trail effect
- 📱 Fully responsive

## Setup — Contact Form (IMPORTANT)

The contact form uses [Formspree](https://formspree.io) to send messages to your email.

**To activate it:**
1. Go to https://formspree.io and sign up / log in
2. Create a new form with your email: `pranavarora.in@gmail.com`
3. Copy your form ID (looks like `xpwzjqpn`)
4. Open `js/main.js` and replace the FORMSPREE_ENDPOINT value:
   ```js
   const FORMSPREE_ENDPOINT = 'https://formspree.io/f/YOUR_ACTUAL_FORM_ID';
   ```
5. Save and deploy — messages will now arrive in your Gmail inbox.

## Deployment

You can host this for free on:
- **GitHub Pages**: Push to a repo named `pranavarora17.github.io` or enable Pages in any repo settings
- **Vercel**: Drag & drop the folder
- **Netlify**: Drag & drop the folder

## GitHub Repos

The Projects section automatically fetches your public repos from `github.com/pranavarora17` via the GitHub API. No API key needed for public repos (60 requests/hour unauthenticated).

## Customization

All colors are in CSS variables at the top of `css/style.css`. The accent color is `--accent: #c8f135` (lime green). Swap to any hex to rebrand instantly.
