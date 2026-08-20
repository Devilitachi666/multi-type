const express = require('express');
const cors = require('cors');
const axios = require('axios');
const providerManager = require('./providers/index');

const app = express();
app.use(cors());
// HARDENED CORS MIDDLEWARE
app.use((req, res, next) => {
    // Allows your specific blogger site or any origin (*)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    // Handle Browser Pre-flight (OPTIONS) requests
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    next();
});

const TMDB_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";

const tmdbFetch = async (path, params = {}) => {
    const response = await axios.get(`${TMDB_BASE}${path}`, {
        params: { api_key: TMDB_KEY, ...params }
    });
    return response.data;
};

// Metadata Routes
app.get('/api/trending', async (req, res) => {
    try {
        const data = await tmdbFetch('/trending/all/week');
        res.json(data.results);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/search', async (req, res) => {
    try {
        const data = await tmdbFetch('/search/multi', { query: req.query.q });
        res.json(data.results);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/details/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        const data = await tmdbFetch(`/${type}/${id}`, { append_to_response: 'credits,recommendations,videos' });
        res.json(data);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/tv/:id/season/:sn', async (req, res) => {
    try {
        const data = await tmdbFetch(`/tv/${req.params.id}/season/${req.params.sn}`);
        res.json(data.episodes);
    } catch (e) { res.status(500).json({ error: e.message }); }
});

// Sources Route
app.get('/api/sources', async (req, res) => {
    const { type, id, s, e } = req.query;
    try {
        const results = await providerManager.fetchAllSources(type, id, s, e);
        res.json(results);
    } catch (err) { res.status(500).json({ error: "Source fetch failed" }); }
});

module.exports = app;
