const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
const router = express.Router();

// Enable CORS
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
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

// Define routes on the router
router.get('/trending', async (req, res) => {
    try {
        const data = await tmdb('/trending/all/day');
        res.json(data.results);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/search', async (req, res) => {
    try {
        const data = await tmdb('/search/multi', { query: req.query.q });
        res.json(data.results);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/details/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        const data = await tmdb(`/${type}/${id}`, { append_to_response: 'credits,recommendations' });
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// IMPORTANT: This tells Express to handle routes starting with /api
app.use('/api', router);

// Fallback for the root URL
app.get('/', (req, res) => res.send('MovieDekhlo API is Running...'));

module.exports = app;
