// ===================================
// State Management
// ===================================
let currentView = 'grid'; // 'grid' or 'list'
let filteredBooks = [...books];
let likedBooks = JSON.parse(localStorage.getItem('likedBooks')) || [];

// ===================================
// DOM Elements
// ===================================
const favoriteFilter = document.getElementById('favoriteFilter');
const genreFilter = document.getElementById('genreFilter');
const sortBySelect = document.getElementById('sortBy');
const gridViewBtn = document.getElementById('gridView');
const listViewBtn = document.getElementById('listView');
const booksGrid = document.getElementById('booksGrid');
const noResults = document.getElementById('noResults');
const bookModal = document.getElementById('bookModal');
const closeModalBtn = document.getElementById('closeModal');
const modalBody = document.getElementById('modalBody');
const totalBooksEl = document.getElementById('totalBooks');
const likesCountEl = document.getElementById('likesCount');

// ===================================
// Initialization
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    renderBooks();
    attachEventListeners();
    updateLikesCount();
});

// ===================================
// Event Listeners
// ===================================
function attachEventListeners() {
    // Filters
    favoriteFilter.addEventListener('change', applyFilters);
    genreFilter.addEventListener('change', applyFilters);
    sortBySelect.addEventListener('change', applyFilters);

    // View toggle
    gridViewBtn.addEventListener('click', () => switchView('grid'));
    listViewBtn.addEventListener('click', () => switchView('list'));

    // Modal
    closeModalBtn.addEventListener('click', closeModal);
    bookModal.addEventListener('click', (e) => {
        if (e.target === bookModal) closeModal();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && bookModal.classList.contains('show')) {
            closeModal();
        }
    });
}

// ===================================
// Likes System
// ===================================
function toggleLike(bookId) {
    const index = likedBooks.indexOf(bookId);
    
    if (index > -1) {
        // Remove from likes
        likedBooks.splice(index, 1);
    } else {
        // Add to likes
        likedBooks.push(bookId);
    }
    
    // Save to localStorage
    localStorage.setItem('likedBooks', JSON.stringify(likedBooks));
    
    // Update UI
    updateLikesCount();
    renderBooks();
}

function isLiked(bookId) {
    return likedBooks.includes(bookId);
}

function updateLikesCount() {
    if (likesCountEl) {
        likesCountEl.textContent = likedBooks.length;
    }
}

// ===================================
// Filtering & Sorting
// ===================================
function applyFilters() {
    let result = [...books];
    
    // Filter by favorites
    const favoriteValue = favoriteFilter.value;
    if (favoriteValue === 'liked') {
        result = result.filter(book => isLiked(book.id));
    }
    
    // Filter by genre
    const genreValue = genreFilter.value;
    if (genreValue !== 'all') {
        result = result.filter(book => 
            book.genreKeys && book.genreKeys.includes(genreValue)
        );
    }
    
    // Sort
    const sortValue = sortBySelect.value;
    result = sortBooks(result, sortValue);
    
    filteredBooks = result;
    renderBooks();
}

function sortBooks(booksArray, sortBy) {
    const sorted = [...booksArray];
    
    switch(sortBy) {
        case 'title-asc':
            return sorted.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
        case 'title-desc':
            return sorted.sort((a, b) => b.title.localeCompare(a.title, 'ru'));
        case 'author-asc':
            return sorted.sort((a, b) => (a.author || '').localeCompare(b.author || '', 'ru'));
        case 'author-desc':
            return sorted.sort((a, b) => (b.author || '').localeCompare(a.author || '', 'ru'));
        case 'year-desc':
            return sorted.sort((a, b) => (b.year || 0) - (a.year || 0));
        case 'year-asc':
            return sorted.sort((a, b) => (a.year || 0) - (b.year || 0));
        default:
            return sorted;
    }
}

// ===================================
// View Switching
// ===================================
function switchView(view) {
    currentView = view;
    
    // Update buttons
    gridViewBtn.classList.toggle('active', view === 'grid');
    listViewBtn.classList.toggle('active', view === 'list');
    
    // Update grid class
    booksGrid.classList.toggle('list-view', view === 'list');
    
    renderBooks();
}

