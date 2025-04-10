// DOM Elements
const filmsList = document.getElementById('films');
const poster = document.getElementById('poster');
const title = document.getElementById('title');
const description = document.getElementById('description');
const runtime = document.getElementById('runtime');
const showtime = document.getElementById('showtime');
const availableTickets = document.getElementById('available-tickets');
const buyTicketBtn = document.getElementById('buy-ticket');
const filmSearch = document.getElementById('film-search');
const loading = document.getElementById('loading');
const modal = document.getElementById('modal');
const modalMessage = document.getElementById('modal-message');
const modalConfirm = document.getElementById('modal-confirm');
const modalCancel = document.getElementById('modal-cancel');
const notification = document.getElementById('notification');

// State
let currentFilm = null;
let allFilms = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  fetchAllFilms();
});

// Fetch all films and display the first one
function fetchAllFilms() {
  showLoading();
  fetch('db.json')
    .then(response => response.json())
    .then(data => {
      allFilms = data.films;
      filmsList.innerHTML = '';
      allFilms.forEach(film => renderFilmInMenu(film));
      if (allFilms.length > 0) {
        currentFilm = allFilms[0];
        displayFilmDetails(allFilms[0]);
      }
      hideLoading();
    })
    .catch(error => showError('Failed to load films'));
}

// Fetch a single film by ID
function fetchFilmById(id) {
  showLoading();
  fetch('db.json')
    .then(response => response.json())
    .then(data => {
      const film = data.films.find(f => f.id === id);
      if (film) {
        currentFilm = film;
        displayFilmDetails(film);
      }
      hideLoading();
    })
    .catch(error => showError('Failed to load film details'));
}

// Render film in the menu
function renderFilmInMenu(film) {
  const li = document.createElement('li');
  li.classList.add('film', 'item');
  const available = film.capacity - film.tickets_sold;
  if (available === 0) li.classList.add('sold-out');
  li.innerHTML = `
    ${film.title}
    <button type="button" class="delete-btn" data-id="${film.id}">Delete</button>
  `;
  li.addEventListener('click', (e) => {
    if (e.target.tagName !== 'BUTTON') fetchFilmById(film.id);
  });
  li.querySelector('.delete-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    showModal(`Are you sure you want to delete "${film.title}"?`, () => deleteFilm(film.id, li));
  });
  filmsList.appendChild(li);
}

// Display film details
function displayFilmDetails(film) {
  const available = film.capacity - film.tickets_sold;
  poster.src = film.poster;
  poster.classList.remove('hidden');
  title.textContent = film.title;
  description.textContent = film.description;
  runtime.textContent = film.runtime;
  showtime.textContent = film.showtime;
  availableTickets.textContent = available;
  buyTicketBtn.disabled = available === 0;
  buyTicketBtn.textContent = available === 0 ? 'Sold Out' : 'Buy Ticket';
  buyTicketBtn.dataset.filmId = film.id;
}

// Buy ticket functionality
buyTicketBtn.addEventListener('click', () => {
  if (!currentFilm) return;
  showModal(`Buy a ticket for "${currentFilm.title}"?`, () => {
    const filmId = currentFilm.id;
    const currentAvailable = parseInt(availableTickets.textContent, 10);
    if (currentAvailable > 0) {
      const newTicketsSold = currentFilm.tickets_sold + 1;
      updateTicketsSold(filmId, newTicketsSold);
      postNewTicket(filmId, 1);
      currentFilm.tickets_sold = newTicketsSold;
      const newAvailable = currentFilm.capacity - newTicketsSold;
      availableTickets.textContent = newAvailable;
      buyTicketBtn.disabled = newAvailable === 0;
      buyTicketBtn.textContent = newAvailable === 0 ? 'Sold Out' : 'Buy Ticket';
      updateFilmInMenu(currentFilm);
      showNotification('Ticket purchased successfully!');
    }
  });
});

// Search functionality - new change in my first commit
filmSearch.addEventListener('input', (e) => {
  const query = e.target.value.toLowerCase();
  filmsList.innerHTML = '';
  allFilms
    .filter(film => film.title.toLowerCase().includes(query))
    .forEach(film => renderFilmInMenu(film));
});

// PATCH request to update tickets_sold
function updateTicketsSold(filmId, ticketsSold) {
  showLoading();
  // Since we're using static data, we'll just update the local state
  const updatedFilm = { ...currentFilm, tickets_sold: ticketsSold };
  currentFilm = updatedFilm;
  updateFilmInMenu(updatedFilm);
  hideLoading();
}

// POST request to add a new ticket
function postNewTicket(filmId, numberOfTickets) {
  // Since we're using static data, we'll just log the ticket purchase
  console.log('Ticket added:', { film_id: filmId, number_of_tickets: numberOfTickets });
}

// DELETE request to remove a film
function deleteFilm(filmId, liElement) {
  showLoading();
  // Since we're using static data, we'll just update the local state
  liElement.remove();
  allFilms = allFilms.filter(f => f.id !== filmId);
  if (currentFilm && currentFilm.id === filmId) {
    currentFilm = allFilms[0] || null;
    currentFilm ? displayFilmDetails(currentFilm) : clearFilmDetails();
  }
  hideLoading();
  showNotification('Film deleted successfully!');
}

// Update film in the menu
function updateFilmInMenu(updatedFilm) {
  const filmItems = filmsList.querySelectorAll('.film.item');
  filmItems.forEach(item => {
    if (item.querySelector('.delete-btn').dataset.id === updatedFilm.id) {
      const available = updatedFilm.capacity - updatedFilm.tickets_sold;
      item.classList.toggle('sold-out', available === 0);
    }
  });
}

// Clear film details
function clearFilmDetails() {
  poster.src = '';
  poster.classList.add('hidden');
  title.textContent = '';
  description.textContent = '';
  runtime.textContent = '';
  showtime.textContent = '';
  availableTickets.textContent = '';
  buyTicketBtn.textContent = 'Buy Ticket';
  buyTicketBtn.disabled = true;
  delete buyTicketBtn.dataset.filmId;
}

// Utility Functions
function showLoading() {
  loading.classList.remove('hidden');
}
function hideLoading() {
  loading.classList.add('hidden');
}
function showModal(message, onConfirm) {
  modalMessage.textContent = message;
  modal.classList.remove('hidden');
  modalConfirm.onclick = () => {
    onConfirm();
    modal.classList.add('hidden');
  };
  modalCancel.onclick = () => modal.classList.add('hidden');
}
function showNotification(message) {
  notification.textContent = message;
  notification.classList.remove('hidden');
  setTimeout(() => notification.classList.add('hidden'), 3000);
}
function showError(message) {
  showNotification(`Error: ${message}`);
  hideLoading();
}