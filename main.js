import './styles.scss'
import heart from "./blocks/header/icons/Heart.png"

let allMoviesGlobal = [];

function checkAuth() {
    const rawData = localStorage.getItem('user');
    const headerBtn = document.querySelector('.buttons__button'); // Кнопка "Войти"
    const heartIcon = document.querySelector('.buttons__heart-icon'); // Иконка профиля

    if (!headerBtn && !heartIcon) return;

    const isLoggedIn = rawData && rawData !== 'undefined' && rawData !== 'null';

    if (isLoggedIn) {
        if (headerBtn) headerBtn.style.display = 'none';
        if (heartIcon) {
            heartIcon.style.display = 'flex';
            heartIcon.onclick = (e) => {
                e.preventDefault();
                window.location.href = 'profile.html';
            };
        }
    } else {
        if (headerBtn) headerBtn.style.display = 'block';
        if (heartIcon) heartIcon.style.display = 'none';
    }
}

function handleProfilePage() {
    const profileSection = document.querySelector('.main__profile');
    if (!profileSection) return;

    console.log("Мы на странице профиля. Проверяем данные...");

    const params = new URLSearchParams(window.location.search);
    const userFromUrl = params.get('user');
    const rawData = localStorage.getItem('user');

    let userData = null;

    if (rawData && rawData !== 'undefined' && rawData !== 'null') {
        try {
            const parsed = JSON.parse(rawData);
            userData = typeof parsed === 'object' ? parsed : { login: parsed };
        } catch (e) {
            userData = { login: rawData };
        }
    }

    if (userFromUrl) {
        if (!userData) userData = {};
        userData.login = userFromUrl;
        localStorage.setItem('user', JSON.stringify(userData));
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (!userData || !userData.login) {
        console.warn("Данных пользователя не найдено. Редирект...");
        window.location.href = 'index.html';
        return;
    }

    const nameElem = document.querySelector('#profile-login');
    const dateElem = document.querySelector('#profile-reg-date');

    if (nameElem) nameElem.innerText = userData.login;

    if (dateElem) {
        dateElem.innerText = userData.createdAt
            ? new Date(userData.createdAt).toLocaleDateString('ru-RU')
            : "Информация уточняется";
    }

    console.log("Профиль успешно отрисован для:", userData.login);
}

async function addToFavorites(movieId) {
    const idToSend = String(movieId);

    try {
        const response = await fetch('/api/animation/addfavorites', {
            method: 'POST',
            headers: {
                'accept': 'application/json',
                'Content-Type': 'application/json'
            },
            // Обязательно для передачи кук/сессии
            credentials: 'include',
            body: JSON.stringify({ animationId: idToSend })
        });

        const result = await response.json();

        if (result.isFavorited === true || result.success === true) {
            alert("Фильм добавлен в избранное!");
        } else {
            alert("Не удалось добавить. Возможно, фильм уже в избранном или нужно войти в аккаунт.");
        }
    } catch (error) {
        console.error("Ошибка при запросе:", error);
        alert("Произошла ошибка при соединении с сервером");
    }
}

function initFavoriteButtons() {
    const favBtns = document.querySelectorAll('.add-favorite');
    favBtns.forEach(btn => {
        btn.onclick = (e) => {
            e.preventDefault();
            const movieId = btn.getAttribute('data-id');
            addToFavorites(movieId);
        };
    });
}

async function loadUserFavorites() {
    const favContainer = document.querySelector('.profile__favorites-list');
    if (!favContainer) return;

    try {
        const response = await fetch('/api/animation/favorites', {
            method: 'GET',
            headers: { 'accept': 'application/json' },
            credentials: 'include'
        });

        if (response.status === 401) {
            favContainer.innerHTML = '<p>Пожалуйста, войдите в аккаунт, чтобы увидеть избранное</p>';
            return;
        }

        const result = await response.json();

        if (result.success && result.data.length > 0) {
            favContainer.innerHTML = ''; // Чистим заглушки
            result.data.forEach(movie => {
                const movieHtml = `
                    <div class="films-page__film-card-cont">
                        <div class="films-page__film-image">
                           <a href="movieframe.html?id=${movie.id}">
                               <img src="${movie.imageLink}">
                           </a>
                        </div>
                        <h2 class="films-page__card-title">${movie.name}</h2>
                    </div>`;
                favContainer.insertAdjacentHTML('beforeend', movieHtml);
            });
        } else {
            favContainer.innerHTML = '<p>У вас пока нет избранных фильмов</p>';
        }
    } catch (error) {
        console.error("Ошибка загрузки избранного:", error);
    }
}

const signUpFormElement = document.querySelector('.main__formsup');

    if (signUpFormElement) {
        signUpFormElement.addEventListener('submit', async (event) => {
            event.preventDefault();
            const formData = new FormData(signUpFormElement);
            const formDataObject = Object.fromEntries(formData);

            fetch('/api/auth/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formDataObject)
            })
                .then((response) => response.json())
                .then((json) => {
                    if (json.success === true) {
                        window.location.href = 'index.html';
                    }
                })
                .catch((error) => console.error('Ошибка при регистрации:', error));
        });
    }


