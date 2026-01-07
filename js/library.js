// ========================================
// МОЯ ДОМАШНЯЯ БИЗНЕС-БИБЛИОТЕКА - ВЕРСИЯ 4.0
// С номерами на полке и сортировкой по фамилиям
// ========================================

class Library {
    constructor() {
        this.books = books || [];
        this.favorites = this.loadFavorites();
        this.currentView = 'grid-3';
        this.currentFilters = {
            favorite: 'all',
            genre: 'all',
            sort: 'title-asc'
        };
        
        this.init();
    }
    
    // ========================================
    // INITIALIZATION
    // ========================================
    
    init() {
        this.cacheElements();
        this.bindEvents();
        this.render();
        this.updateStats();
    }
    
    cacheElements() {
        this.booksContainer = document.getElementById('booksContainer');
        this.emptyState = document.getElementById('emptyState');
        this.totalBooksEl = document.getElementById('totalBooks');
        this.likedCountEl = document.getElementById('likedCount');
        
        // Filters
        this.favoriteFilter = document.getElementById('favoriteFilter');
        this.genreFilter = document.getElementById('genreFilter');
        this.sortFilter = document.getElementById('sortFilter');
        this.viewFilter = document.getElementById('viewFilter');
        
        // Modal
        this.modal = document.getElementById('bookModal');
        this.modalBody = document.getElementById('modalBody');
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.modalOverlay = this.modal.querySelector('.modal-overlay');
    }
    
    bindEvents() {
        // Filters
        this.favoriteFilter.addEventListener('change', () => this.handleFilterChange());
        this.genreFilter.addEventListener('change', () => this.handleFilterChange());
        this.sortFilter.addEventListener('change', () => this.handleFilterChange());
        
        // View select
        this.viewFilter.addEventListener('change', (e) => this.switchView(e.target.value));
        
        // Modal
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.modalOverlay.addEventListener('click', () => this.closeModal());
        
        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    }
    
    // ========================================
    // FILTERS & SORTING
    // ========================================
    
    handleFilterChange() {
        this.currentFilters = {
            favorite: this.favoriteFilter.value,
            genre: this.genreFilter.value,
            sort: this.sortFilter.value
        };
        this.render();
    }
    
    getFilteredBooks() {
        let filtered = [...this.books];
        
        // Filter by favorite
        if (this.currentFilters.favorite === 'liked') {
            filtered = filtered.filter(book => this.favorites.includes(book.id));
        }
        
        // Filter by genre
        if (this.currentFilters.genre !== 'all') {
            filtered = filtered.filter(book => 
                book.genreKeys && book.genreKeys.includes(this.currentFilters.genre)
            );
        }
        
        // Sort
        filtered = this.sortBooks(filtered, this.currentFilters.sort);
        
        return filtered;
    }
    
    sortBooks(books, sortType) {
        const sorted = [...books];
        
        switch(sortType) {
            case 'title-asc':
                return sorted.sort((a, b) => a.title.localeCompare(b.title, 'ru'));
            
            case 'title-desc':
                return sorted.sort((a, b) => b.title.localeCompare(a.title, 'ru'));
            
            case 'author-asc':
                return sorted.sort((a, b) => {
                    const authorA = a.author || 'zzz';
                    const authorB = b.author || 'zzz';
                    return authorA.localeCompare(authorB, 'ru');
                });
            
            case 'author-desc':
                return sorted.sort((a, b) => {
                    const authorA = a.author || '';
                    const authorB = b.author || '';
                    return authorB.localeCompare(authorA, 'ru');
                });
            
            case 'shelf-asc':
                return sorted.sort((a, b) => (a.shelfNumber || 9999) - (b.shelfNumber || 9999));
            
            case 'shelf-desc':
                return sorted.sort((a, b) => (b.shelfNumber || 0) - (a.shelfNumber || 0));
            
            default:
                return sorted;
        }
    }
    
    // ========================================
    // VIEW MANAGEMENT
    // ========================================
    
    switchView(view) {
        this.currentView = view;
        this.viewFilter.value = view;
        this.booksContainer.className = `books-grid ${view}`;
    }
    
    // ========================================
    // RENDERING
    // ========================================
    
    render() {
        const filtered = this.getFilteredBooks();
        
        if (filtered.length === 0) {
            this.booksContainer.style.display = 'none';
            this.emptyState.style.display = 'block';
            return;
        }
        
        this.booksContainer.style.display = '';
        this.emptyState.style.display = 'none';
        
        this.booksContainer.innerHTML = filtered.map(book => 
            this.renderBookCard(book)
        ).join('');
        
        this.bindCardEvents();
    }
    
