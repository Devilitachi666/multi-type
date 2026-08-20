const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());

// Global Headers for explicit CORS safety
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    next();
});

const TMDB_KEY = process.env.TMDB_API_KEY;
const BASE_URL = "https://api.themoviedb.org/3";

const tmdb = async (path, params = {}) => {
    const response = await axios.get(`${BASE_URL}${path}`, {
        params: { api_key: TMDB_KEY, ...params }
    });
    return response.data;
};

const router = express.Router();

router.get('/trending', async (req, res) => {
    try {
        const data = await tmdb('/trending/all/week');
        res.json(data.results);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/search', async (req, res) => {
    try {
        const data = await tmdb('/search/multi', { query: req.query.q });
        res.json(data.results);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/details/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        const data = await tmdb(`/${type}/${id}`, { append_to_response: 'credits,recommendations' });
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

router.get('/tv/:id/season/:sn', async (req, res) => {
    try {
        const data = await tmdb(`/tv/${req.params.id}/season/${req.params.sn}`);
        res.json(data.episodes);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.use('/api', router);

module.exports = app;
