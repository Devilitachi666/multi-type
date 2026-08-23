module.exports = {
    metadata: {
        api_key: process.env.TMDB_API_KEY || '',
        base_url: 'https://api.themoviedb.org/3'
    },

    providers: [],

    cache_ttl: 3600
};
