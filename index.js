const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// 1. Force CORS for all origins
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const TMDB_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";

const tmdb = async (path, params = {}) => {
    const response = await axios.get(`${TMDB_BASE}${path}`, {
        params: { api_key: TMDB_KEY, ...params }
    });
    return response.data;
};

app.get('/api/trending', async (req, res) => {
    try {
        const data = await tmdb('/trending/all/day');
        res.json(data.results);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/search', async (req, res) => {
    try {
        const data = await tmdb('/search/multi', { query: req.query.q });
        res.json(data.results);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/details/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        const data = await tmdb(`/${type}/${id}`, { append_to_response: 'credits,recommendations' });
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// Export the app
module.exports = app;
