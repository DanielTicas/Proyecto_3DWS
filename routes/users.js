const express = require('express');
const connection = require('../config/database');
const { authenticateToken } = require('../middlewares/auth');
const router = express.Router();

router.post('/:deviceId/users', authenticateToken, async (req, res) => {
  try {
    const { deviceId } = req.params;
    const { userId } = req.body;

    const [userCount] = await connection.promise().query(
      'SELECT COUNT(*) as count FROM device_users WHERE device_id = ?',
      [deviceId]
    );

    if (userCount[0].count >= 4) {
      return res.status(400).json({ error: 'Límite de 4 usuarios alcanzado' });
    }

    await connection.promise().query(
      'INSERT INTO device_users (user_id, device_id) VALUES (?, ?)',
      [userId, deviceId]
    );

    res.status(201).json({ message: 'Usuario vinculado al dispositivo' });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;