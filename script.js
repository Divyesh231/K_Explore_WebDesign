// Search, filtering and sorting for the event list.
const searchInput = document.querySelector('#search');
const eventCards = [...document.querySelectorAll('.event-card')];
const eventGrid = document.querySelector('#event-grid');
const eventFilter = document.querySelector('#event-filter');
const sortSelect = document.querySelector('#sort-by');
const noResults = document.querySelector('#no-results');
const resultsCount = document.querySelector('#results-count');
const storageKey = 'k-explore-registrations';
const eventSelect = document.querySelector('#event');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const filterHideTimers = new WeakMap();

if (!reduceMotion && 'IntersectionObserver' in window) {
  const revealTargets = document.querySelectorAll(
    '.section-heading,.countdown,.event-card,.signup-section .signup-aside,.signup-section form'
  );
  const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -32px 0px' });

  revealTargets.forEach((target, index) => {
    target.classList.add('reveal-on-scroll');
    target.style.setProperty('--reveal-delay', `${Math.min(index % 6, 5) * 65}ms`);
    revealObserver.observe(target);
  });
}

// The capacity figures are sample values stored on each event card.
function renderAvailability() {
  const registrations = getRegistrations();
  eventCards.forEach((card) => {
    const capacity = Math.max(1, Number(card.dataset.capacity) || 1);
    const sampleSpotsLeft = Number(card.dataset.initialSpotsLeft ?? card.dataset.spotsLeft) || 0;
    card.dataset.initialSpotsLeft = String(sampleSpotsLeft);
    const eventName = card.querySelector('h3').textContent;
    const localSignups = registrations.filter((registration) => registration.event === eventName).length;
    const spotsLeft = Math.max(0, Math.min(capacity, sampleSpotsLeft - localSignups));
    card.dataset.currentSpotsLeft = String(spotsLeft);
    const filledPercent = Math.round(((capacity - spotsLeft) / capacity) * 100);
    const leftText = `${spotsLeft} ${spotsLeft === 1 ? 'spot' : 'spots'} left`;
    const track = card.querySelector('.availability-track');
    const availability = card.querySelector('.availability');

    card.querySelector('.availability-left').textContent = leftText;
    card.querySelector('.availability-bar').style.width = `${filledPercent}%`;
    track.setAttribute('aria-label', `${eventName} sample availability`);
    track.setAttribute('aria-valuenow', String(filledPercent));
    track.setAttribute('aria-valuetext', leftText);
    track.classList.toggle('almost-full', filledPercent >= 75);
    availability.classList.toggle('almost-full', filledPercent >= 75);

    const eventOption = [...eventSelect.options].find((option) => option.value === eventName);
    if (eventOption) {
      eventOption.dataset.defaultLabel ||= eventOption.textContent;
      eventOption.disabled = spotsLeft === 0;
      eventOption.textContent = spotsLeft === 0 ? `${eventOption.dataset.defaultLabel} — full` : eventOption.dataset.defaultLabel;
    }
  });
}

renderAvailability();
const favoritesKey = 'k-explore-favorites';
const favoriteButtons = document.querySelectorAll('[data-favorite]');

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
  const selectedFilter = eventFilter.value;
  const now = Date.now();
  const comingSoonCutoff = now + 14 * 24 * 60 * 60 * 1000;
  let visibleCount = 0;

  eventCards.forEach((card) => {
    const cardDescription = [
      card.querySelector('h3').textContent,
      card.querySelector('.event-card > p').textContent,
      card.querySelector('.card-bottom > span').textContent
    ].join(' ');
    const searchableText = `${card.dataset.search} ${cardDescription}`.toLowerCase();
    const searchMatches = searchableText.includes(searchTerm);
    const isSaved = favoriteIds.includes(card.querySelector('[data-details]').dataset.details);
    const startsAt = new Date(card.dataset.start).getTime();
    const capacity = Number(card.dataset.capacity) || 1;
    const spotsLeft = Number(card.dataset.currentSpotsLeft ?? card.dataset.spotsLeft) || 0;
    const isAlmostFull = ((capacity - spotsLeft) / capacity) >= .75;
    const filterMatches = selectedFilter === 'all'
      || selectedFilter === card.dataset.category
      || (selectedFilter === 'soon' && startsAt >= now && startsAt <= comingSoonCutoff)
      || (selectedFilter === 'almost' && isAlmostFull)
      || (selectedFilter === 'saved' && isSaved);
    const showCard = filterMatches && searchMatches;

    if (showCard) {
      const hideTimer = filterHideTimers.get(card);
      if (hideTimer) window.clearTimeout(hideTimer);
      filterHideTimers.delete(card);
      card.classList.remove('is-filtering-out');
      if (card.hidden) {
        card.hidden = false;
        if (!reduceMotion) card.animate([
          { opacity: 0, transform: 'translateY(8px)' },
          { opacity: 1, transform: 'translateY(0)' }
        ], { duration: 360, easing: 'cubic-bezier(.2,.7,.2,1)' });
      }
    } else if (!card.hidden && !reduceMotion) {
      if (!filterHideTimers.has(card)) {
        card.classList.add('is-filtering-out');
        const hideTimer = window.setTimeout(() => {
          card.hidden = true;
          card.classList.remove('is-filtering-out');
          filterHideTimers.delete(card);
        }, 240);
        filterHideTimers.set(card, hideTimer);
      }
    } else {
      card.hidden = true;
    }
    if (showCard) visibleCount += 1;
  });

  noResults.hidden = visibleCount > 0;
  noResults.textContent = selectedFilter === 'saved'
    ? 'No saved events match. Save an event with ♡ to keep it here.'
    : selectedFilter === 'soon'
      ? 'No upcoming events in the next 14 days match these filters.'
      : selectedFilter === 'almost'
        ? 'No almost-full events match these filters.'
        : 'No plans found. Try another search?';
  resultsCount.textContent = `${visibleCount} event${visibleCount === 1 ? '' : 's'} shown.`;
}

