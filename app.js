// Agregamos estas variables al inicio para manejar el estado de autenticación
let currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
let users = JSON.parse(localStorage.getItem('users')) || [
    { username: 'admin', password: 'admin1qaz2wsx', role: 'admin' },
    { username: 'usuario', password: 'user123', role: 'user' }
];

// Función para actualizar la UI según el rol del usuario
document.addEventListener('DOMContentLoaded', function() {
    updateUIForUser();
});

function updateUIForUser() {
    const isAdmin = currentUser && currentUser.role === 'admin';
    const isLoggedIn = currentUser !== null;
    // Mostrar/ocultar botones de navegación
    document.getElementById('create-news-btn').style.display = isAdmin ? 'inline-block' : 'none';
    document.getElementById('login-btn').style.display = isLoggedIn ? 'none' : 'inline-block';
    document.getElementById('user-info').style.display = isLoggedIn ? 'block' : 'none';
    
    if (isLoggedIn) {
        document.getElementById('current-user').textContent = `Bienvenido, ${currentUser.username}`;
    }
    // Mostrar/ocultar elementos con clase admin-only
    document.querySelectorAll('.admin-only').forEach(element => {
        element.style.display = isAdmin ? 'inline-block' : 'none';
    });

        // Mostrar sección de comentarios según si está logueado
    const commentForms = document.querySelectorAll('#comment-form, #detail-comment-form');
    const loginRequiredMessages = document.querySelectorAll('#login-required, #detail-login-required');
    
    commentForms.forEach(form => {
        form.style.display = isLoggedIn ? 'block' : 'none';
    });
    
    loginRequiredMessages.forEach(message => {
        message.style.display = isLoggedIn ? 'none' : 'block';
    });
    // Actualizar footer
    document.querySelectorAll('.admin-only').forEach(el => {
        el.style.display = isAdmin ? 'inline-block' : 'none';
    });
    document.getElementById('footer-login').style.display = isLoggedIn ? 'none' : 'inline-block';
}

// Función para cerrar sesión
function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    updateUIForUser();
    showView('home');
    alert('Has cerrado sesión correctamente');
}
// Modificamos la función de login para manejar el estado
document.getElementById('login-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();

    const user = users.find(u => u.username === username && u.password === password);
    if (user) {
        currentUser = user;
        localStorage.setItem('currentUser', JSON.stringify(user));
        updateUIForUser();
        this.reset(); // Limpiar el formulario
        this.removeAttribute('data-edit-id');
        // Restaurar texto del boton
        document.querySelector('#news-form button[type="submit"]').textContent = 'Crear noticia';
        showView('home');
        alert(`Bienvenido, ${user.username}`);
    } else {
        alert('Credenciales incorrectas');
    }
});
// Modificamos las funciones de acciones para verificar permisos
function deleteNews(id) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('No tienes permisos para esta acción');
        return;
    }
    if (!confirm("¿Estás seguro de que deseas eliminar esta noticia?")) return;
    
    const index = news.findIndex(n => n.id === id);
    if (index !== -1) {
        news.splice(index, 1);
    }
    
    let storedNews = JSON.parse(localStorage.getItem('news')) || [];
    storedNews = storedNews.filter(n => n.id !== id);
    localStorage.setItem('news', JSON.stringify(storedNews));
    if (comments[id]) {
        delete comments[id];
        localStorage.setItem('comments', JSON.stringify(comments));
    }
    renderNews();
}

const news = [];
let favorites = JSON.parse(localStorage.getItem('favorites')) || [];
let comments = JSON.parse(localStorage.getItem('comments')) || {}; // { noticiaId: [comentarios] }
function showView(view) {
        // Si no está logueado y trata de acceder a crear noticias
    if ((view === 'create-news' || view === 'favorites') && !currentUser) {
        alert('Debes iniciar sesión para acceder a esta sección');
        showView('login');
        return;
    }

    document.querySelectorAll('main > section').forEach(section => {
        section.classList.add('section-hidden');
    });

    document.getElementById(view + '-view').classList.remove('section-hidden');

    if (view === 'home') {
        renderNews();
    } else if (view === 'favorites') {
        renderFavorites();
    } else if (view === 'comments') {
        // Al ir a la vista de comentarios, si no hay una noticia seleccionada,
        // se mostrará un mensaje indicando que se debe seleccionar una.
        // Si se quiere mostrar los comentarios de la última noticia vista,
        // se podría guardar el ID de la última noticia vista en una variable global.
        renderComments(document.getElementById('comment-form').getAttribute('data-news-id'));
    } else if (view === 'create-news') {
        document.getElementById('news-form').reset();
        document.getElementById('news-form').removeAttribute('data-edit-id'); // Limpiar el ID de edición al crear nueva noticia
    } else if (view === 'login') {
        document.getElementById('login-form').reset();
    }
}
document.getElementById('search-news').addEventListener('input', function() {
    renderNews(this.value);
});

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

function viewDetails(id) {
    const movie = news.find(n => n.id === id);
    document.getElementById('movie-title').textContent = movie.title;
    document.getElementById('movie-image').src = movie.image;
    document.getElementById('movie-image').alt = movie.title;
    document.getElementById('movie-description').textContent = movie.content;
    showView('details');
    // Set the news ID for the comment form
    document.getElementById('comment-form').setAttribute('data-news-id', id);
    // Render comments for the specific news item
    renderComments(id); // Pasa el ID de la noticia para renderizar sus comentarios
}
// Añadir a favoritos
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
    const newsId = this.getAttribute('data-news-id'); // Obtener el ID de la noticia del atributo data
    if (comment && newsId) {
        if (!comments[newsId]) {
            comments[newsId] = []; // Inicializar el array si no existe
        }
        comments[newsId].push(comment);
        localStorage.setItem('comments', JSON.stringify(comments));
        commentInput.value = ''; // Limpiar el input
        renderComments(newsId); // Volver a renderizar los comentarios para esta noticia
    } else if (!newsId) {
        alert('Por favor, selecciona una noticia para añadir un comentario.');
    } else {
        alert('El comentario no puede estar vacío.');
    }
});

