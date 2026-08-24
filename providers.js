const providers = {
  demo: {
    name: 'Demo Provider',

    getSources: async ({ id, type, season, episode }) => {
      return [
        {
          name: 'Demo Server',
          url: 'https://example.com/your-video.m3u8',
          type: 'hls',
          quality: '1080p',
          language: 'English',
          provider: 'demo',
          id,
          mediaType: type,
          season,
          episode
        }
      ];
    }
  }
};

module.exports = providers;
