// Search and category buttons narrow down the event cards.
const searchInput = document.querySelector('#search');
const filterButtons = document.querySelectorAll('.filter');
const eventCards = document.querySelectorAll('.event-card');
const noResults = document.querySelector('#no-results');
const resultsCount = document.querySelector('#results-count');
let selectedCategory = 'all';
const favoritesKey = 'k-explore-favorites';
const favoriteButtons = document.querySelectorAll('[data-favorite]');
const savedFilter = document.querySelector('#saved-filter');
let savedOnly = false;

function readFavorites() {
  try {
    const favorites = JSON.parse(localStorage.getItem(favoritesKey) || '[]');
    return Array.isArray(favorites) ? favorites : [];
  } catch {
    return [];
  }
}

let favoriteIds = readFavorites();

function updateEvents() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  let visibleCount = 0;

  eventCards.forEach((card) => {
    const categoryMatches = selectedCategory === 'all' || card.dataset.category === selectedCategory;
    const cardDescription = [
      card.querySelector('h3').textContent,
      card.querySelector('.event-card > p').textContent,
      card.querySelector('.card-bottom > span').textContent
    ].join(' ');
    const searchableText = `${card.dataset.search} ${cardDescription}`.toLowerCase();
    const searchMatches = searchableText.includes(searchTerm);
    const favoriteMatches = !savedOnly || favoriteIds.includes(card.querySelector('[data-details]').dataset.details);
    const showCard = categoryMatches && searchMatches && favoriteMatches;

    card.hidden = !showCard;
    if (showCard) visibleCount += 1;
  });

  noResults.hidden = visibleCount > 0;
  noResults.textContent = savedOnly
    ? 'No saved events match. Save an event with ♡ to keep it here.'
    : 'No plans found. Try another search?';
  resultsCount.textContent = `${visibleCount} event${visibleCount === 1 ? '' : 's'} shown.`;
}

searchInput.addEventListener('input', updateEvents);
updateEvents();
filterButtons.forEach((button) => {
  button.addEventListener('click', () => {
    selectedCategory = button.dataset.filter;
    filterButtons.forEach((item) => {
      const isSelected = item === button;
      item.classList.toggle('active', isSelected);
      item.setAttribute('aria-pressed', String(isSelected));
    });
    updateEvents();
  });
});

function renderFavorites() {
  favoriteButtons.forEach((button) => {
    const isSaved = favoriteIds.includes(button.dataset.favorite);
    button.setAttribute('aria-pressed', String(isSaved));
    button.textContent = isSaved ? '♥ Saved' : '♡ Save';
  });
  savedFilter.setAttribute('aria-pressed', String(savedOnly));
  savedFilter.textContent = savedOnly ? '♥ Showing saved' : '♡ Saved only';
  updateEvents();
}

favoriteButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const id = button.dataset.favorite;
    favoriteIds = favoriteIds.includes(id)
      ? favoriteIds.filter((favorite) => favorite !== id)
      : [...favoriteIds, id];
    try { localStorage.setItem(favoritesKey, JSON.stringify(favoriteIds)); } catch { /* Favorites still work for this visit. */ }
    renderFavorites();
  });
});

savedFilter.addEventListener('click', () => {
  savedOnly = !savedOnly;
  renderFavorites();
});
renderFavorites();

// A card's sign-up link preselects that event in the form.
const eventSelect = document.querySelector('#event');
document.querySelectorAll('[data-event]').forEach((link) => {
  link.addEventListener('click', () => {
    eventSelect.value = link.dataset.event;
  });
});

