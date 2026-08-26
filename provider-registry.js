class DemoProvider {

  static async getStreams(id, type, season, episode) {

    return [
      {
        stream: {
          id: `demo-${id}`,
          serverName: 'Shaka Angel One HLS',
          url: 'https://storage.googleapis.com/shaka-demo-assets/angel-one-hls/hls.m3u8',
          type: 'hls',
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
