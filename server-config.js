module.exports = {
  metadata: {
    api_key: process.env.TMDB_API_KEY || '',
    base_url: 'https://api.themoviedb.org/3'
  },

  providers: [
    {
      id: 'demo',
      enabled: true,
      priority: 1,
      config: {}
    }
  ],

  cache_ttl: 3600
};
