const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// FORCE PUBLIC ACCESS HEADERS
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

const TMDB_KEY = process.env.TMDB_API_KEY;
const BASE = "https://api.themoviedb.org/3";

const fetchTMDB = async (path, params = {}) => {
    const res = await axios.get(`${BASE}${path}`, { params: { api_key: TMDB_KEY, ...params } });
    return res.data;
};

// Routing for Vercel
const router = express.Router();

router.get('/trending', async (req, res) => {
    try {
        const data = await fetchTMDB('/trending/all/week');
        res.json(data.results);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/details/:type/:id', async (req, res) => {
    try {
        const data = await fetchTMDB(`/${req.params.type}/${req.params.id}`, { append_to_response: 'credits,recommendations' });
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/tv/:id/season/:sn', async (req, res) => {
    try {
        const data = await fetchTMDB(`/tv/${req.params.id}/season/${req.params.sn}`);
        res.json(data.episodes);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

app.use('/api', router);
module.exports = app;
