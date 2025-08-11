// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const firebase = require('firebase/app');
require('firebase/firestore');

const app = express();

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/cineverse', { useNewUrlParser: true, useUnifiedTopology: true });

const NewsSchema = new mongoose.Schema({
    title: String,
    description: String,
    image: String,
    content: String,
});

const News = mongoose.model('News', NewsSchema);

// Configuración de Firebase
const firebaseConfig = { /* ...tu config... */ };
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Guardar noticia
app.post('/news', async (req, res) => {
    const news = req.body;
    await db.collection("news").add(news);
    res.json(news);
});

// Leer noticias
app.get('/news', async (req, res) => {
    const snapshot = await db.collection("news").get();
    const news = [];
    snapshot.forEach((doc) => {
        news.push({ id: doc.id, ...doc.data() });
    });
    res.json(news);
});

// ...puedes agregar rutas para eliminar y actualizar...
app.listen(3000, () => console.log('Servidor corriendo en http://localhost:3000'));
