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

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = document.querySelector('#name').value.trim();
  const eventName = eventSelect.value;
  confirmation.textContent = `Thanks, ${name}! You picked ${eventName}.`;
  form.reset();
});
