const news = [];

let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let comments = JSON.parse(localStorage.getItem('comments')) || {}; // { noticiaId: [comentarios] }

function showView(view) {
    document.querySelectorAll('main > section').forEach(section => {
        section.classList.add('section-hidden');
    });
    document.getElementById(view + '-view').classList.remove('section-hidden');
    if (view === 'home') {
        renderNews();
    } else if (view === 'favorites') {
        renderFavorites();
    } else if (view === 'comments') {
        renderComments();
    } else if (view === 'create-news') {
        // Si necesitas limpiar el formulario al entrar
        document.getElementById('news-form').reset();
    }
}

document.getElementById('search-news').addEventListener('input', function() {
    renderNews(this.value);
});

function renderNews(search = "") {
    const newsContainer = document.getElementById('news-container');
    const template = document.getElementById('news-card-template');
    newsContainer.innerHTML = '';
    news.filter(item =>
        item.title.toLowerCase().includes(search.toLowerCase()) ||
        item.description.toLowerCase().includes(search.toLowerCase())
    ).forEach(item => {
        const clone = template.content.cloneNode(true);
        clone.querySelector('.card-image').src = item.image;
        clone.querySelector('.card-image').alt = item.title;
        clone.querySelector('.card-title').textContent = item.title;
        clone.querySelector('.card-description').textContent = item.description;
        clone.querySelector('.card-date').textContent = "Publicado: " + (item.date || "Sin fecha");
        clone.querySelector('.details-btn').onclick = () => viewDetails(item.id);
        clone.querySelector('.favorite-btn').onclick = () => addToFavorites(item.id);
        clone.querySelector('.delete-btn').onclick = () => deleteNews(item.id);
        const editBtn = clone.querySelector('.edit-btn');
        if (editBtn) editBtn.onclick = () => editNews(item.id);
        clone.querySelector('.like-btn').onclick = () => likeNews(item.id);
        clone.querySelector('.like-count').textContent = item.likes || 0;
        clone.querySelector('.dislike-btn').onclick = () => dislikeNews(item.id);
        clone.querySelector('.dislike-count').textContent = item.dislikes || 0;
        newsContainer.appendChild(clone);
    });
}
// Template para las cards de noticias

function viewDetails(id) {
    const movie = news.find(n => n.id === id);
    document.getElementById('movie-title').textContent = movie.title;
    document.getElementById('movie-image').src = movie.image;
    document.getElementById('movie-image').alt = movie.title;
    document.getElementById('movie-description').textContent = movie.content;
    showView('details');
    renderComments(id);
    // Guarda el id actual para comentarios
    document.getElementById('comment-form').setAttribute('data-news-id', id);
}

function addToFavorites(id) {
    const movie = news.find(n => n.id === id);
    if (!favorites.some(fav => fav.id === movie.id)) {
        favorites.push(movie);
        localStorage.setItem('favorites', JSON.stringify(favorites));
        alert('Añadido a favoritos');
    } else {
        alert('Ya está en favoritos');
    }
}

function renderFavorites() {
    const favoritesList = document.getElementById('favorites-list');
    favoritesList.innerHTML = '';
    if (favorites.length === 0) {
        favoritesList.innerHTML = '<li>No tienes películas favoritas.</li>';
        return;
    }
    favorites.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div class="card">
                <img class="card-image" src="${item.image}" alt="${item.title}">
                <h3>${item.title}</h3>
                <p>${item.description}</p>
                <button onclick="viewDetails(${item.id})">Leer más</button>
                <button onclick="removeFromFavorites(${item.id})">Eliminar de Favoritos</button>
            </div>
        `;
        favoritesList.appendChild(li);
    });
}

function removeFromFavorites(id) {
    favorites = favorites.filter(fav => fav.id !== id);
    localStorage.setItem('favorites', JSON.stringify(favorites));
    renderFavorites();
}

// Sección de comentarios
document.getElementById('comment-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const commentInput = document.getElementById('comment-input');
    const comment = commentInput.value.trim();
    const newsId = this.getAttribute('data-news-id');
    if (comment && newsId) {
        if (!comments[newsId]) comments[newsId] = [];
        comments[newsId].push(comment);
        localStorage.setItem('comments', JSON.stringify(comments));
        commentInput.value = '';
        renderComments(newsId);
    }
});

function renderComments(newsId) {
    const commentsList = document.getElementById('comments-list');
    const newsComments = comments[newsId] || [];
    commentsList.innerHTML = '';
    if (newsComments.length === 0) {
        commentsList.innerHTML = '<li>No hay comentarios aún.</li>';
        return;
    }
    newsComments.forEach((comment, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:space-between;">
                <span>${comment}</span>
                <button class="delete-btn" onclick="deleteComment('${newsId}',${index})">Eliminar</button>
            </div>
        `;
        commentsList.appendChild(li);
    });
}
function deleteComment(newsId, index) {
    comments[newsId].splice(index, 1);
    localStorage.setItem('comments', JSON.stringify(comments));
    renderComments(newsId);
}