const signInFormElement = document.querySelector('.main__formsin');

if (signInFormElement) {
    signInFormElement.addEventListener('submit', (event) => {
        event.preventDefault();

        const formData = new FormData(signInFormElement);
        const data = Object.fromEntries(formData);

        fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        })
            .then(res => res.json())
            .then(json => {
                console.log('Полный ответ сервера:', json); // СМОТРИ СЮДА В КОНСОЛИ

                if (json.success === true) {
                    localStorage.setItem('user', JSON.stringify(json.data));

                    // Вместо сложного URL с параметрами — просто идем в профиль
                    // Данные мы уже сохранили в localStorage, handleProfilePage их подхватит
                    window.location.href = 'profile.html';
                    console.log('Полный ответ сервера:', json)
                } else {
                    alert('Ошибка: ' + (json.message || 'Неверный логин или пароль'));
                }
            })
            .catch(err => {
                console.error("Ошибка при запросе:", err);
                alert('Не удалось связаться с сервером');
            });
    });
}

async function logOut() {
    try {
        await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });
    } catch (error) {
        console.error('Ошибка при запросе на логаут:', error);
    } finally {
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    }
}

function initLogout() {
    const logoutBtn = document.querySelector('#profile-logout-btn');
    if (logoutBtn) {
        console.log("Кнопка выхода найдена!");
        logoutBtn.onclick = (e) => {
            e.preventDefault();
            console.log("Нажали на выход...");
            logOut();
        };
    }
}

const modalWindowElement = document.querySelector('.main__modal-window')
const signInButtonElement = document.querySelector('.buttons__button')
const signInWindowElement = document.querySelector('.main__signin')

if (signInButtonElement) {
    signInButtonElement.addEventListener('click', () => {
        modalWindowElement.classList.add('open');
        signInWindowElement.classList.add('open');
    });
}

const signUpWindowElement = document.querySelector('.main__signup')
const signUpButtonFormElement = document.querySelector('.main__signup-button-signin')

if (signUpButtonFormElement) {
    signUpButtonFormElement.addEventListener('click', () => {
        signInWindowElement.classList.remove('open');
        signUpWindowElement.classList.add('open');
    });
}


const signInButtonFormElement = document.querySelector('.main__signin-button-signup')

if (signInButtonFormElement) {
    signInButtonFormElement.addEventListener('click', () => {
        signUpWindowElement.classList.remove('open');
        signInWindowElement.classList.add('open');
    });
}


const exitSignInButtonElement = document.querySelector('.exit-signin')

if (exitSignInButtonElement) {
    exitSignInButtonElement.addEventListener('click', () => {
        modalWindowElement.classList.remove('open');
        signInWindowElement.classList.remove('open');
    });
}


const exitSignUpButtonElement = document.querySelector('.exit-signup')

if (exitSignUpButtonElement) {
    exitSignUpButtonElement.addEventListener('click', () => {
        modalWindowElement.classList.remove('open');
        signUpWindowElement.classList.remove('open');
    });
}

let currentFilters = {
    category: '',
    tag: '',
    search: '',
    voiceLanguage: '',
    sortBy: 'id',
    order: 'desc'
};

let filterState = {
    voice: '',
    country: '',
    year: ''
};

