# Events in Bhubaneswar

This is a small event guide website I built for a web design project. It brings together sample music, art and food events in Bhubaneswar so visitors can browse ideas, save the ones they like and make a plan.

The events are made-up examples for the project. They are not real listings, and signing up on the page does not contact an organiser.

## Project structure

```text
Web_Designing/
├── index.html
├── styles.css
├── script.js
├── README.md
└── assets/
    ├── poster-chai.svg
    ├── poster-open-mic.svg
    ├── poster-patch.svg
    ├── poster-records.svg
    ├── poster-supper.svg
    └── poster-zine.svg
```

### What the files do

- **`index.html`** contains the page layout, event information, registration form and details dialog.
- **`styles.css`** controls the colors, typography, poster cards, responsive layout, dark theme and small animations.
- **`script.js`** handles the countdown, search and category filters, saved favorites, event sharing, calendar downloads, form validation and theme preference.
- **`assets/`** contains the SVG posters used on the event cards.
- **`README.md`** is this project guide.

## Features

- Browse six sample events with custom poster artwork.
- Search by event name or details, or filter by music, art and food.
- Save favorite events and switch to a list of saved events.
- See a countdown to the next event in the sample schedule.
- Open an event’s details, share a link to it, or download a calendar file.
- Use the registration form and view saved plans on the page.
- Switch between light and dark mode.
- Use the page on desktop or mobile, with keyboard focus styles and a skip link.

## How to run it

There is no install step or build command.

1. Download the repository and unzip it, or open the project folder on your computer.
2. Open **`index.html`** in a web browser.

Keep `styles.css`, `script.js` and the `assets` folder beside `index.html` so the page can load its styles, features and posters.

## A few notes

Favorites, sample registrations and the theme preference are stored in the browser with `localStorage`. They do not sync to another device or go to a server. The registration form is a front-end demonstration only.

The countdown and calendar downloads use the dates in the sample listings. Calendar files assume an event lasts two hours. If you change an event’s date, update its date in both `index.html` and `script.js` so the card, countdown and calendar stay in sync.