    renderBookCard(book) {
        const isLiked = this.favorites.includes(book.id);
        const isListView = this.currentView === 'list-view';
        
        // Format metadata
        const publisher = book.publisher 
            ? `<span><i class="fas fa-building"></i> ${book.publisher}</span>` 
            : '<span class="meta-missing">Издательство: не найдено</span>';
        
        const year = book.year 
            ? `<span><i class="fas fa-calendar"></i> ${book.year}</span>` 
            : '<span class="meta-missing">Год: не найдено</span>';
        
        const shelfNumber = book.shelfNumber 
            ? `<div class="shelf-number">#${book.shelfNumber}</div>` 
            : '';
        
        const description = isListView && book.description 
            ? `<div class="book-description">${book.description}</div>` 
            : '';
        
        return `
            <div class="book-card" data-id="${book.id}">
                ${shelfNumber}
                <img src="${book.cover}" alt="${book.title}" class="book-cover" loading="lazy">
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    <p class="book-author">${book.author || 'Автор неизвестен'}</p>
                    ${description}
                    <div class="book-meta">
                        <span>${publisher}</span>
                        <span>${year}</span>
                    </div>
                    <button class="like-btn ${isLiked ? 'liked' : ''}" data-id="${book.id}" onclick="event.stopPropagation()">
                        <i class="fas fa-heart"></i>
                        ${isLiked ? 'В избранном' : 'Добавить в избранное'}
                    </button>
                </div>
            </div>
        `;
    }
    
    bindCardEvents() {
        // Open modal on card click
        document.querySelectorAll('.book-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.like-btn')) {
                    const bookId = parseInt(card.dataset.id);
                    this.openModal(bookId);
                }
            });
        });
        
        // Like buttons
        document.querySelectorAll('.like-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const bookId = parseInt(btn.dataset.id);
                this.toggleFavorite(bookId);
            });
        });
    }
    
    // ========================================
    // MODAL
    // ========================================
    
    openModal(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (!book) return;
        
        const isLiked = this.favorites.includes(bookId);
        
        // Format details
        const publisher = book.publisher 
            ? `<span>${book.publisher}</span>` 
            : '<span class="meta-missing">Издательство: не найдено</span>';
        
        const year = book.year 
            ? `<span>${book.year}</span>` 
            : '<span class="meta-missing">Год: не найдено</span>';
        
        const isbn = book.isbn 
            ? `<div class="modal-detail">
                <i class="fas fa-barcode"></i>
                <strong>ISBN:</strong>
                <span>${book.isbn}</span>
            </div>` 
            : '';
        
        const series = book.series 
            ? `<div class="modal-detail">
                <i class="fas fa-layer-group"></i>
                <strong>Серия:</strong>
                <span>${book.series}</span>
            </div>` 
            : '';
        
        const subtitle = book.subtitle 
            ? `<div class="modal-subtitle">${book.subtitle}</div>` 
            : '';
        
        const genres = book.genres && book.genres.length > 0
            ? `<div class="modal-genres">
                ${book.genres.map(g => `<span class="genre-tag">${g}</span>`).join('')}
            </div>`
            : '';
        
        this.modalBody.innerHTML = `
            <div class="modal-book">
                <img src="${book.cover}" alt="${book.title}" class="modal-cover">
                <div class="modal-info">
                    <div class="modal-shelf">#${book.shelfNumber || '?'} на полке</div>
                    <h2 class="modal-title">${book.title}</h2>
                    ${subtitle}
                    <div class="modal-author">${book.author || 'Автор неизвестен'}</div>
                    
                    <div class="modal-details">
                        <div class="modal-detail">
                            <i class="fas fa-building"></i>
                            <strong>Издательство:</strong>
                            ${publisher}
                        </div>
                        <div class="modal-detail">
                            <i class="fas fa-calendar"></i>
                            <strong>Год:</strong>
                            ${year}
                        </div>
                        ${isbn}
                        ${series}
                    </div>
                    
                    <div class="modal-description">${book.description || 'Описание отсутствует.'}</div>
                    
                    ${genres}
                    
                    <button class="modal-like-btn ${isLiked ? 'liked' : ''}" data-id="${bookId}">
                        <i class="fas fa-heart"></i>
                        ${isLiked ? 'Убрать из избранного' : 'Добавить в избранное'}
                    </button>
                </div>
            </div>
        `;
        
        // Bind modal like button
        this.modalBody.querySelector('.modal-like-btn').addEventListener('click', () => {
            this.toggleFavorite(bookId);
        });
        
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    
    closeModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // ========================================
    // FAVORITES
    // ========================================
    
    toggleFavorite(bookId) {
        const index = this.favorites.indexOf(bookId);
        
        if (index > -1) {
            this.favorites.splice(index, 1);
        } else {
            this.favorites.push(bookId);
        }
        
        this.saveFavorites();
        this.render();
        this.updateStats();
        
        // Update modal if open
        if (this.modal.classList.contains('active')) {
            const modalBtn = this.modalBody.querySelector('.modal-like-btn');
            if (modalBtn && parseInt(modalBtn.dataset.id) === bookId) {
                const isLiked = this.favorites.includes(bookId);
                modalBtn.classList.toggle('liked', isLiked);
                modalBtn.innerHTML = `
                    <i class="fas fa-heart"></i>
                    ${isLiked ? 'Убрать из избранного' : 'Добавить в избранное'}
                `;
            }
        }
    }
    
    loadFavorites() {
        const saved = localStorage.getItem('library_favorites');
        return saved ? JSON.parse(saved) : [];
    }
    
    saveFavorites() {
        localStorage.setItem('library_favorites', JSON.stringify(this.favorites));
    }
    
    // ========================================
    // STATS
    // ========================================
    
    updateStats() {
        this.totalBooksEl.textContent = this.books.length;
        this.likedCountEl.textContent = this.favorites.length;
    }
}

// ========================================
// INITIALIZE
// ========================================

document.addEventListener('DOMContentLoaded', () => {
    window.library = new Library();
});
