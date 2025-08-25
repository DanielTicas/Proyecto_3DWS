const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connection = require('../config/database');

const authController = {
  // Función para iniciar sesión
  login: async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // 1. Buscar usuario en la base de datos
      const query = 'SELECT * FROM users WHERE email = ?';
      const [users] = await connection.promise().query(query, [email]);
      
      if (users.length === 0) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
      }
      
      const user = users[0];
      
      // 2. Verificar contraseña
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({ error: 'Credenciales incorrectas' });
      }
      
      // 3. Generar token JWT
      const token = jwt.sign(
        { 
          userId: user.user_id, 
          email: user.email,
          nombre: user.nombre 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' } // El token expira en 24 horas
      );
      
      // 4. Responder con el token y información del usuario
      res.json({
        message: 'Inicio de sesión exitoso',
        token,
        user: {
          id: user.user_id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol
        }
      });
      
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Función para registrar nuevo usuario
  register: async (req, res) => {
    try {
      const { nombre, email, password } = req.body;
      
      // 1. Verificar si el usuario ya existe
      const checkUserQuery = 'SELECT * FROM users WHERE email = ?';
      const [existingUsers] = await connection.promise().query(checkUserQuery, [email]);
      
      if (existingUsers.length > 0) {
        return res.status(409).json({ error: 'El usuario ya existe' });
      }
      
      // 2. Hash de la contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      
      // 3. Insertar nuevo usuario en la base de datos
      const insertQuery = 'INSERT INTO users (nombre, email, password_hash) VALUES (?, ?, ?)';
      const [result] = await connection.promise().query(insertQuery, [nombre, email, hashedPassword]);
      
      // 4. Generar token para el nuevo usuario
      const token = jwt.sign(
        { 
          userId: result.insertId, 
          email: email,
          nombre: nombre 
        },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      
      // 5. Responder con éxito
      res.status(201).json({
        message: 'Usuario creado exitosamente',
        token,
        user: {
          id: result.insertId,
          nombre,
          email,
          rol: 'usuario' // Rol por defecto
        }
      });
      
    } catch (error) {
      console.error('Error en registro:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = authController;