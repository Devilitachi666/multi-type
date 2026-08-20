const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());

const TMDB_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";

// Helper for TMDB Requests
const tmdb = async (path, params = {}) => {
    const response = await axios.get(`${TMDB_BASE}${path}`, {
        params: { api_key: TMDB_KEY, ...params }
    });
    return response.data;
};

// 1. Trending
app.get('/api/trending', async (req, res) => {
    try {
        const data = await tmdb('/trending/all/day');
        res.json(data.results);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 2. Search
app.get('/api/search', async (req, res) => {
    try {
        const data = await tmdb('/search/multi', { query: req.query.q });
        res.json(data.results);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 3. Detailed Info (Includes Cast & Recommendations)
app.get('/api/details/:type/:id', async (req, res) => {
    try {
        const { type, id } = req.params;
        const data = await tmdb(`/${type}/${id}`, { append_to_response: 'credits,recommendations,videos' });
        res.json(data);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

// 4. Genres
app.get('/api/genres', async (req, res) => {
    try {
        const movieGenres = await tmdb('/genre/movie/list');
        res.json(movieGenres.genres);
    } catch (err) { res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend Active on Port ${PORT}`));
