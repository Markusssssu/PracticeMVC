const express = require('express');
const { Sequelize, DataTypes } = require('sequelize');
const path = require('path');

const app = express();
const PORT = 3000;

// Database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false,
});

// Model
const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  login: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  name: { type: DataTypes.STRING, allowNull: false },
  profilePhoto: { type: DataTypes.TEXT, allowNull: true },
  photoMimeType: { type: DataTypes.STRING, allowNull: true },
});

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname)));

// API Routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.findAll({ order: [['id', 'ASC']] });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Error loading users' });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error loading user' });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const { login, password, name, profilePhoto, photoMimeType } = req.body;
    if (!login || !password || !name) {
      return res.status(400).json({ error: 'All fields required' });
    }
    
    const user = await User.create({ login, password, name, profilePhoto, photoMimeType });
    res.json(user);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Login exists' });
    }
    res.status(400).json({ error: 'Error creating user' });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    await user.update(req.body);
    res.json(user);
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Login exists' });
    }
    res.status(400).json({ error: 'Error updating user' });
  }
});

// ИСПРАВЛЕННЫЙ DELETE метод
app.delete('/api/users/:id', async (req, res) => {
  try {
    console.log('DELETE request for user ID:', req.params.id); // Логируем запрос
    
    const user = await User.findByPk(req.params.id);
    if (!user) {
      console.log('User not found');
      return res.status(404).json({ error: 'User not found' });
    }
    
    await user.destroy();
    console.log('User deleted successfully');
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Error deleting user: ' + error.message });
  }
});

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Start server
sequelize.sync().then(() => {
  app.listen(PORT, () => console.log('Server running on http://localhost:' + PORT));
});