// Show a short information panel for each event.
const eventDetails = {
  records: {
    title: 'Rooftop Records',
    category: 'MUSIC / LISTENING NIGHT',
    description: 'A relaxed listening evening. Bring one record to share, or just come and listen.',
    when: 'Friday, 13 November · 6:30 PM',
    start: '2026-11-13T18:30:00+05:30',
    where: 'Saheed Nagar, Bhubaneswar',
    extra: 'Sample event for this student project.'
  },
  zine: {
    title: 'Make a Mess: Zine Workshop',
    category: 'ART / WORKSHOP',
    description: 'Make a small paper zine with scissors, markers and whatever you have to say.',
    when: 'Saturday, 14 November · 11:00 AM',
    start: '2026-11-14T11:00:00+05:30',
    where: 'Unit 3, Bhubaneswar',
    extra: 'Paper and basic materials are included. Sample event for this project.'
  },
  supper: {
    title: 'Sunday Supper Club',
    category: 'FOOD / SHARED DINNER',
    description: 'A shared dinner with a set menu and room at the table for a few more people.',
    when: 'Sunday, 15 November · 7:00 PM',
    start: '2026-11-15T19:00:00+05:30',
    where: 'Old Town, Bhubaneswar',
    extra: 'Please tell the host about dietary needs before the day. Sample event for this project.'
  },
  'open-mic': {
    title: 'Open Mic, No Pressure',
    category: 'MUSIC / OPEN MIC',
    description: 'Songs, stories and bad jokes are welcome. You can come along just to listen.',
    when: 'Friday, 20 November · 7:00 PM',
    start: '2026-11-20T19:00:00+05:30',
    where: 'Saheed Nagar, Bhubaneswar',
    extra: 'Short sets, first come first served. Sample event for this project.'
  },
  patch: {
    title: 'Print & Patch Afternoon',
    category: 'ART / WORKSHOP',
    description: 'Try a simple block print and add it to a tote or a piece of fabric.',
    when: 'Saturday, 21 November · 2:00 PM',
    start: '2026-11-21T14:00:00+05:30',
    where: 'Unit 1, Bhubaneswar',
    extra: 'Basic materials are included. Sample event for this project.'
  },
  chai: {
    title: 'Chai and Tabletop',
    category: 'FOOD / GAMES',
    description: 'Tea, a few board games and a slow Sunday afternoon around the table.',
    when: 'Sunday, 22 November · 4:00 PM',
    start: '2026-11-22T16:00:00+05:30',
    where: 'Old Town, Bhubaneswar',
    extra: 'Games are provided; bring a favorite if you have one. Sample event for this project.'
  }
};

const detailsDialog = document.querySelector('#event-dialog');
const dialogRegister = document.querySelector('#dialog-register');
let selectedDetails = null;

// Count down to the next upcoming sample event in the listed schedule.
const countdownFields = {
  days: document.querySelector('#countdown-days'),
  hours: document.querySelector('#countdown-hours'),
  minutes: document.querySelector('#countdown-minutes'),
  seconds: document.querySelector('#countdown-seconds')
};
const countdownTitle = document.querySelector('#countdown-event');
const countdownDate = document.querySelector('#countdown-date');
const countdownRegister = document.querySelector('[data-countdown-register]');
const countdownCards = [...eventCards].sort((a, b) => new Date(a.dataset.start) - new Date(b.dataset.start));

function updateCountdown() {
  const now = Date.now();
  const nextCard = countdownCards.find((card) => new Date(card.dataset.start).getTime() > now);
  if (!nextCard) {
    countdownTitle.textContent = 'That’s a wrap';
    countdownDate.textContent = 'There are no more sample events in this schedule.';
    Object.values(countdownFields).forEach((field) => { field.textContent = '00'; });
    countdownRegister.hidden = true;
    return;
  }

  const remaining = new Date(nextCard.dataset.start).getTime() - now;
  const eventName = nextCard.querySelector('h3').textContent;
  countdownRegister.hidden = false;
  countdownRegister.dataset.event = eventName;
  countdownTitle.textContent = eventName;
  countdownDate.textContent = nextCard.querySelector('.card-meta span').textContent;
  countdownFields.days.textContent = String(Math.floor(remaining / 86400000)).padStart(2, '0');
  countdownFields.hours.textContent = String(Math.floor((remaining % 86400000) / 3600000)).padStart(2, '0');
  countdownFields.minutes.textContent = String(Math.floor((remaining % 3600000) / 60000)).padStart(2, '0');
  countdownFields.seconds.textContent = String(Math.floor((remaining % 60000) / 1000)).padStart(2, '0');
}

