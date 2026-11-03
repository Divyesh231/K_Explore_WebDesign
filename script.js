// A small interaction: choose an event card to fill in the form.
const eventLinks = document.querySelectorAll('.event-link');
const eventSelect = document.querySelector('#event');

eventLinks.forEach((link) => {
  link.addEventListener('click', () => {
    eventSelect.value = link.dataset.event;
  });
});

// Show a confirmation in the page when the form is submitted.
const form = document.querySelector('#registration-form');
const confirmation = document.querySelector('#confirmation');
const phoneInput = document.querySelector('#phone');

// A phone number can include spaces, +, or brackets, but needs 10 to 15 digits.
function checkPhoneNumber() {
  const digitCount = phoneInput.value.replace(/\D/g, '').length;

  if (digitCount < 10 || digitCount > 15) {
    phoneInput.setCustomValidity('Enter a phone number with 10 to 15 digits.');
  } else {
    phoneInput.setCustomValidity('');
  }
}

phoneInput.addEventListener('input', checkPhoneNumber);

form.addEventListener('submit', (event) => {
  event.preventDefault();
  confirmation.textContent = '';

  checkPhoneNumber();
  if (!form.reportValidity()) return;

  const name = document.querySelector('#name').value.trim();
  const eventName = eventSelect.value;
  confirmation.textContent = `Thanks, ${name}! You picked ${eventName}.`;
  form.reset();
  phoneInput.setCustomValidity('');
});

// Search the event cards and optionally show one category at a time.
const searchInput = document.querySelector('#event-search');
const categoryFilter = document.querySelector('#category-filter');
const eventCards = document.querySelectorAll('.event-card');
const resultsMessage = document.querySelector('#event-results');

function filterEvents() {
  const searchText = searchInput.value.trim().toLowerCase();
  const chosenCategory = categoryFilter.value;
  let visibleEvents = 0;

  eventCards.forEach((card) => {
    const categoryMatches = chosenCategory === 'all' || card.dataset.category === chosenCategory;
    const textMatches = card.textContent.toLowerCase().includes(searchText);
    const shouldShow = categoryMatches && textMatches;

    card.hidden = !shouldShow;
    if (shouldShow) visibleEvents += 1;
  });

  if (visibleEvents === 0) {
    resultsMessage.textContent = 'No events match that search. Try another word or choose all events.';
  } else {
    resultsMessage.textContent = `${visibleEvents} event${visibleEvents === 1 ? '' : 's'} shown.`;
  }
}

searchInput.addEventListener('input', filterEvents);
categoryFilter.addEventListener('change', filterEvents);