async function pagination(page = 1) {
    currentFilters.page = page;

    const url = new URL('/api/animation/find-animation', window.location.origin);

    url.searchParams.append('page', page);
    url.searchParams.append('limit', 10);

    url.searchParams.append('sortBy', currentFilters.sortBy || 'id');
    url.searchParams.append('order', currentFilters.order || 'desc');

    if (currentFilters.category) {
        url.searchParams.append('category', currentFilters.category);
    }

    if (currentFilters.tag) {
        url.searchParams.append('tag', currentFilters.tag);
    }

    if (currentFilters.search) {
        url.searchParams.append('search', currentFilters.search);
    }

    console.log("ЗАПРОС ПО ГАЙДУ:", url.toString());

    try {
        const response = await fetch(url);
        const result = await response.json();
        if (result.success) {
            allMoviesGlobal = result.data
            displayMovies(result.data);
            renderPagination(result.meta.totalPages, result.meta.page);
        }
    } catch (error) {
        console.error("Ошибка пагинации:", error);
    }
}
function displayMovies(moviesToDisplay) {
    const container = document.querySelector('.films-page__films-container');
    if (!container) return;
    container.innerHTML = '';

    moviesToDisplay.forEach(movie => {
        const movieElement = `
        <div class="films-page__film-card-cont">
            <div class="films-page__film-image">
               <a href="movieframe.html?id=${movie.id}">
                   <img src="${movie.imageLink}">
               </a>
            </div>
            <h2 class="films-page__card-title">${movie.name}</h2>
            <div class="films-page__card-section">
                <h3 style="font-size: 14px; color: #808080;">${movie.category}</h3>
                <button class="add-favorite" data-id="${movie.id}">
                    <img style="width: 20px; height: 20px;" src="${heart}">
                </button>
            </div>
        </div>`;
        container.insertAdjacentHTML('beforeend', movieElement);
    });

    // После отрисовки карточек вешаем клики на все сердечки
    initFavoriteButtons();
}

function renderPagination(totalPages, currentPage) {
    const paginationElement = document.querySelector('.films-page__pagination');
    paginationElement.innerHTML = ``;

    for (let i = 1; i <= totalPages; i++) {
        const btnElement = document.createElement('button');
        btnElement.innerText = i.toString();
        btnElement.classList.add('films-page__pagination-btn');

        if (i === currentPage) {
            btnElement.classList.add('active');
        }

        btnElement.onclick = () => {
            pagination(i);
            const filmsSection = document.querySelector('.films-page__recently-films');
            filmsSection.scrollIntoView({behavior: 'smooth'});
        };

        paginationElement.appendChild(btnElement);
    }
}

async function loadSlider() {
    const sliderContElement = document.querySelector('.films-slider__films-group');
    if (!sliderContElement) return; // Защита: если нет слайдера, выходим

    try {
        const response = await fetch(`/api/animation/find-animation?sortBy=rating&&order=desc&limit=10`);
        const result = await response.json();

        if (result.success) {
            sliderContElement.innerHTML = '';
            result.data.forEach(card => {
                const cardElement = `
                    <div class="films-group__film-card">
                        <a href="movieframe.html?id=${card.id}">
                            <img src="${card.imageLink}">
                        </a>
                    </div>`;
                sliderContElement.insertAdjacentHTML('beforeend', cardElement);
            });
        }
    } catch (error) {
        console.error('Ошибка слайдера:', error);
    }
}

// Обернем в функцию, чтобы вызывать когда нужно
function initCategoryFilters() {
    const categoryLinksElement = document.querySelectorAll('.suggestion-page__category');

    categoryLinksElement.forEach(link => {
        link.onclick = async (event) => { // Используем onclick для надежности
            event.preventDefault();
            const text = event.target.innerText.toLowerCase();

            let category = '';
            if (text.includes('фильмы')) category = 'film';
            if (text.includes('сериалы')) category = 'serial';
            if (text.includes('мультфильмы')) category = 'multfilm';
            if (text.includes('аниме')) category = 'anime';

            console.log("Выбрана категория:", category);

            // Если мы на странице плеера — уходим на главную с фильтром
            if (window.location.pathname.includes('movieframe.html')) {
                window.location.href = `index.html?category=${category}`;
            } else {
                await loadCategoryWithFilter({category: category});
            }
        };
    });
}

function initTiltEffect() {
    const container = document.querySelector('.films-page__films-container');
    if (!container) return;

    container.addEventListener('mousemove', (e) => {
        const card = e.target.closest('.films-page__film-card-cont');
        if (!card) return;

        const rect = card.getBoundingClientRect();

        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const rotateX = (centerY - y) / 15;
        const rotateY = (x - centerX) / 15;

        card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
    });

    container.addEventListener('mouseleave', (e) => {
        const card = e.target.closest('.films-page__film-card-cont');
        if (card) {
            card.style.transform = `perspective(1000px) rotateX(0deg) rotateY(0deg) scale(1)`;
        }
    }, true);
}

