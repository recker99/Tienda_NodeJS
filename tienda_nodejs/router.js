const express = require('express');
const app = express();
const path = require('path');

// Configurar la carpeta de vistas y el motor de plantillas
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Ruta para la página de Inicio
app.get('/', (req, res) => {
    res.render('index'); 
});

// Ruta para /productos
app.get('/productos', (req, res) => {
    res.render('productos'); 
});

// Ruta para listar los usuarios
app.get('/listarUsuarios', (req, res) => {
    connection.query('SELECT * FROM usuarios', (error, results) => {
      if (error) throw error;
      res.render('listarUsuarios', { usuarios: results });
    });
  });

// Servidor corriendo
app.listen(3000, () => {
    console.log('Servidor corriendo en http://localhost:3000');
});
