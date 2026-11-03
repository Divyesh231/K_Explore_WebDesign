// Search and category buttons narrow down the event cards.
const searchInput = document.querySelector('#search');
const filterButtons = document.querySelectorAll('.filter');
const eventCards = document.querySelectorAll('.event-card');
const noResults = document.querySelector('#no-results');
let selectedCategory = 'all';

function updateEvents() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  let visibleCount = 0;

  eventCards.forEach((card) => {
    const categoryMatches = selectedCategory === 'all' || card.dataset.category === selectedCategory;
    const searchMatches = card.dataset.search.includes(searchTerm);
    const showCard = categoryMatches && searchMatches;

    card.hidden = !showCard;
    if (showCard) visibleCount += 1;
  });

  noResults.hidden = visibleCount > 0;
}

searchInput.addEventListener('input', updateEvents);
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
    where: 'Saheed Nagar, Bhubaneswar',
    extra: 'Sample event for this student project.'
  },
  zine: {
    title: 'Make a Mess: Zine Workshop',
    category: 'ART / WORKSHOP',
    description: 'Make a small paper zine with scissors, markers and whatever you have to say.',
    when: 'Saturday, 14 November · 11:00 AM',
    where: 'Unit 3, Bhubaneswar',
    extra: 'Paper and basic materials are included. Sample event for this project.'
  },
  supper: {
    title: 'Sunday Supper Club',
    category: 'FOOD / SHARED DINNER',
    description: 'A shared dinner with a set menu and room at the table for a few more people.',
    when: 'Sunday, 15 November · 7:00 PM',
    where: 'Old Town, Bhubaneswar',
    extra: 'Please tell the host about dietary needs before the day. Sample event for this project.'
  }
};

const detailsDialog = document.querySelector('#event-dialog');
const dialogRegister = document.querySelector('#dialog-register');

document.querySelectorAll('[data-details]').forEach((button) => {
  button.addEventListener('click', () => {
    const details = eventDetails[button.dataset.details];
    if (!details) return;

    document.querySelector('#dialog-category').textContent = details.category;
    document.querySelector('#dialog-title').textContent = details.title;
    document.querySelector('#dialog-description').textContent = details.description;
    document.querySelector('#dialog-when').textContent = details.when;
    document.querySelector('#dialog-where').textContent = details.where;
    document.querySelector('#dialog-extra').textContent = details.extra;
    dialogRegister.dataset.event = details.title;
    detailsDialog.showModal();
  });
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