async function loadCategoryWithFilter(filterObj) {

    const baseUrl = `/api/animation/find-animation`;

    const queryParams = new URLSearchParams({
        page: 1,
        limit: 10,
        ...filterObj,
    });


    try {
        const response = await fetch(`${baseUrl}?${queryParams}`);
        const result = await response.json();
        console.log(result);

        if (result.success) {
            displayMovies(result.data);
            renderPagination(result.meta.totalPages, result.meta.page);
        }
    } catch (error) {
        console.log(error);
    }
}

async function loadGenres() {
    const genreCont = document.querySelector('.suggestions-page__abt2');
    if (!genreCont) return;

    try {
        const response = await fetch(`/api/animation/tags`);
        const result = await response.json();

        if (result.success) {
            genreCont.innerHTML = '';
            result.data.forEach(tag => {
                const pElement = document.createElement('p');
                // Добавляем класс ссылке для удобства поиска
                pElement.innerHTML = `<a href="#" class="suggestions-page__genre-item" data-name="${tag.name}">${tag.name}</a>`;
                genreCont.appendChild(pElement);
            });

            document.querySelectorAll('.suggestions-page__genre-item').forEach(link => {
                link.onclick = (e) => { // Используем onclick для надежности переопределения
                    e.preventDefault();
                    const genreName = e.target.getAttribute('data-name');

                    // ПРОВЕРКА: Если на странице нет контейнера для фильмов, значит мы не на главной
                    const isMainPage = !!document.querySelector('.films-page__films-container');

                    if (isMainPage) {
                        // Логика для главной: просто фильтруем
                        currentFilters.tag = genreName;
                        currentFilters.category = '';
                        currentFilters.search = '';
                        pagination(1);
                    } else {
                        // Логика для страницы фильма: летим на главную с параметром
                        window.location.href = `index.html?tag=${encodeURIComponent(genreName)}`;
                    }
                };
            });
        }
    } catch (e) {
        console.error('Ошибка жанров:', e);
    }
}

const searchForm = document.querySelector('nav form')
const searchInput = document.querySelector('#search-bar')

if (searchForm && searchInput) {
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = searchInput.value.trim();
        currentFilters.search = query;
        currentFilters.category = '';
        currentFilters.tag = '';
        pagination(1);
    });
}
function initDropdownFilters() {
    const voiceSelect = document.querySelector('#voice-select');
    const sortSelect = document.querySelector('#sort-select');
    const countrySelect = document.querySelector('#country');
    const yearSelect = document.querySelector('#year');

    // Если мы не на главной, выходим
    if (!voiceSelect) return;

    // Функция для сборки общей строки поиска
    const applyFilters = () => {
        // Собираем все непустые значения в одну строку через пробел
        const searchTerms = [filterState.voice, filterState.country, filterState.year]
            .filter(term => term !== '')
            .join(' ');

        currentFilters.search = searchTerms;
        console.log("Отправляем в поиск:", currentFilters.search);
        pagination(1);
    };

    // Слушатель для Языка
    voiceSelect.onchange = (e) => {
        filterState.voice = e.target.value;
        applyFilters();
    };

    // Слушатель для Страны
    if (countrySelect) {
        countrySelect.onchange = (e) => {
            filterState.country = e.target.value;
            applyFilters();
        };
    }

    // Слушатель для Года
    if (yearSelect) {
        yearSelect.onchange = (e) => {
            filterState.year = e.target.value;
            applyFilters();
        };
    }

    // Слушатель для Сортировки (она идет отдельным параметром sortBy)
    if (sortSelect) {
        sortSelect.onchange = (e) => {
            currentFilters.sortBy = e.target.value;
            currentFilters.order = 'desc';
            pagination(1);
        };
    }
}

