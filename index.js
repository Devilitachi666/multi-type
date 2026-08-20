const express = require('express');
const axios = require('axios');
const cors = require('cors');
const providerManager = require('./providerManager');

const app = express();

// 1. MANUAL CORS HEADERS (Hardened for Vercel + Blogger)
app.use((req, res, next) => {
    // Allows your Blogger site to fetch data
    res.setHeader('Access-Control-Allow-Origin', '*'); 
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle Browser Pre-flight (OPTIONS)
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
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
    try {
        const data = await tmdb('/trending/all/week');
        res.json(data.results);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/details/:type/:id', async (req, res) => {
    try {
        const data = await tmdb(`/${req.params.type}/${req.params.id}`, { append_to_response: 'credits,recommendations' });
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/tv/:id/season/:sn', async (req, res) => {
    try {
        const data = await tmdb(`/tv/${req.params.id}/season/${req.params.sn}`);
        res.json(data.episodes);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/sources', (req, res) => {
    res.json(providerManager.getAvailable());
});

router.get('/watch', (req, res) => {
    const { p, type, id, s, e } = req.query;
    res.json(providerManager.getSource(p, type, id, s, e));
});

// Root API check
app.use('/api', router);
app.get('/', (req, res) => res.send('MovieDekhlo API is Online and CORS is Enabled.'));

module.exports = app;
