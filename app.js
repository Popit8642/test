// OneginBook - Умный книжный дневник
class OneginBook {
    constructor() {
        this.tg = window.Telegram.WebApp;
        this.user = this.tg.initDataUnsafe?.user;
        this.books = [];
        this.currentPage = 1;
        this.booksPerPage = 5;
        this.selectedGenre = '';
        
        this.init();
    }
    
    async init() {
        try {
            // Инициализация Telegram Web App
            this.tg.expand();
            this.tg.enableClosingConfirmation();
            
            // Настройка Main Button
            this.tg.MainButton.setText("💾 Сохранить изменения");
            this.tg.MainButton.onClick(this.saveChanges.bind(this));
            
            // Инициализация пользователя
            await this.initUser();
            
            // Настройка обработчиков событий
            this.setupEventListeners();
            
            // Загрузка данных
            await this.loadUserData();
            
            // Показываем, что приложение готово
            this.tg.ready();
            this.showNotification('OneginBook готов к работе!', 'success');
            
        } catch (error) {
            console.error('Ошибка инициализации:', error);
            this.showNotification('Ошибка загрузки приложения', 'error');
        }
    }
    
    async initUser() {
        const userSection = document.getElementById('userSection');
        const userName = document.getElementById('userName');
        const userStatus = document.getElementById('userStatus');
        const userAvatar = document.getElementById('userAvatar');
        
        if (this.user) {
            // Заполняем данные пользователя
            userName.textContent = this.user.first_name || 'Пользователь';
            userStatus.textContent = this.user.username ? `@${this.user.username}` : 'Участник OneginBook';
            
            // Если есть фото профиля
            if (this.user.photo_url) {
                userAvatar.innerHTML = `<img src="${this.user.photo_url}" alt="Аватар" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            }
            
            // Если пользователь админ
            if (this.user.is_admin) {
                userSection.classList.add('admin-user');
                userStatus.textContent = '👑 Администратор';
            }
        } else {
            // Запасной вариант для разработки
            userName.textContent = 'Гость';
            userStatus.textContent = 'Войдите через Telegram';
        }
    }
    
    setupEventListeners() {
        // Форма добавления книги
        const form = document.getElementById('addBookForm');
        form.addEventListener('submit', this.handleAddBook.bind(this));
        
        // Очистка формы
        document.getElementById('clearForm').addEventListener('click', this.clearForm.bind(this));
        
        // Счетчики символов
        document.getElementById('bookTitle').addEventListener('input', this.updateCharCounter.bind(this, 'titleCounter', 100));
        document.getElementById('bookAuthor').addEventListener('input', this.updateCharCounter.bind(this, 'authorCounter', 75));
        document.getElementById('bookNotes').addEventListener('input', this.updateCharCounter.bind(this, 'notesCounter', 500));
        
        // Выбор жанров
        document.querySelectorAll('.genre-tag').forEach(tag => {
            tag.addEventListener('click', this.handleGenreSelect.bind(this));
        });
        
        // Поиск книг
        document.getElementById('searchBooks').addEventListener('input', this.handleSearch.bind(this));
        
        // Сортировка
        document.getElementById('sortBooks').addEventListener('change', this.handleSort.bind(this));
        
        // Пагинация
        document.getElementById('prevPage').addEventListener('click', this.prevPage.bind(this));
        document.getElementById('nextPage').addEventListener('click', this.nextPage.bind(this));
        
        // Быстрые действия
        document.getElementById('addFirstBook').addEventListener('click', () => {
            document.getElementById('bookTitle').focus();
        });
        
        document.getElementById('exportBooks').addEventListener('click', this.exportBooks.bind(this));
        document.getElementById('shareProfile').addEventListener('click', this.shareProfile.bind(this));
        document.getElementById('requestAnalysis').addEventListener('click', this.requestAnalysis.bind(this));
        document.getElementById('settingsBtn').addEventListener('click', this.showSettings.bind(this));
        
        // Футер кнопки
        document.getElementById('aboutBtn').addEventListener('click', this.showAbout.bind(this));
        document.getElementById('helpBtn').addEventListener('click', this.showHelp.bind(this));
        document.getElementById('feedbackBtn').addEventListener('click', this.showFeedback.bind(this));
        
        // Модальные окна
        document.getElementById('closeSuccessModal').addEventListener('click', this.hideModal.bind(this, 'successModal'));
        document.getElementById('closeErrorModal').addEventListener('click', this.hideModal.bind(this, 'errorModal'));
    }
    
    async loadUserData() {
        this.showLoading();
        
        try {
            // Здесь будет запрос к боту для получения данных
            // Пока используем демо-данные
            await this.loadDemoData();
            
            this.updateStats();
            this.renderBooks();
            
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            this.showNotification('Не удалось загрузить данные', 'error');
        } finally {
            this.hideLoading();
        }
    }
    
    async loadDemoData() {
        // Демо-данные для тестирования
        this.books = [
            {
                id: 1,
                name_book: 'Евгений Онегин',
                author_book: 'Александр Пушкин',
                data_added: '2024-01-15T10:30:00Z',
                genre: 'Классика'
            },
            {
                id: 2,
                name_book: 'Мастер и Маргарита',
                author_book: 'Михаил Булгаков',
                data_added: '2024-01-10T14:20:00Z',
                genre: 'Роман'
            },
            {
                id: 3,
                name_book: 'Преступление и наказание',
                author_book: 'Фёдор Достоевский',
                data_added: '2024-01-05T09:15:00Z',
                genre: 'Классика'
            },
            {
                id: 4,
                name_book: '1984',
                author_book: 'Джордж Оруэлл',
                data_added: '2023-12-20T16:45:00Z',
                genre: 'Антиутопия'
            },
            {
                id: 5,
                name_book: 'Гарри Поттер и философский камень',
                author_book: 'Джоан Роулинг',
                data_added: '2023-12-10T11:20:00Z',
                genre: 'Фэнтези'
            }
        ];
        
        // Обновляем статистику
        document.getElementById('totalBooks').textContent = this.books.length;
        document.getElementById('gptRequests').textContent = '12';
        
        // Рассчитываем дни активности
        const firstBookDate = new Date(this.books[this.books.length - 1].data_added);
        const daysActive = Math.floor((new Date() - firstBookDate) / (1000 * 60 * 60 * 24));
        document.getElementById('daysActive').textContent = daysActive;
        
        // Обновляем дату последней книги
        const lastBookDate = new Date(this.books[0].data_added);
        document.getElementById('lastBookDate').textContent = lastBookDate.toLocaleDateString('ru-RU');
        
        // Среднее в месяц
        const monthsActive = daysActive / 30;
        const avgPerMonth = (this.books.length / Math.max(monthsActive, 1)).toFixed(1);
        document.getElementById('avgPerMonth').textContent = avgPerMonth;
    }
    
    async handleAddBook(event) {
        event.preventDefault();
        
        const title = document.getElementById('bookTitle').value.trim();
        const author = document.getElementById('bookAuthor').value.trim();
        const genre = document.getElementById('bookGenre').value.trim() || this.selectedGenre;
        const notes = document.getElementById('bookNotes').value.trim();
        
        // Валидация
        if (!title || !author) {
            this.showNotification('Пожалуйста, заполните название и автора книги', 'error');
            return;
        }
        
        if (title.length > 100) {
            this.showNotification('Название книги не должно превышать 100 символов', 'error');
            return;
        }
        
        if (author.length > 75) {
            this.showNotification('Имя автора не должно превышать 75 символов', 'error');
            return;
        }
        
        // Подготовка данных для отправки
        const bookData = {
            action: 'add_book',
            name_book: title,
            author_book: author,
            genre: genre,
            notes: notes,
            user_id: this.user?.id,
            timestamp: new Date().toISOString()
        };
        
        try {
            // Показываем загрузку
            this.showLoading();
            
            // Отправляем данные в бота через Telegram Web App
            this.tg.sendData(JSON.stringify(bookData));
            
            // В реальном приложении здесь был бы запрос к API
            // Для демо добавляем локально
            const newBook = {
                id: Date.now(),
                name_book: title,
                author_book: author,
                data_added: new Date().toISOString(),
                genre: genre
            };
            
            this.books.unshift(newBook);
            this.clearForm();
            this.updateStats();
            this.renderBooks();
            
            // Показываем успешное сообщение
            this.showModal('successModal', 'Книга успешно добавлена в вашу библиотеку!');
            
            // Обновляем Main Button
            this.tg.MainButton.show();
            
        } catch (error) {
            console.error('Ошибка при добавлении книги:', error);
            this.showModal('errorModal', 'Ошибка при добавлении книги. Попробуйте еще раз.');
        } finally {
            this.hideLoading();
        }
    }
    
    clearForm() {
        document.getElementById('addBookForm').reset();
        document.getElementById('bookGenre').value = '';
        this.selectedGenre = '';
        
        // Сбрасываем активные теги жанров
        document.querySelectorAll('.genre-tag').forEach(tag => {
            tag.classList.remove('active');
        });
        
        // Сбрасываем счетчики
        this.updateCharCounter('titleCounter', 100);
        this.updateCharCounter('authorCounter', 75);
        this.updateCharCounter('notesCounter', 500);
    }
    
    updateCharCounter(counterId, maxLength) {
        const inputId = counterId.replace('Counter', '');
        const input = document.getElementById(inputId);
        const counter = document.getElementById(counterId);
        
        if (input && counter) {
            const length = input.value.length;
            counter.textContent = length;
            
            if (length > maxLength * 0.9) {
                counter.style.color = 'var(--warning-color)';
            } else if (length > maxLength * 0.75) {
                counter.style.color = 'var(--accent-color)';
            } else {
                counter.style.color = 'var(--text-muted)';
            }
        }
    }
    
    handleGenreSelect(event) {
        const tag = event.target;
        const genre = tag.dataset.genre;
        
        // Сбрасываем все теги
        document.querySelectorAll('.genre-tag').forEach(t => {
            t.classList.remove('active');
        });
        
        // Активируем выбранный тег
        tag.classList.add('active');
        this.selectedGenre = genre;
        document.getElementById('bookGenre').value = genre;
    }
    
    handleSearch(event) {
        const searchTerm = event.target.value.toLowerCase();
        this.currentPage = 1;
        this.renderBooks(searchTerm);
    }
    
    handleSort(event) {
        const sortBy = event.target.value;
        
        this.books.sort((a, b) => {
            switch (sortBy) {
                case 'newest':
                    return new Date(b.data_added) - new Date(a.data_added);
                case 'oldest':
                    return new Date(a.data_added) - new Date(b.data_added);
                case 'title':
                    return a.name_book.localeCompare(b.name_book);
                case 'author':
                    return a.author_book.localeCompare(b.author_book);
                default:
                    return 0;
            }
        });
        
        this.renderBooks();
    }
    
    renderBooks(searchTerm = '') {
        const container = document.getElementById('booksContainer');
        const booksCount = document.getElementById('booksCount');
        const currentPageEl = document.getElementById('currentPage');
        const totalPagesEl = document.getElementById('totalPages');
        const prevBtn = document.getElementById('prevPage');
        const nextBtn = document.getElementById('nextPage');
        
        // Фильтрация по поисковому запросу
        let filteredBooks = this.books;
        if (searchTerm) {
            filteredBooks = this.books.filter(book => 
                book.name_book.toLowerCase().includes(searchTerm) ||
                book.author_book.toLowerCase().includes(searchTerm) ||
                (book.genre && book.genre.toLowerCase().includes(searchTerm))
            );
        }
        
        // Пагинация
        const totalBooks = filteredBooks.length;
        const totalPages = Math.ceil(totalBooks / this.booksPerPage);
        const startIndex = (this.currentPage - 1) * this.booksPerPage;
        const endIndex = startIndex + this.booksPerPage;
        const paginatedBooks = filteredBooks.slice(startIndex, endIndex);
        
        // Обновление информации о пагинации
        booksCount.textContent = totalBooks;
        currentPageEl.textContent = this.currentPage;
        totalPagesEl.textContent = totalPages;
        
        // Кнопки пагинации
        prevBtn.disabled = this.currentPage === 1;
        nextBtn.disabled = this.currentPage === totalPages || totalPages === 0;
        
        // Рендеринг книг
        if (paginatedBooks.length === 0) {
            if (searchTerm) {
                container.innerHTML = `
                    <div class="empty-library">
                        <div class="empty-icon">
                            <i class="fas fa-search"></i>
                        </div>
                        <h3>Книги не найдены</h3>
                        <p>Попробуйте изменить поисковый запрос</p>
                    </div>
                `;
            } else {
                container.innerHTML = `
                    <div class="empty-library">
                        <div class="empty-icon">
                            <i class="fas fa-book-open"></i>
                        </div>
                        <h3>Библиотека пуста</h3>
                        <p>Добавьте свою первую книгу, чтобы начать вести дневник!</p>
                        <button class="btn btn-outline" id="addFirstBook">
                            <i class="fas fa-plus"></i> Добавить первую книгу
                        </button>
                    </div>
                `;
                
                // Перепривязываем событие
                document.getElementById('addFirstBook').addEventListener('click', () => {
                    document.getElementById('bookTitle').focus();
                });
            }
            return;
        }
        
        // Генерация HTML для книг
        const booksHTML = paginatedBooks.map(book => `
            <div class="book-item" data-id="${book.id}">
                <div class="book-cover">
                    <i class="fas fa-book"></i>
                </div>
                <div class="book-info">
                    <div class="book-title">${this.escapeHtml(book.name_book)}</div>
                    <div class="book-author">${this.escapeHtml(book.author_book)}</div>
                    <div class="book-meta">
                        <span>
                            <i class="fas fa-calendar"></i>
                            ${new Date(book.data_added).toLocaleDateString('ru-RU')}
                        </span>
                        ${book.genre ? `<span><i class="fas fa-tag"></i> ${this.escapeHtml(book.genre)}</span>` : ''}
                    </div>
                </div>
                <div class="book-actions">
                    <button class="book-action-btn edit-btn" onclick="oneginBook.editBook(${book.id})" title="Редактировать">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="book-action-btn delete-btn" onclick="oneginBook.deleteBook(${book.id})" title="Удалить">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `).join('');
        
        container.innerHTML = booksHTML;
    }
    
    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderBooks();
        }
    }
    
    nextPage() {
        const totalPages = Math.ceil(this.books.length / this.booksPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderBooks();
        }
    }
    
    updateStats() {
        // Обновление общей статистики
        document.getElementById('totalBooks').textContent = this.books.length;
        
        // Обновление даты последней книги
        if (this.books.length > 0) {
            const lastBookDate = new Date(this.books[0].data_added);
            document.getElementById('lastBookDate').textContent = lastBookDate.toLocaleDateString('ru-RU');
        }
        
        // Обновление графика активности
        this.updateActivityChart();
    }
    
    updateActivityChart() {
        // В реальном приложении здесь была бы статистика по месяцам
        const thisMonthCount = this.books.filter(book => {
            const bookDate = new Date(book.data_added);
            const now = new Date();
            return bookDate.getMonth() === now.getMonth() && 
                   bookDate.getFullYear() === now.getFullYear();
        }).length;
        
        const totalCount = this.books.length;
        
        // Обновляем график
        const thisMonthBar = document.querySelector('.chart-bar:first-child');
        const totalBar = document.querySelector('.chart-bar:last-child');
        
        if (thisMonthBar && totalBar) {
            const thisMonthPercent = Math.min((thisMonthCount / 10) * 100, 100);
            const totalPercent = Math.min((totalCount / 20) * 100, 100);
            
            thisMonthBar.style.setProperty('--value', `${thisMonthPercent}%`);
            thisMonthBar.dataset.label = `Этот месяц: ${thisMonthCount} книг`;
            
            totalBar.style.setProperty('--value', `${totalPercent}%`);
            totalBar.dataset.label = `Всего: ${totalCount} книг`;
        }
    }
    
    async deleteBook(bookId) {
        if (!confirm('Вы уверены, что хотите удалить эту книгу?')) {
            return;
        }
        
        try {
            // Отправляем запрос на удаление в бота
            const deleteData = {
                action: 'delete_book',
                book_id: bookId,
                user_id: this.user?.id
            };
            
            this.tg.sendData(JSON.stringify(deleteData));
            
            // Удаляем локально для демо
            this.books = this.books.filter(book => book.id !== bookId);
            this.updateStats();
            this.renderBooks();
            
            this.showNotification('Книга успешно удалена', 'success');
            
        } catch (error) {
            console.error('Ошибка при удалении книги:', error);
            this.showNotification('Ошибка при удалении книги', 'error');
        }
    }
    
    editBook(bookId) {
        const book = this.books.find(b => b.id === bookId);
        if (!book) return;
        
        // Заполняем форму данными книги
        document.getElementById('bookTitle').value = book.name_book;
        document.getElementById('bookAuthor').value = book.author_book;
        document.getElementById('bookGenre').value = book.genre || '';
        document.getElementById('bookNotes').value = book.notes || '';
        
        // Обновляем счетчики
        this.updateCharCounter('titleCounter', 100);
        this.updateCharCounter('authorCounter', 75);
        this.updateCharCounter('notesCounter', 500);
        
        // Прокручиваем к форме
        document.getElementById('bookTitle').focus();
        document.getElementById('bookTitle').scrollIntoView({ behavior: 'smooth' });
        
        this.showNotification('Заполнена форма для редактирования', 'info');
    }
    
    async exportBooks() {
        try {
            const exportData = {
                action: 'export_books',
                user_id: this.user?.id,
                timestamp: new Date().toISOString(),
                books_count: this.books.length
            };
            
            this.tg.sendData(JSON.stringify(exportData));
            
            this.showNotification('Запрос на экспорт отправлен боту', 'info');
            
        } catch (error) {
            console.error('Ошибка экспорта:', error);
            this.showNotification('Ошибка при экспорте данных', 'error');
        }
    }
    
    async shareProfile() {
        if (!this.user) {
            this.showNotification('Для этого действия нужен аккаунт Telegram', 'error');
            return;
        }
        
        try {
            const shareData = {
                action: 'share_profile',
                user_id: this.user.id,
                username: this.user.username,
                books_count: this.books.length
            };
            
            this.tg.sendData(JSON.stringify(shareData));
            
            this.showNotification('Профиль готов к публикации', 'info');
            
        } catch (error) {
            console.error('Ошибка при публикации профиля:', error);
            this.showNotification('Ошибка при публикации профиля', 'error');
        }
    }
    
    async requestAnalysis() {
        if (this.books.length === 0) {
            this.showNotification('Добавьте книги для анализа', 'warning');
            return;
        }
        
        try {
            const analysisData = {
                action: 'request_analysis',
                user_id: this.user?.id,
                books_count: this.books.length,
                timestamp: new Date().toISOString()
            };
            
            this.tg.sendData(JSON.stringify(analysisData));
            
            this.showNotification('Запрос на анализ отправлен', 'info');
            
        } catch (error) {
            console.error('Ошибка запроса анализа:', error);
            this.showNotification('Ошибка при запросе анализа', 'error');
        }
    }
    
    async saveChanges() {
        try {
            // Здесь можно сохранить изменения, если они есть
            this.showNotification('Все изменения сохранены', 'success');
            this.tg.MainButton.hide();
            
        } catch (error) {
            console.error('Ошибка сохранения:', error);
            this.showNotification('Ошибка при сохранении изменений', 'error');
        }
    }
    
    showSettings() {
        this.showNotification('Настройки будут доступны в следующем обновлении', 'info');
    }
    
    showAbout() {
        const aboutText = `
            <h3>О проекте OneginBook</h3>
            <p>OneginBook — это умный книжный дневник для ценителей литературы.</p>
            <p>Возможности:</p>
            <ul>
                <li>📖 Ведение библиотеки прочитанных книг</li>
                <li>✍️ Заметки и впечатления о каждой книге</li>
                <li>📊 Статистика и аналитика чтения</li>
                <li>🤖 Интеграция с GPT для анализа</li>
                <li>📱 Синхронизация через Telegram</li>
            </ul>
            <p>Версия: 1.0.0</p>
        `;
        
        alert(aboutText);
    }
    
    showHelp() {
        this.tg.openLink('https://telegra.ph/Pomoshch-po-OneginBook-01-20');
    }
    
    showFeedback() {
        const feedbackData = {
            action: 'send_feedback',
            user_id: this.user?.id,
            timestamp: new Date().toISOString()
        };
        
        this.tg.sendData(JSON.stringify(feedbackData));
        this.showNotification('Открыта форма обратной связи', 'info');
    }
    
    // Вспомогательные методы
    showModal(modalId, message = '') {
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        if (message) {
            const messageEl = modal.querySelector('p');
            if (messageEl) {
                messageEl.textContent = message;
            }
        }
        
        modal.classList.add('active');
    }
    
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    showLoading() {
        document.getElementById('loadingModal').classList.add('active');
    }
    
    hideLoading() {
        document.getElementById('loadingModal').classList.remove('active');
    }
    
    showNotification(message, type = 'info') {
        const notification = document.getElementById('notification');
        const text = document.getElementById('notificationText');
        
        if (!notification || !text) return;
        
        // Устанавливаем цвет в зависимости от типа
        switch (type) {
            case 'success':
                notification.style.background = 'var(--success-color)';
                break;
            case 'error':
                notification.style.background = 'var(--danger-color)';
                break;
            case 'warning':
                notification.style.background = 'var(--warning-color)';
                break;
            default:
                notification.style.background = 'var(--primary-color)';
        }
        
        text.textContent = message;
        notification.classList.add('show');
        
        // Автоматическое скрытие
        setTimeout(() => {
            notification.classList.remove('show');
        }, 3000);
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.oneginBook = new OneginBook();
});