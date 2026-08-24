const ProviderService = require('./providers');

class DemoProvider extends ProviderService {
  async getStreams(id, type, s = null, e = null) {
    const url =
      this.config.url ||
      'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

    return [
      {
        stream: {
          id: `demo-${id}`,
          serverName: 'Demo HLS Server',
          url,
          type: 'hls',
          quality: '1080p',
          qualities: ['1080p'],
          languages: ['English'],
          audioTracks: [
            {
              language: 'English',
              label: 'English'
            }
          ],
          subtitles: []
        },
        providerInfo: {
          id: 'demo',
          name: 'Demo Provider',
          priority: 1
        }
      }
    ];
  }
}

module.exports = {
  demo: DemoProvider
};