async function loadMovieDetails() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');

    const response = await fetch (`/api/animation/${id}`);
    const result = await response.json();

    if (result.success) {
        const movie = result.data.data;

        if (movie.backgroundImageLink && movie.backgroundImageLink.trim () !== "") {
            document.body.style.backgroundImage = `url(${movie.backgroundImageLink})`;
            document.body.style.backgroundSize = 'cover';
        }

        document.querySelector('.banner-info__banner-image').innerHTML = `<img style="border: 1px solid gold;" src="${movie.imageLink}">`;
        document.querySelector('#name').innerText = movie.name;
        document.querySelector('#english-name').innerText = movie.englishName;
        document.querySelector('#rating').innerHTML = `<p style="font-size: 14px; color: #8F8F8F">Рейтинг: ${movie.rating}/10</p>`;
        document.querySelector('#country-year').innerHTML = `${movie.country},${movie.year}`;
        document.querySelector('#category').innerText = movie.category;
        document.querySelector('#directors').innerText = movie.directors;
        document.querySelector('#actors').innerText = movie.actors;
        document.querySelector('#voice-language').innerText = movie.voiceLanguage;
        document.querySelector('#description').innerText = movie.description;
        document.querySelector('#player-name').innerText = movie.name;
        document.querySelector('.player-frame__player').innerHTML = `<iframe class="player-frame__iframe" src="${movie.iframe}"></iframe>`;
    }
}

const themeToggle = document.querySelector('#theme-toggle');
const body = document.body;

function toggleTheme() {

    body.classList.toggle('light-theme');

    if (body.classList.contains('light-theme')) {
        localStorage.setItem('theme', 'light');
    } else {
        localStorage.setItem('theme', 'dark');
    }
}

function checkSavedTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') {
        body.classList.add('light-theme');
    }
}

checkSavedTheme();

if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
}

function initRandomButton() {
    const randomBtn = document.querySelector('.films-page__random-film-btn button');

    if (randomBtn) {
        randomBtn.onclick = (e) => {
            e.preventDefault();

            if (allMoviesGlobal && allMoviesGlobal.length > 0) {
                // Выбираем случайный фильм из массива
                const randomIndex = Math.floor(Math.random() * allMoviesGlobal.length);
                const randomMovie = allMoviesGlobal[randomIndex];

                // Летим на страницу плеера
                window.location.href = `movieframe.html?id=${randomMovie.id}`;
            } else {
                alert("ошибко!");
            }
        };
    }
}

// Имитация обновления профиля (сохраняем только в браузере)
async function updateProfileLocal(newLogin) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const rawData = localStorage.getItem('user');
            if (rawData) {
                let userData = JSON.parse(rawData);
                userData.login = newLogin;
                localStorage.setItem('user', JSON.stringify(userData)); // Сохраняем в память браузера
                console.log("Логин успешно обновлен в localStorage:", newLogin);
            }
            resolve(true);
        }, 300); // Небольшая задержка для реалистичности
    });
}

// Логика редактирования логина по клику
function initProfileEdit() {
    const loginElem = document.querySelector('#profile-login');
    if (!loginElem) return;

    // Стилизуем, чтобы юзер понял, что можно кликнуть
    loginElem.style.cursor = 'pointer';
    loginElem.title = "Нажми, чтобы изменить логин";

    loginElem.onclick = () => {
        const currentLogin = loginElem.innerText;

        // Создаем поле ввода
        const input = document.createElement('input');
        input.value = currentLogin;
        input.classList.add('profile__login-input'); // Класс для CSS

        // Стилизуем инпут прямо в JS для быстроты
        input.style.fontSize = 'inherit';
        input.style.fontFamily = 'inherit';
        input.style.color = 'inherit';
        input.style.background = 'rgba(255,255,255,0.1)';
        input.style.border = '1px solid gold';
        input.style.borderRadius = '4px';
        input.style.padding = '2px 8px';

        loginElem.replaceWith(input);
        input.focus();

        const saveChanges = async () => {
            const newLogin = input.value.trim();
            if (newLogin && newLogin !== currentLogin) {
                await updateProfileLocal(newLogin);
                loginElem.innerText = newLogin;

                // Опционально: если хочешь, чтобы имя сразу сменилось в хедере,
                // можно вызвать checkAuth() еще раз, если она обновляет текст
                checkAuth();
            }
            input.replaceWith(loginElem);
        };

        // Сохранение по Enter, отмена по Esc
        input.onkeydown = (e) => {
            if (e.key === 'Enter') saveChanges();
            if (e.key === 'Escape') input.replaceWith(loginElem);
        };

        // Сохранение при потере фокуса
        input.onblur = saveChanges;
    };
}

