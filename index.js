const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

// Global Headers for CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

const TMDB_KEY = process.env.TMDB_API_KEY;
const BASE = "https://api.themoviedb.org/3";

const tmdb = async (path, params = {}) => {
    const res = await axios.get(`${BASE}${path}`, { params: { api_key: TMDB_KEY, ...params } });
    return res.data;
};

const router = express.Router();

router.get('/trending', async (req, res) => {
    const data = await tmdb('/trending/all/week');
    res.json(data.results);
});

router.get('/details/:type/:id', async (req, res) => {
    const data = await tmdb(`/${req.params.type}/${req.params.id}`, { append_to_response: 'credits,recommendations' });
    res.json(data);
});

router.get('/tv/:id/season/:sn', async (req, res) => {
    const data = await tmdb(`/tv/${req.params.id}/season/${req.params.sn}`);
    res.json(data.episodes);
});

router.get('/search', async (req, res) => {
    const data = await tmdb('/search/multi', { query: req.query.q });
    res.json(data.results);
});

app.use('/api', router);
module.exports = app;
