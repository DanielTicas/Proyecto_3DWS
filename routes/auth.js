const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const connection = require('../config/database');
const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { nombre, email, password } = req.body;

    const [users] = await connection.promise().query(
      'SELECT user_id FROM users WHERE email = ?', 
      [email]
    );

    if (users.length > 0) {
      return res.status(400).json({ error: 'Email ya registrado' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const [result] = await connection.promise().query(
      'INSERT INTO users (nombre, email, password_hash) VALUES (?, ?, ?)',
      [nombre, email, hashedPassword]
    );

    const token = jwt.sign(
      { user_id: result.insertId, email: email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.status(201).json({ 
      user_id: result.insertId, 
      token: token,
      message: 'Usuario registrado exitosamente' 
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const [users] = await connection.promise().query(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: 'Usuario no encontrado' });
    }

    const user = users[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!validPassword) {
      return res.status(400).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign(
      { user_id: user.user_id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      user_id: user.user_id,
      token: token,
      message: 'Login exitoso'
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;