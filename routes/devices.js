const connection = require('../config/database');

const devicesController = {
  // Obtener todos los dispositivos del usuario
  getUserDevices: async (req, res) => {
    try {
      const userId = req.user.userId;
      
      const query = `
        SELECT d.* FROM devices d
        INNER JOIN device_users du ON d.device_id = du.device_id
        WHERE du.user_id = ?
      `;
      
      const [devices] = await connection.promise().query(query, [userId]);
      
      res.json(devices);
    } catch (error) {
      console.error('Error al obtener dispositivos:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  },

  // Agregar un nuevo dispositivo
  addDevice: async (req, res) => {
    try {
      const userId = req.user.userId;
      const { ip_dispositivo, nombre } = req.body;
      
      // 1. Insertar el dispositivo
      const insertDeviceQuery = 'INSERT INTO devices (ip_dispositivo, nombre) VALUES (?, ?)';
      const [deviceResult] = await connection.promise().query(insertDeviceQuery, [ip_dispositivo, nombre]);
      
      // 2. Vincular dispositivo al usuario
      const linkDeviceQuery = 'INSERT INTO device_users (user_id, device_id) VALUES (?, ?)';
      await connection.promise().query(linkDeviceQuery, [userId, deviceResult.insertId]);
      
      res.status(201).json({
        message: 'Dispositivo agregado exitosamente',
        deviceId: deviceResult.insertId
      });
    } catch (error) {
      console.error('Error al agregar dispositivo:', error);
      
      // Si es error de duplicado
      if (error.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'La dirección IP ya existe' });
      }
      
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  }
};

module.exports = devicesController;