function sortEventCards() {
  const oldPositions = new Map(eventCards.filter((card) => !card.hidden)
    .map((card) => [card, card.getBoundingClientRect()]));
  const sortBy = sortSelect.value;
  const sorted = [...eventCards].sort((a, b) => {
    if (sortBy === 'name') return a.querySelector('h3').textContent.localeCompare(b.querySelector('h3').textContent);
    if (sortBy === 'spots') {
      return Number(b.dataset.currentSpotsLeft ?? b.dataset.spotsLeft) - Number(a.dataset.currentSpotsLeft ?? a.dataset.spotsLeft);
    }
    return new Date(a.dataset.start) - new Date(b.dataset.start);
  });
  eventGrid.append(...sorted);

  if (reduceMotion) return;
  sorted.filter((card) => !card.hidden).forEach((card) => {
    const previous = oldPositions.get(card);
    if (!previous) return;
    const current = card.getBoundingClientRect();
    const offsetX = previous.left - current.left;
    const offsetY = previous.top - current.top;
    if (!offsetX && !offsetY) return;
    card.animate([
      { transform: `translate(${offsetX}px, ${offsetY}px)` },
      { transform: 'translate(0, 0)' }
    ], { duration: 360, easing: 'cubic-bezier(.2,.7,.2,1)' });
  });
}

function refreshEventAvailability() {
  renderAvailability();
  updateEvents();
  if (sortSelect.value === 'spots') sortEventCards();
}

searchInput.addEventListener('input', updateEvents);
updateEvents();
eventFilter.addEventListener('change', updateEvents);
sortSelect.addEventListener('change', sortEventCards);

function renderFavorites() {
  favoriteButtons.forEach((button) => {
    const isSaved = favoriteIds.includes(button.dataset.favorite);
    button.setAttribute('aria-pressed', String(isSaved));
    button.textContent = isSaved ? '♥ Saved' : '♡ Save';
  });
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

renderFavorites();

// A card's sign-up link preselects that event in the form.
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
  const clockValues = [
    [countdownFields.days, Math.floor(remaining / 86400000)],
    [countdownFields.hours, Math.floor((remaining % 86400000) / 3600000)],
    [countdownFields.minutes, Math.floor((remaining % 3600000) / 60000)],
    [countdownFields.seconds, Math.floor((remaining % 60000) / 1000)]
  ];
  clockValues.forEach(([field, value]) => {
    const nextValue = String(value).padStart(2, '0');
    if (field.textContent === nextValue) return;
    field.textContent = nextValue;
    if (!reduceMotion) field.animate([
      { opacity: .35, transform: 'translateY(-5px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], { duration: 240, easing: 'ease-out' });
  });
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
      refreshEventAvailability();
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

  const selectedCard = eventCards.find((card) => card.querySelector('h3').textContent === eventSelect.value);
  if (!selectedCard || Number(selectedCard.dataset.currentSpotsLeft) <= 0) {
    message.textContent = 'That sample event is full. Please choose another one.';
    return;
  }

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
    ? `You're on the list, ${registration.name.split(/\s+/)[0]}! This browser saved your plan and updated the spots left.`
    : 'Thanks! Your form is complete, but this browser could not save the plan.';

  form.reset();
  phoneInput.setCustomValidity('');
  renderRegistrations();
  refreshEventAvailability();
});

document.querySelector('#clear-plans').addEventListener('click', () => {
  if (!window.confirm('Clear all saved plans from this browser?')) return;
  saveRegistrations([]);
  renderRegistrations();
  refreshEventAvailability();
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
