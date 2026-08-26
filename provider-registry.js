class DemoProvider {

  static async getStreams(id, type, season, episode) {

    return [
      {
        stream: {
          id: `demo-${id}`,
          serverName: 'Demo HLS Server',
          url: 'https://devstreaming-cdn.apple.com/videos/streaming/examples/img_bipbop_adv_example_ts/master.m3u8',
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
