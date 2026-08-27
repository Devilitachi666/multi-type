class DemoProvider {

    static async getStreams(id, type, season, episode) {

        const result = {
            stream: {
                id: `demo-${id}`,
                serverName: 'Apple HLS Demo',
                url: 'https://devilitachi666.github.io/maroonflix-hls-test/master.m3u8',
                type: 'hls',
                quality: null,
                qualities: [],
                languages: [],
                audioTracks: [],
                subtitles: []
            },
            providerInfo: {
                id: 'demo',
                name: 'Apple HLS Demo Provider',
                priority: 1
            }
        };

        return [result];
    }
}

module.exports = {
    demo: DemoProvider
};
