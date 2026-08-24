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
      config: {
        url:
          process.env.DEMO_STREAM_URL ||
          'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8'
      }
    }
  ],

  cache_ttl: 3600
};
