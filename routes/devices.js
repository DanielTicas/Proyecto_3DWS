const express = require('express');
const connection = require('../config/database');
const { authenticateToken } = require('../middlewares/auth');
const router = express.Router();

/* --------------------- GET dispositivo por IP --------------------- */
router.get('/:ip', authenticateToken, async (req, res) => {
  try {
    const { ip } = req.params;
    const [devices] = await connection.promise().query(
      'SELECT * FROM devices WHERE ip_dispositivo = ?',
      [ip]
    );

    if (devices.length === 0) {
      return res.status(404).json({ error: 'Dispositivo no encontrado' });
    }

    res.json(devices[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* --------------------- POST crear dispositivo --------------------- */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { ip_dispositivo, nombre } = req.body;

    const [result] = await connection.promise().query(
      'INSERT INTO devices (ip_dispositivo, nombre) VALUES (?, ?)',
      [ip_dispositivo, nombre]
    );

    res.status(201).json({ 
      device_id: result.insertId,
      message: 'Dispositivo registrado' 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* --------------------- PUT actualizar dispositivo --------------------- */
router.put('/:ip', authenticateToken, async (req, res) => {
  try {
    const { ip } = req.params;
    const { nombre } = req.body;

    const [result] = await connection.promise().query(
      'UPDATE devices SET nombre = ? WHERE ip_dispositivo = ?',
      [nombre, ip]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Dispositivo no encontrado' });
    }

    res.json({ message: 'Dispositivo actualizado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* --------------------- DELETE eliminar dispositivo --------------------- */
router.delete('/:ip', authenticateToken, async (req, res) => {
  try {
    const { ip } = req.params;

    const [result] = await connection.promise().query(
      'DELETE FROM devices WHERE ip_dispositivo = ?',
      [ip]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Dispositivo no encontrado' });
    }

    res.json({ message: 'Dispositivo eliminado' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;