// Global variables
const BASE_URL = 'http://localhost:3000';
let currentFilm = null;

// DOM Elements
const filmsList = document.getElementById('films');
const posterImg = document.querySelector('#poster img');
const titleElement = document.getElementById('title');
const runtimeElement = document.getElementById('runtime');
const showtimeElement = document.getElementById('showtime');
const ticketsElement = document.getElementById('tickets-available');
const descriptionElement = document.getElementById('description');
const buyTicketBtn = document.getElementById('buy-ticket');

// Event Listeners
document.addEventListener('DOMContentLoaded', initialize);
buyTicketBtn.addEventListener('click', handleBuyTicket);

// Functions
async function initialize() {
  await loadAllFilms();
  await loadFilmDetails(1); // Load the first film by default
}

async function loadAllFilms() {
  try {
    const response = await fetch(`${BASE_URL}/films`);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const films = await response.json();
    
    // Clear any existing films in the list
    filmsList.innerHTML = '';
    
    // Populate the films list
    films.forEach(film => {
      const li = document.createElement('li');
      li.classList.add('film', 'item');
      li.dataset.id = film.id;
      
      // Check if sold out
      if (film.tickets_sold >= film.capacity) {
        li.classList.add('sold-out');
      }
      
      // Create film title element
      const filmTitle = document.createElement('span');
      filmTitle.textContent = film.title;
      li.appendChild(filmTitle);
      
      // Create delete button
      const deleteBtn = document.createElement('button');
      deleteBtn.classList.add('delete-btn');
      deleteBtn.textContent = 'Delete';
      deleteBtn.addEventListener('click', (event) => {
        event.stopPropagation(); // Prevent triggering the li click event
        handleDeleteFilm(film.id);
      });
      li.appendChild(deleteBtn);
      
      // Add click event to show film details
      li.addEventListener('click', () => loadFilmDetails(film.id));
      
      filmsList.appendChild(li);
    });
  } catch (error) {
    console.error('Error loading films:', error);
    filmsList.innerHTML = '<li>Error loading films. Please try again later.</li>';
  }
}

async function loadFilmDetails(filmId) {
  try {
    const response = await fetch(`${BASE_URL}/films/${filmId}`);
    if (!response.ok) throw new Error('Network response was not ok');
    
    const film = await response.json();
    currentFilm = film;
    
    // Update the film details section
    posterImg.src = film.poster;
    posterImg.alt = `${film.title} Poster`;
    titleElement.textContent = film.title;
    runtimeElement.textContent = `Runtime: ${film.runtime} minutes`;
    showtimeElement.textContent = `Showtime: ${film.showtime}`;
    
    const availableTickets = film.capacity - film.tickets_sold;
    ticketsElement.textContent = `Available Tickets: ${availableTickets}`;
    
    descriptionElement.textContent = film.description;
    
    // Update the buy ticket button
    if (availableTickets <= 0) {
      buyTicketBtn.textContent = 'Sold Out';
      buyTicketBtn.disabled = true;
    } else {
      buyTicketBtn.textContent = 'Buy Ticket';
      buyTicketBtn.disabled = false;
    }
    
    // Highlight the current film in the list
    const filmItems = document.querySelectorAll('.film.item');
    filmItems.forEach(item => {
      if (item.dataset.id === filmId.toString()) {
        item.style.backgroundColor = '#ddeeff';
      } else {
        item.style.backgroundColor = '';
      }
    });
    
  } catch (error) {
    console.error('Error loading film details:', error);
    titleElement.textContent = 'Error loading film details';
    descriptionElement.textContent = 'Please try again later.';
  }
}

async function handleBuyTicket() {
  if (!currentFilm || buyTicketBtn.disabled) return;
  
  try {
    // Check if tickets are available
    const availableTickets = currentFilm.capacity - currentFilm.tickets_sold;
    if (availableTickets <= 0) {
      alert('Sorry, this showing is sold out!');
      return;
    }
    
    // Update tickets_sold on the server
    const updatedTicketsSold = currentFilm.tickets_sold + 1;
    const response = await fetch(`${BASE_URL}/films/${currentFilm.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        tickets_sold: updatedTicketsSold
      })
    });
    
    if (!response.ok) throw new Error('Failed to update ticket count');
    
    // Post new ticket to the tickets endpoint
    const ticketResponse = await fetch(`${BASE_URL}/tickets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        film_id: currentFilm.id,
        number_of_tickets: 1
      })
    });
    
    if (!ticketResponse.ok) throw new Error('Failed to create ticket record');
    
    // Reload film details to update the UI
    await loadFilmDetails(currentFilm.id);
    
    // Refresh the film list to update sold out status
    await loadAllFilms();
    
    alert('Ticket purchased successfully!');
    
  } catch (error) {
    console.error('Error purchasing ticket:', error);
    alert('Error purchasing ticket. Please try again.');
  }
}

async function handleDeleteFilm(filmId) {
  if (confirm(`Are you sure you want to delete this film?`)) {
    try {
      const response = await fetch(`${BASE_URL}/films/${filmId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete film');
      
      // Reload the films list
      await loadAllFilms();
      
      // If the current film was deleted, load the first film
      if (currentFilm && currentFilm.id === filmId) {
        const firstFilm = document.querySelector('.film.item');
        if (firstFilm) {
          await loadFilmDetails(firstFilm.dataset.id);
        } else {
          // If no films left, clear the details section
          currentFilm = null;
          posterImg.src = '';
          titleElement.textContent = 'No films available';
          runtimeElement.textContent = '';
          showtimeElement.textContent = '';
          ticketsElement.textContent = '';
          descriptionElement.textContent = '';
          buyTicketBtn.disabled = true;
        }
      }
      
      alert('Film deleted successfully');
      
    } catch (error) {
      console.error('Error deleting film:', error);
      alert('Error deleting film. Please try again.');
    }
  }
}