updateCountdown();
window.setInterval(updateCountdown, 1000);

document.querySelectorAll('[data-details]').forEach((button) => {
  button.addEventListener('click', () => {
    const details = eventDetails[button.dataset.details];
    if (!details) return;
    selectedDetails = details;

    document.querySelector('#dialog-category').textContent = details.category;
    document.querySelector('#dialog-title').textContent = details.title;
    document.querySelector('#dialog-description').textContent = details.description;
    document.querySelector('#dialog-when').textContent = details.when;
    document.querySelector('#dialog-where').textContent = details.where;
    document.querySelector('#dialog-extra').textContent = details.extra;
    dialogRegister.dataset.event = details.title;
    detailsDialog.dataset.eventId = button.dataset.details;
    history.replaceState(null, '', `#event-${button.dataset.details}`);
    detailsDialog.showModal();
  });
});

detailsDialog.addEventListener('close', () => {
  if (location.hash.startsWith('#event-')) history.replaceState(null, '', `${location.pathname}${location.search}`);
});

document.querySelector('#share-button').addEventListener('click', async () => {
  if (!selectedDetails) return;
  const shareLink = new URL(location.href);
  shareLink.hash = `event-${detailsDialog.dataset.eventId}`;
  const shareUrl = shareLink.href;
  const shareData = { title: selectedDetails.title, text: `${selectedDetails.title} · ${selectedDetails.when} · ${selectedDetails.where}`, url: shareUrl };
  const shareMessage = document.querySelector('#share-message');
  try {
    if (navigator.share) {
      await navigator.share(shareData);
      shareMessage.textContent = 'Event shared.';
    } else if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${shareData.text}\n${shareUrl}`);
      shareMessage.textContent = 'Event link copied.';
    } else {
      shareMessage.textContent = shareUrl;
    }
  } catch (error) {
    if (error.name !== 'AbortError') shareMessage.textContent = 'Could not share this event from this browser.';
  }
});

// Open a shared event link directly in its details panel.
const linkedEventId = location.hash.startsWith('#event-') ? location.hash.slice(7) : '';
const linkedEventButton = [...document.querySelectorAll('[data-details]')]
  .find((button) => button.dataset.details === linkedEventId);
if (linkedEventButton) linkedEventButton.click();

// Download a small iCalendar file for the event currently shown in the details panel.
document.querySelector('#calendar-button').addEventListener('click', () => {
  if (!selectedDetails) return;
  const toCalendarDate = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const escapeCalendarText = (value) => value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/[,;]/g, '\\$&');
  const start = new Date(selectedDetails.start);
  const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
  const calendar = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Events in Bhubaneswar//Sample Event//EN',
    'BEGIN:VEVENT', `UID:${selectedDetails.start}-${selectedDetails.title.replace(/\W/g, '')}@events-bhubaneswar`,
    `DTSTAMP:${toCalendarDate(new Date())}`, `DTSTART:${toCalendarDate(start)}`, `DTEND:${toCalendarDate(end)}`,
    `SUMMARY:${escapeCalendarText(selectedDetails.title)}`, `LOCATION:${escapeCalendarText(selectedDetails.where)}`,
    `DESCRIPTION:${escapeCalendarText(selectedDetails.description)} This is a sample event listing.`,
    'END:VEVENT', 'END:VCALENDAR'
  ].join('\r\n');
  const file = new Blob([calendar], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${selectedDetails.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
});

document.querySelector('.dialog-close').addEventListener('click', () => detailsDialog.close());
dialogRegister.addEventListener('click', () => {
  eventSelect.value = dialogRegister.dataset.event;
  detailsDialog.close();
});

// Save registrations in this browser so the visitor can see and remove them.
const storageKey = 'k-explore-registrations';
const savedPlansSection = document.querySelector('#my-plans');
const savedList = document.querySelector('#saved-list');
const form = document.querySelector('#registration-form');
const message = document.querySelector('#form-message');
const phoneInput = document.querySelector('#phone');

function getRegistrations() {
  try {
    const registrations = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(registrations) ? registrations : [];
  } catch {
    return [];
  }
}

function saveRegistrations(registrations) {
  try {
    localStorage.setItem(storageKey, JSON.stringify(registrations));
    return true;
  } catch {
    return false;
  }
}

function renderRegistrations() {
  const registrations = getRegistrations();
  savedList.replaceChildren();
  savedPlansSection.hidden = registrations.length === 0;

  registrations.forEach((registration) => {
    const row = document.createElement('article');
    row.className = 'saved-plan';

    const text = document.createElement('p');
    const name = document.createElement('strong');
    name.textContent = registration.name;
    const eventName = document.createElement('span');
    eventName.textContent = registration.event;
    text.append(name, document.createElement('br'), eventName);

    const removeButton = document.createElement('button');
    removeButton.type = 'button';
    removeButton.className = 'remove-plan';
    removeButton.textContent = 'Remove';
    removeButton.setAttribute('aria-label', `Remove ${registration.event} registration`);
    removeButton.addEventListener('click', () => {
      const updated = getRegistrations().filter((item) => item.id !== registration.id);
      saveRegistrations(updated);
      renderRegistrations();
    });

    row.append(text, removeButton);
    savedList.append(row);
  });
}

function checkPhoneNumber() {
  const digitCount = phoneInput.value.replace(/\D/g, '').length;
  phoneInput.setCustomValidity(digitCount >= 10 && digitCount <= 15
    ? ''
    : 'Enter a phone number with 10 to 15 digits.');
}

phoneInput.addEventListener('input', checkPhoneNumber);
form.addEventListener('input', () => {
  message.textContent = '';
});
form.addEventListener('submit', (event) => {
  event.preventDefault();
  message.textContent = '';
  checkPhoneNumber();
  if (!form.reportValidity()) return;

  const registration = {
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: document.querySelector('#name').value.trim(),
    email: document.querySelector('#email').value.trim(),
    phone: phoneInput.value.trim(),
    event: eventSelect.value
  };

  const registrations = getRegistrations();
  registrations.push(registration);
  const wasSaved = saveRegistrations(registrations);
  message.textContent = wasSaved
    ? `You're on the list, ${registration.name.split(/\s+/)[0]}! Your plan is saved in this browser.`
    : 'Thanks! Your form is complete, but this browser could not save the plan.';

  form.reset();
  phoneInput.setCustomValidity('');
  renderRegistrations();
});

document.querySelector('#clear-plans').addEventListener('click', () => {
  if (!window.confirm('Clear all saved plans from this browser?')) return;
  saveRegistrations([]);
  renderRegistrations();
  message.textContent = 'Your saved plans have been cleared.';
});

renderRegistrations();

// Remember the visitor's light or dark theme preference on this device.
const themeButton = document.querySelector('#theme-toggle');

function setTheme(isDark) {
  document.body.dataset.theme = isDark ? 'dark' : 'light';
  themeButton.setAttribute('aria-pressed', String(isDark));
  themeButton.querySelector('span').textContent = isDark ? 'Day mode' : 'Night mode';
  themeButton.firstChild.textContent = isDark ? '☀ ' : '☾ ';
}

let savedTheme = 'light';
try {
  savedTheme = localStorage.getItem('k-explore-theme') || 'light';
} catch {
  // The page still works if the browser blocks local storage.
}
setTheme(savedTheme === 'dark');
themeButton.addEventListener('click', () => {
  const nextIsDark = document.body.dataset.theme !== 'dark';
  setTheme(nextIsDark);
  try {
    localStorage.setItem('k-explore-theme', nextIsDark ? 'dark' : 'light');
  } catch {
    // The theme applies for this visit even if it cannot be remembered.
  }
});
