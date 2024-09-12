// 1 - Invocamos a Express
const express = require('express');
const app = express();

// 2 - Para poder capturar los datos del formulario
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// 3 - Invocamos a dotenv
const dotenv = require('dotenv');
dotenv.config({ path: './env/.env' });

// 4 - Seteamos el directorio de assets
app.use('/resources', express.static('public'));


// 5 - Establecemos el motor de plantillas
app.set('view engine', 'ejs');

// 6 - Invocamos a bcrypt
const bcrypt = require('bcryptjs');

// 7 - Variables de sesión
const session = require('express-session');
app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true
}));

// 8 - Invocamos a la conexión de la DB
const connection = require('./database/db');

// 9 - Establecemos las rutas para login y registro
app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/register', (req, res) => {
  res.render('register');
});

// 10 - Método para la registración
app.post('/register', async (req, res) => {
  const { user, name, password, email } = req.body;
  let passwordHash = await bcrypt.hash(password, 8);
  connection.query('INSERT INTO users SET ?', { user, name, password: passwordHash, email }, (error, results) => {
    if (error) {
      console.log(error);
    } else {
      res.render('register', {
        alert: true,
        alertTitle: "Registration",
        alertMessage: "¡Successful Registration!",
        alertIcon: 'success',
        showConfirmButton: false,
        timer: 1500,
        ruta: ''
      });
    }
  });
});

// 11 - Método para autenticación
app.post('/auth', async (req, res) => {
  const { user, password } = req.body;
  if (user && password) {
    connection.query('SELECT * FROM users WHERE user = ?', [user], async (error, results) => {
      if (results.length == 0 || !(await bcrypt.compare(password, results[0].password))) {
        res.render('login', {
          alert: true,
          alertTitle: "Error",
          alertMessage: "Usuario y/o contraseña incorrectos",
          alertIcon: 'error',
          showConfirmButton: true,
          ruta: 'login'
        });
      } else {
        req.session.loggedin = true;
        req.session.name = results[0].name;
        res.render('login', {
          alert: true,
          alertTitle: "Conexión exitosa",
          alertMessage: "¡Login correcto!",
          alertIcon: 'success',
          showConfirmButton: false,
          timer: 1500,
          ruta: ''
        });
      }
    });
  } else {
    res.send('Please enter user and password!');
  }
});

// 12 - Controlar la autenticación en todas las páginas
app.get('/', isAuthenticated, (req, res) => {
  res.render('index', { login: true, name: req.session.name });
});

// 13 - Logout y destrucción de sesión
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/');
  });
});

// 14 - Mostrar productos (solo usuarios autenticados)
app.get('/productos', isAuthenticated, (req, res) => {
  connection.query('SELECT * FROM productos', (error, results) => {
    if (error) throw error;
    res.render('productos', { results });
  });
});

// 15 - Crear producto (solo usuarios autenticados)
app.get('/create_prod', isAuthenticated, (req, res) => {
  res.render('create_prod');
});


// 16 - Editar producto (solo usuarios autenticados)
app.get('/edit/:id', isAuthenticated, (req, res) => {
  const { id } = req.params;
  connection.query('SELECT * FROM productos WHERE id = ?', [id], (error, results) => {
    if (error) {
      console.error(error);
      return res.status(500).send('Error en la base de datos.');
    }
    if (results.length > 0) {
      res.render('edit_prod.ejs', { prod: results[0] });
    } else {
      res.status(404).send('Producto no encontrado.');
    }
  });
});

// 17 - Actualizar producto
app.post('/update', (req, res) => {
    const { id, nomb, cant, prec, stk, obs } = req.body;
    connection.query('UPDATE productos SET nombre = ?, cantidad = ?, precio = ?, stock = ?, observacion = ? WHERE id = ?', [nomb, cant, prec, stk, obs, id], (error) => {
      if (error) {
        console.error(error);
        return res.status(500).send('Error en la actualización del producto.');
      }
      res.redirect('/productos');
    });
  });

// 18 - Eliminar producto (solo usuarios autenticados)
app.get('/delete/:id', isAuthenticated, (req, res) => {
  const { id } = req.params;
  connection.query('DELETE FROM productos WHERE id = ?', [id], (error) => {
    if (error) console.log(error);
    res.redirect('/productos');
  });
});

// 19 - Listar usuarios (solo usuarios autenticados)
app.get('/listarUsuarios', isAuthenticated, (req, res) => {
  connection.query('SELECT * FROM users', (error, results) => {
    if (error) {
      console.log(error);
      return res.status(500).send('Error en la consulta de usuarios.');
    }
    res.render('listarUsuarios', { usuarios: results });
  });
});

// Middleware para verificar si el usuario está logueado
function isAuthenticated(req, res, next) {
  if (req.session.loggedin) {
    return next();
  } else {
    res.redirect('/login');
  }
}

// Iniciar el servidor
app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
