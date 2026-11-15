# Comunhão Rara Rio — Website

Institutional website of **Igreja Comunhão Rara Rio**. It presents each step of the church journey (conversion, Avançai, inner healing, small groups, serving) and includes a **student panel** and a **teacher panel** for the Avançai lesson track, using the same account as the Rara mobile app.

![HTML](https://img.shields.io/badge/html-5-E34F26?logo=html5&logoColor=white)
![CSS](https://img.shields.io/badge/css-3-1572B6?logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-ES_modules-F7DF1E?logo=javascript&logoColor=black)
![Vercel](https://img.shields.io/badge/deploy-vercel-000000?logo=vercel)

## Demo

- **Website:** https://rarario.vercel.app/

## Features

- **Home page** with step cards: Conversion, Avançai, Inner Healing ("Cura da Alma"), Christian Group and Serving ("Atuação").
- **One page per step**, each with its own accent color.
- **WhatsApp contact buttons** with a ready-made message.
- **QR Code pages** for printing and sharing.
- **Student panel:** the Avançai lessons and the two spiritual gifts tests, with progress.
- **Teacher panel:** follow the students of the track.
- **Sign in** with the Rara app account, with Google, or create an account.
- **Themes:** dark (default), light, pink and "follow the system".
- **Modern look:** Poppins font, frosted glass cards, gradients and short animations.

## Tech stack

| Area | Technology |
|---|---|
| Pages | Plain HTML |
| Styles | Plain CSS (one file per page; panels share `css/painel.css`) |
| Scripts | Vanilla JavaScript (ES modules, no build step) |
| Auth | Rara API + Google Identity Services |
| Hosting | Vercel |

No framework, no bundler and no `package.json`.

## Prerequisites

- A modern browser
- Optional: any static file server to test locally (for example the VS Code Live Server extension or `npx serve`)

## Installation

```bash
git clone <repository-url> rarario
cd rarario
npx serve .
```

Then open the address shown in the terminal. ES modules don't work when the files are opened directly (`file://`), so use a local server.

## Configuration

There are no environment variables: the website is public and **must never contain secrets**.

| Setting | Where | Description |
|---|---|---|
| API URL | `js/shared/httpClient.js` | Rara API (`https://rara.cestsegtrabalho.com.br/api`) |
| Google sign-in | Google Cloud | Every domain of the website must be listed in "Authorized JavaScript origins" of the Rara web client |

## Usage

- Edit the HTML/CSS/JS files and refresh the browser: there is no build.
- **New step page:** copy `pages/curadaalma.html` and `css/curadaalma.css`, rename them and pick an accent color (`--*-grad`) not used by other pages.
- **Contact buttons:** always WhatsApp links (`https://wa.me/55<area code><number>?text=...`), never `tel:`.
- **Logo:** it is light with a transparent background, made for dark backgrounds.

## Folder structure

```
rarario/
├── index.html            # Home page with the step cards
├── pages/                # One page per step + login, sign-up and the panels
├── css/                  # One CSS per page (qrcode.css and painel.css are shared)
├── js/
│   ├── shared/           # httpClient, session, theme, header, auth, Google, UI helpers
│   ├── user/             # user.api.js
│   ├── lesson/           # lesson.api.js, lesson.utils.js
│   ├── gift/             # Spiritual gifts tests
│   └── <page>.js         # One script per page (panels, login, sign-up)
└── img/                  # Logo and images
```

## Deployment

- Hosted on **Vercel**. Every push to `main` publishes automatically, with no build step.

## Contributing

1. Create a branch from `main`: `feature/<name>` (or `fix/<name>`).
2. Keep each page with its own CSS file and follow the look of the existing step pages.
3. Never add secrets or API keys: everything in this repository is public on the website.
4. Test on a phone-sized screen.
5. Write commit messages in Portuguese and open a pull request to `main`.

## License and author

**Private and proprietary.** All rights reserved. Content and images belong to Igreja Comunhão Rara Rio.

Developed by **Stanley Andrade**.