// ===================================
// Rendering
// ===================================
function renderBooks() {
    if (filteredBooks.length === 0) {
        booksGrid.style.display = 'none';
        noResults.style.display = 'flex';
        return;
    }
    
    booksGrid.style.display = 'grid';
    noResults.style.display = 'none';
    
    booksGrid.innerHTML = filteredBooks.map(book => createBookCard(book)).join('');
    
    // Attach click listeners to cards and like buttons
    filteredBooks.forEach(book => {
        const card = document.querySelector(`[data-book-id="${book.id}"]`);
        const likeBtn = card.querySelector('.like-btn');
        
        // Click on card opens modal
        card.addEventListener('click', (e) => {
            if (!e.target.closest('.like-btn')) {
                openModal(book);
            }
        });
        
        // Click on like button toggles like
        likeBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleLike(book.id);
        });
    });
}

function createBookCard(book) {
    const liked = isLiked(book.id);
    const likeClass = liked ? 'liked' : '';
    const heartIcon = liked ? 'fas fa-heart' : 'far fa-heart';
    
    return `
        <div class="book-card ${currentView === 'list' ? 'list-item' : ''}" data-book-id="${book.id}">
            <button class="like-btn ${likeClass}" title="${liked ? 'Убрать из избранного' : 'Добавить в избранное'}">
                <i class="${heartIcon}"></i>
            </button>
            <div class="book-cover">
                <img src="${book.cover}" alt="${book.title}" loading="lazy" onerror="this.src='https://via.placeholder.com/200x300?text=Нет+обложки'">
            </div>
            <div class="book-info">
                <h3 class="book-title">${book.title}</h3>
                ${book.subtitle ? `<p class="book-subtitle">${book.subtitle}</p>` : ''}
                <p class="book-author">${book.author || 'Автор не указан'}</p>
                <div class="book-meta">
                    ${book.publisher ? `<span><i class="fas fa-building"></i> ${book.publisher}</span>` : ''}
                    ${book.year ? `<span><i class="fas fa-calendar"></i> ${book.year}</span>` : ''}
                </div>
                <div class="book-genres">
                    ${book.genres ? book.genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('') : ''}
                </div>
            </div>
        </div>
    `;
}

// ===================================
// Modal
// ===================================
function openModal(book) {
    const liked = isLiked(book.id);
    const likeClass = liked ? 'liked' : '';
    const heartIcon = liked ? 'fas fa-heart' : 'far fa-heart';
    
    modalBody.innerHTML = `
        <div class="modal-book-details">
            <button class="modal-like-btn ${likeClass}" onclick="toggleLike(${book.id})" title="${liked ? 'Убрать из избранного' : 'Добавить в избранное'}">
                <i class="${heartIcon}"></i>
                <span>${liked ? 'В избранном' : 'Добавить в избранное'}</span>
            </button>
            <div class="modal-cover">
                <img src="${book.cover}" alt="${book.title}" onerror="this.src='https://via.placeholder.com/300x450?text=Нет+обложки'">
            </div>
            <div class="modal-info">
                <h2>${book.title}</h2>
                ${book.subtitle ? `<h3 class="modal-subtitle">${book.subtitle}</h3>` : ''}
                
                <div class="modal-meta">
                    ${book.author ? `
                        <div class="meta-item">
                            <i class="fas fa-user"></i>
                            <span><strong>Автор:</strong> ${book.author}</span>
                        </div>
                    ` : ''}
                    
                    ${book.publisher ? `
                        <div class="meta-item">
                            <i class="fas fa-building"></i>
                            <span><strong>Издательство:</strong> ${book.publisher}</span>
                        </div>
                    ` : ''}
                    
                    ${book.year ? `
                        <div class="meta-item">
                            <i class="fas fa-calendar"></i>
                            <span><strong>Год издания:</strong> ${book.year}</span>
                        </div>
                    ` : ''}
                    
                    ${book.isbn ? `
                        <div class="meta-item">
                            <i class="fas fa-barcode"></i>
                            <span><strong>ISBN:</strong> ${book.isbn}</span>
                        </div>
                    ` : ''}
                    
                    ${book.series ? `
                        <div class="meta-item">
                            <i class="fas fa-book"></i>
                            <span><strong>Серия:</strong> ${book.series}</span>
                        </div>
                    ` : ''}
                </div>
                
                ${book.description ? `
                    <div class="modal-description">
                        <h4><i class="fas fa-align-left"></i> Описание</h4>
                        <p>${book.description}</p>
                    </div>
                ` : ''}
                
                ${book.genres && book.genres.length > 0 ? `
                    <div class="modal-genres">
                        <h4><i class="fas fa-tags"></i> Жанры</h4>
                        <div class="genre-tags">
                            ${book.genres.map(genre => `<span class="genre-tag">${genre}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    bookModal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    bookModal.classList.remove('show');
    document.body.style.overflow = '';
}