// Cargar noticias desde localStorage si existen
if (localStorage.getItem('news')) {
    const storedNews = JSON.parse(localStorage.getItem('news'));
    if (Array.isArray(storedNews) && storedNews.length > 0) {
        news.length = 0; // Limpiar las noticias iniciales
        news.push(...storedNews); // Añadir las noticias guardadas
    }
}

// Manejar el formulario de creación de noticias
document.getElementById('news-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const title = document.getElementById('news-title').value.trim();
    const description = document.getElementById('news-description').value.trim();
    const image = document.getElementById('news-image').value.trim();
    const content = document.getElementById('news-content').value.trim();
    const date = document.getElementById('news-date').value;

    // Validar URL de imagen
    if (!/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(image)) {
        alert('Por favor, ingresa una URL de imagen válida (jpg, png, webp, gif).');
        return;
    }
    // Validar fecha
    if (new Date(date) > new Date()) {
        alert('La fecha de publicación no puede ser futura.');
        return;
    }

    const editId = this.getAttribute('data-edit-id');
    if (editId) {
        // Editar noticia existente
        const idx = news.findIndex(n => n.id == editId);
        if (idx !== -1) {
            news[idx] = { id: Number(editId), title, description, image, content, date };
            // Actualiza localStorage
            localStorage.setItem('news', JSON.stringify(news));
        }
        this.removeAttribute('data-edit-id');
    } else {
        if (title && description && image && content) {
            const newId = news.length ? Math.max(...news.map(n => n.id)) + 1 : 1;
            const newNews = { id: newId, title, description, image, content, date, likes: 0, dislikes: 0 };
            news.push(newNews);

            // Guardar en localStorage para persistencia
            const userNews = JSON.parse(localStorage.getItem('news')) || [];
            userNews.push(newNews);
            localStorage.setItem('news', JSON.stringify(userNews));
        }
    }
    this.reset();
    renderNews();
    showView('home');
});

// Inicializar vista
showView('home');

function deleteNews(id) {
    if (!confirm("¿Estás seguro de que deseas eliminar esta noticia?")) return;
    // Elimina del arreglo
    const index = news.findIndex(n => n.id === id);
    if (index !== -1) {
        news.splice(index, 1);
    }
    // Elimina del localStorage
    let storedNews = JSON.parse(localStorage.getItem('news')) || [];
    storedNews = storedNews.filter(n => n.id !== id);
    localStorage.setItem('news', JSON.stringify(storedNews));
    renderNews();
}

function editNews(id) {
    const noticia = news.find(n => n.id === id);
    if (!noticia) return;
    showView('create-news');
    document.getElementById('news-title').value = noticia.title;
    document.getElementById('news-description').value = noticia.description;
    document.getElementById('news-image').value = noticia.image;
    document.getElementById('news-content').value = noticia.content;
    document.getElementById('news-date').value = noticia.date;
    // Guarda el id en un atributo temporal
    document.getElementById('news-form').setAttribute('data-edit-id', id);
}

function likeNews(id) {
    const noticia = news.find(n => n.id === id);
    if (noticia) {
        noticia.likes = (noticia.likes || 0) + 1;
        localStorage.setItem('news', JSON.stringify(news));
        renderNews();
    }
}

function dislikeNews(id) {
    const noticia = news.find(n => n.id === id);
    if (noticia) {
        noticia.dislikes = (noticia.dislikes || 0) + 1;
        localStorage.setItem('news', JSON.stringify(news));
        renderNews();
    }
}
