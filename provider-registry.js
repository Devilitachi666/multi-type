const ProviderService = require('./providers');

class DemoProvider extends ProviderService {
  async getStreams(id, type, s = null, e = null) {
    return [
      {
        stream: {
    id: `demo-${id}`,
    serverName: 'Demo HLS Server',

    url:
        url: 'https://wowzaec2demo.streamlock.net/vod-multitrack/_definst_/smil:ElephantsDream/elephantsdream2.smil/playlist.m3u',

    type: 'hls',

    /*
     * These are defaults only.
     * The actual HLS manifest determines
     * available qualities/audio tracks.
     */
    quality: 'auto',
    qualities: [],

    languages: [],

    audioTracks: [],

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
