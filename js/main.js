// =============================================
// НОВАЯ БИБЛИОТЕКА - ГЛАВНАЯ ЛОГИКА
// =============================================

class Library {
    constructor() {
        this.books = books || [];
        this.likedBooks = this.loadLikes();
        this.currentView = 'grid';
        this.filters = {
            favorite: 'all',
            genre: 'all',
            sort: 'title-asc'
        };
        
        this.init();
    }

    // === Initialization ===
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.render();
        this.updateStats();
    }

    cacheDOM() {
        // Containers
        this.booksContainer = document.getElementById('booksContainer');
        this.emptyState = document.getElementById('emptyState');
        this.modal = document.getElementById('bookModal');
        this.modalContent = document.getElementById('modalContent');
        
        // Filters
        this.favoriteFilter = document.getElementById('favoriteFilter');
        this.genreFilter = document.getElementById('genreFilter');
        this.sortFilter = document.getElementById('sortFilter');
        
        // View buttons
        this.gridViewBtn = document.getElementById('gridViewBtn');
        this.listViewBtn = document.getElementById('listViewBtn');
        
        // Stats
        this.totalBooksEl = document.getElementById('totalBooks');
        this.likedCountEl = document.getElementById('likedCount');
        
        // Modal
        this.closeModalBtn = document.getElementById('closeModalBtn');
        this.modalOverlay = this.modal.querySelector('.modal-overlay');
    }

    bindEvents() {
        // Filters
        this.favoriteFilter.addEventListener('change', () => this.onFilterChange());
        this.genreFilter.addEventListener('change', () => this.onFilterChange());
        this.sortFilter.addEventListener('change', () => this.onFilterChange());
        
        // View toggle
        this.gridViewBtn.addEventListener('click', () => this.setView('grid'));
        this.listViewBtn.addEventListener('click', () => this.setView('list'));
        
        // Modal close
        this.closeModalBtn.addEventListener('click', () => this.closeModal());
        this.modalOverlay.addEventListener('click', () => this.closeModal());
        
        // Keyboard
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.closeModal();
        });
    }

    // === Likes System ===
    loadLikes() {
        try {
            const saved = localStorage.getItem('library_likes');
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error('Error loading likes:', e);
            return [];
        }
    }

    saveLikes() {
        try {
            localStorage.setItem('library_likes', JSON.stringify(this.likedBooks));
        } catch (e) {
            console.error('Error saving likes:', e);
        }
    }

    toggleLike(bookId) {
        const index = this.likedBooks.indexOf(bookId);
        
        if (index > -1) {
            this.likedBooks.splice(index, 1);
        } else {
            this.likedBooks.push(bookId);
        }
        
        this.saveLikes();
        this.render();
        this.updateStats();
    }

    isLiked(bookId) {
        return this.likedBooks.includes(bookId);
    }

    // === Filtering & Sorting ===
    getFilteredBooks() {
        let filtered = [...this.books];
        
        // Filter by favorites
        if (this.filters.favorite === 'liked') {
            filtered = filtered.filter(book => this.isLiked(book.id));
        }
        
        // Filter by genre
        if (this.filters.genre !== 'all') {
            filtered = filtered.filter(book => 
                book.genreKeys && book.genreKeys.includes(this.filters.genre)
            );
        }
        
        // Sort
        filtered = this.sortBooks(filtered, this.filters.sort);
        
        return filtered;
    }

    sortBooks(booksArray, sortBy) {
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

    onFilterChange() {
        this.filters.favorite = this.favoriteFilter.value;
        this.filters.genre = this.genreFilter.value;
        this.filters.sort = this.sortFilter.value;
        this.render();
    }

    // === View ===
    setView(view) {
        this.currentView = view;
        
        this.gridViewBtn.classList.toggle('active', view === 'grid');
        this.listViewBtn.classList.toggle('active', view === 'list');
        
        this.booksContainer.classList.toggle('list-view', view === 'list');
    }

    // === Rendering ===
    render() {
        const filteredBooks = this.getFilteredBooks();
        
        if (filteredBooks.length === 0) {
            this.booksContainer.style.display = 'none';
            this.emptyState.style.display = 'flex';
            return;
        }
        
        this.booksContainer.style.display = 'grid';
        this.emptyState.style.display = 'none';
        
        this.booksContainer.innerHTML = filteredBooks.map(book => 
            this.createBookCard(book)
        ).join('');
        
        // Attach event listeners
        filteredBooks.forEach(book => {
            const card = document.querySelector(`[data-book-id="${book.id}"]`);
            const likeBtn = card.querySelector('.like-btn');
            
            // Like button
            likeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleLike(book.id);
            });
            
            // Card click
            card.addEventListener('click', () => {
                this.openModal(book);
            });
        });
    }

    createBookCard(book) {
        const liked = this.isLiked(book.id);
        const heartIcon = liked ? 'fas fa-heart' : 'far fa-heart';
        
        return `
            <div class="book-card" data-book-id="${book.id}">
                <button class="like-btn ${liked ? 'liked' : ''}" title="${liked ? 'Убрать из избранного' : 'Добавить в избранное'}">
                    <i class="${heartIcon}"></i>
                </button>
                <div class="book-cover">
                    <img src="${book.cover}" alt="${book.title}" loading="lazy" 
                         onerror="this.src='https://via.placeholder.com/300x400?text=${encodeURIComponent(book.title)}'">
                </div>
                <div class="book-info">
                    <h3 class="book-title">${book.title}</h3>
                    ${book.subtitle ? `<p class="book-subtitle">${book.subtitle}</p>` : ''}
                    <p class="book-author">${book.author || 'Автор не указан'}</p>
                    <div class="book-meta">
                        ${book.publisher ? `<span><i class="fas fa-building"></i> ${book.publisher}</span>` : ''}
                        ${book.year ? `<span><i class="fas fa-calendar"></i> ${book.year}</span>` : ''}
                    </div>
                    ${book.genres && book.genres.length > 0 ? `
                        <div class="book-genres">
                            ${book.genres.slice(0, 3).map(g => `<span class="genre-tag">${g}</span>`).join('')}
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    // === Modal ===
    openModal(book) {
        const liked = this.isLiked(book.id);
        const heartIcon = liked ? 'fas fa-heart' : 'far fa-heart';
        
        this.modalContent.innerHTML = `
            <div class="modal-book">
                <div class="modal-cover">
                    <img src="${book.cover}" alt="${book.title}" 
                         onerror="this.src='https://via.placeholder.com/300x450?text=${encodeURIComponent(book.title)}'">
                </div>
                <div class="modal-info">
                    <h2 class="modal-title">${book.title}</h2>
                    ${book.subtitle ? `<p class="modal-subtitle">${book.subtitle}</p>` : ''}
                    
                    <button class="modal-like-btn ${liked ? 'liked' : ''}" data-book-id="${book.id}">
                        <i class="${heartIcon}"></i>
                        <span>${liked ? 'В избранном' : 'Добавить в избранное'}</span>
                    </button>
                    
                    <div class="modal-meta">
                        ${book.author ? `
                            <div class="modal-meta-item">
                                <i class="fas fa-user"></i>
                                <span><strong>Автор:</strong> ${book.author}</span>
                            </div>
                        ` : ''}
                        
                        ${book.publisher ? `
                            <div class="modal-meta-item">
                                <i class="fas fa-building"></i>
                                <span><strong>Издательство:</strong> ${book.publisher}</span>
                            </div>
                        ` : ''}
                        
                        ${book.year ? `
                            <div class="modal-meta-item">
                                <i class="fas fa-calendar"></i>
                                <span><strong>Год:</strong> ${book.year}</span>
                            </div>
                        ` : ''}
                        
                        ${book.isbn ? `
                            <div class="modal-meta-item">
                                <i class="fas fa-barcode"></i>
                                <span><strong>ISBN:</strong> ${book.isbn}</span>
                            </div>
                        ` : ''}
                        
                        ${book.series ? `
                            <div class="modal-meta-item">
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
                            <div class="book-genres">
                                ${book.genres.map(g => `<span class="genre-tag">${g}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        // Add like button event
        const modalLikeBtn = this.modalContent.querySelector('.modal-like-btn');
        if (modalLikeBtn) {
            modalLikeBtn.addEventListener('click', () => {
                this.toggleLike(book.id);
                this.openModal(book); // Re-render modal
            });
        }
        
        this.modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        this.modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // === Stats ===
    updateStats() {
        this.totalBooksEl.textContent = this.books.length;
        this.likedCountEl.textContent = this.likedBooks.length;
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.library = new Library();
});
