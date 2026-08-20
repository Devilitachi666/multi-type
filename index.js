const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();
const router = express.Router();

app.use(cors());
const TMDB_KEY = process.env.TMDB_API_KEY;
const BASE = "https://api.themoviedb.org/3";

const fetchTMDB = async (path, params = {}) => {
    const res = await axios.get(`${BASE}${path}`, { params: { api_key: TMDB_KEY, ...params } });
    return res.data;
};

router.get('/trending', async (req, res) => {
    const data = await fetchTMDB('/trending/all/week');
    res.json(data.results);
});

router.get('/details/:type/:id', async (req, res) => {
    const data = await fetchTMDB(`/${req.params.type}/${req.params.id}`, { append_to_response: 'credits,recommendations' });
    res.json(data);
});

router.get('/tv/:id/season/:sn', async (req, res) => {
    const data = await fetchTMDB(`/tv/${req.params.id}/season/${req.params.sn}`);
    res.json(data.episodes);
});

app.use('/api', router);
module.exports = app;