function renderComments(newsId) {
    const commentsList = document.getElementById('comments-list');
    commentsList.innerHTML = ''; // Limpiar la lista antes de renderizar
    if (!newsId) {
        commentsList.innerHTML = '<li>Selecciona una noticia para ver sus comentarios.</li>';
        return;
    }
    const newsComments = comments[newsId] || [];
    if (newsComments.length === 0) {
        commentsList.innerHTML = '<li>No hay comentarios aún para esta noticia.</li>';
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
    if (comments[newsId] && comments[newsId].length > index) {
        comments[newsId].splice(index, 1);
        localStorage.setItem('comments', JSON.stringify(comments));
        renderComments(newsId);
    }
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

    // Verificar si estamos editando una noticia existente
    const editId = this.getAttribute('data-edit-id');
    if (editId) {
        // Editar noticia existente
        const idx = news.findIndex(n => n.id == editId);
        if (idx !== -1) {
            news[idx] = { ...news[idx], title, description, image, content, date }; // Mantener likes/dislikes
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

    /// Eliminar comentarios asociados a esta noticia
    if (comments[id]) {
        delete comments[id];
        localStorage.setItem('comments', JSON.stringify(comments));
    }
    renderNews();
}

// Actualizamos las protecciones para las funciones
function editNews(id) {
    if (!currentUser || currentUser.role !== 'admin') {
        alert('Solo el administrador puede editar noticias');
        return;
    }
    const noticia = news.find(n => n.id === id);
    if (!noticia) {
        alert('Noticia no encontrada');
        return;
    }

    // Redirigir al formulario de crear/editar noticias
    showView('create-news');

    // Llenar el formulario con los datos de la noticia existente
    document.getElementById('news-title').value = noticia.title;
    document.getElementById('news-description').value = noticia.description;
    document.getElementById('news-image').value = noticia.image;
    document.getElementById('news-content').value = noticia.content;
    document.getElementById('news-date').value = noticia.date;

    // Guardar el ID de la noticia que estamos editando
    document.getElementById('news-form').setAttribute('data-edit-id', id);
    
    // Cambiar el texto del botón de submit
    document.querySelector('#news-form button[type="submit"]').textContent = 'Guardar Cambios';
}
    // Modificamos el manejador del formulario para soportar edición
    document.getElementById('news-form').addEventListener('submit', function(e) {
    e.preventDefault();

    // Obtener los valores del formulario
    const title = document.getElementById('news-title').value.trim();
    const description = document.getElementById('news-description').value.trim();
    const image = document.getElementById('news-image').value.trim();
    const content = document.getElementById('news-content').value.trim();
    const date = document.getElementById('news-date').value;

    // Validaciones
    if (!title || !description || !image || !content || !date) {
        alert('Todos los campos son requeridos');
        return;
    }
    if (!/^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(image)) {
        alert('Por favor, ingresa una URL de imagen válida (jpg, png, webp, gif).');
        return;
    }

    // Verificamos si estamos editando o creando una noticia existente
    const editId = this.getAttribute('data-edit-id');
    
    if (editId) {
        // Estamos editando una noticia existente
        const index = news.findIndex(n => n.id == editId);
        if (index !== -1) {
            // Mantenemos los likes/dislikes de la noticia original
            const originalLikes = news[index].likes || 0;
            const originalDislikes = news[index].dislikes || 0;

            news[index] = {
                id: parseInt(editId),
                title,
                description,
                image,
                content,
                date,
                likes: originalLikes,
                dislikes: originalDislikes
            };

            // Actualizamos localStorage
            localStorage.setItem('news', JSON.stringify(news));
            alert('Noticia actualizada correctamente');
        }
    } else {
        // Estamos creando una nueva noticia
        const newId = news.length ? Math.max(...news.map(n => n.id)) + 1 : 1;
        news.push({
            id: newId,
            title,
            description,
            image,
            content,
            date,
            likes: 0,
            dislikes: 0
        });

        news.push(newNews);
        localStorage.setItem('news', JSON.stringify(news));
        alert('Noticia creada correctamente');
    }

    this.reset(); // Limpiar el formulario
    this.removeAttribute('data-edit-id'); // Limpiar el ID de edición
    // Restauramos el texto del botón
    document.getElementById('news-form').querySelector('button[type="submit"]').innerText = 'Crear noticia';

    // Volver a la vista principal
    renderNews();
    showView('home');
});

// Actualizamos renderNews para que muestre el botón de edición solo al admin
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
        clone.querySelector('.edit-btn').onclick = () => editNews(item.id);
        clone.querySelector('.like-btn').onclick = () => likeNews(item.id);
        clone.querySelector('.like-count').textContent = item.likes || 0;
        clone.querySelector('.dislike-btn').onclick = () => dislikeNews(item.id);
        clone.querySelector('.dislike-count').textContent = item.dislikes || 0;

        // Mostrar botones de admin solo si el usuario es el admin
        const adminButtons = clone.querySelectorAll('.admin-only');
        adminButtons.forEach(btn => {
            btn.style.display = (currentUser && currentUser.role === 'admin') ? 'inline-block' : 'none';
        });

        newsContainer.appendChild(clone);
    });
}

// Conteo de likes y dislikes
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

// Función auxiliar para formatear fechas
function formatDate(dateString) {
    if (!dateString) return "Sin fecha";
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}