// Функция для отрисовки всех комментов этого фильма
function displayComments(movieId) {
    const container = document.querySelector('#comments-container');
    if (!container) return;

    // Достаем из памяти все комменты или создаем пустой массив
    const allComments = JSON.parse(localStorage.getItem('movie_comments') || '{}');
    const movieComments = allComments[movieId] || [];

    container.innerHTML = movieComments.map(c => `
        <div class="comment-item" style="border-bottom: 1px solid #333; padding: 10px 0;">
            <strong style="color: gold;">${c.user}:</strong>
            <p style="margin: 5px 0;">${c.text}</p>
            <small style="color: #666;">${c.date}</small>
        </div>
    `).join('') || '<p>Оставьте комментарий✌🤙🎈!</p>';
}

// Инициализация формы комментов
function initComments() {
    const sendBtn = document.querySelector('#send-comment');
    const textArea = document.querySelector('#comment-text');
    const params = new URLSearchParams(window.location.search);
    const movieId = params.get('id');

    if (!sendBtn || !movieId) return;

    sendBtn.onclick = () => {
        const userRaw = localStorage.getItem('user');
        if (!userRaw) {
            alert("Войдите в аккаунт, чтобы оставить комментарий");
            return;
        }

        const userData = JSON.parse(userRaw);
        const text = textArea.value.trim();

        if (text) {
            const allComments = JSON.parse(localStorage.getItem('movie_comments') || '{}');
            if (!allComments[movieId]) allComments[movieId] = [];

            // Добавляем новый коммент в начало
            allComments[movieId].unshift({
                user: userData.login,
                text: text,
                date: new Date().toLocaleString()
            });

            localStorage.setItem('movie_comments', JSON.stringify(allComments));
            textArea.value = ''; // Чистим поле
            displayComments(movieId); // Перерисовываем
        }
    };

    displayComments(movieId);
}

function initReactions() {
    const reactionBtn = document.querySelector('#like-movie-btn'); // Добавь такую кнопку в HTML
    if (!reactionBtn) return;

    const params = new URLSearchParams(window.location.search);
    const movieId = params.get('id');

    // Проверяем, лайкал ли уже
    const likes = JSON.parse(localStorage.getItem('movie_likes') || '[]');
    if (likes.includes(movieId)) {
        reactionBtn.classList.add('active');
        reactionBtn.innerText = '❤️ В избранном';
    }

    reactionBtn.onclick = () => {
        let currentLikes = JSON.parse(localStorage.getItem('movie_likes') || '[]');

        if (currentLikes.includes(movieId)) {
            currentLikes = currentLikes.filter(id => id !== movieId);
            reactionBtn.classList.remove('active');
            reactionBtn.innerText = '🤍 Лайк';
        } else {
            currentLikes.push(movieId);
            reactionBtn.classList.add('active');
            reactionBtn.innerText = '❤️ В избранном';
        }

        localStorage.setItem('movie_likes', JSON.stringify(currentLikes));
    };
}

if (window.location.pathname.includes('movieframe.html')) {
    loadMovieDetails();
}

document.addEventListener('DOMContentLoaded', async () => {
    console.log(window.location.pathname);

    // 1. Инициализация общих компонентов
    checkAuth();
    initLogout();
    initCategoryFilters();

    initTiltEffect();

    initRandomButton();

    initDropdownFilters();

    // 2. Жанры грузим один раз для всех страниц
    await loadGenres();

    // 3. Логика для СТРАНИЦЫ ПРОФИЛЯ
    if (document.querySelector('.main__profile')) {
        handleProfilePage();
        // Загружаем только если в памяти есть юзер
        initProfileEdit();

        if (localStorage.getItem('user')) {
            console.log("Запрашиваем избранное...");
            loadUserFavorites();
        }
    }

    // 4. Логика для ГЛАВНОЙ
    if (document.querySelector('.films-page__films-container')) {
        const params = new URLSearchParams(window.location.search);
        const tagFromUrl = params.get('tag');
        const catFromUrl = params.get('category');

        if (tagFromUrl) currentFilters.tag = tagFromUrl;
        if (catFromUrl) currentFilters.category = catFromUrl;

        pagination(1);
        loadSlider();
    }

    // 5. Логика для ПЛЕЕРА
    if (document.querySelector('.player-frame__player')) {
        loadMovieDetails();
        initComments();
        initReactions();
    }
});