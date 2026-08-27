/**
 * Individual iFrame Provider Implementation Classes
 */

class DemoProvider {
    static async getStreams(id, type, season = 1, episode = 1) {
        const embedUrl = type === 'movie'
            ? `https://vidlink.pro/movie/${id}`
            : `https://vidlink.pro/tv/${id}/${season}/${episode}`;

        return [{
            stream: {
                id: `demo-${id}`,
                serverName: 'VidLink (Demo)',
                url: embedUrl,
                type: 'iframe'
            },
            providerInfo: {
                id: 'demo',
                name: 'VidLink Demo Provider',
                priority: 1
            }
        }];
    }
}

class VidLinkProvider {
    static async getStreams(id, type, season = 1, episode = 1) {
        const url = type === 'movie'
            ? `https://vidlink.pro/movie/${id}`
            : `https://vidlink.pro/tv/${id}/${season}/${episode}`;

        return [{
            stream: { id: `vidlink-${id}`, serverName: 'VidLink', url, type: 'iframe' },
            providerInfo: { id: 'vidlink', name: 'VidLink', priority: 1 }
        }];
    }
}

class AutoEmbedProvider {
    static async getStreams(id, type, season = 1, episode = 1) {
        const url = type === 'movie'
            ? `https://player.autoembed.cc/embed/movie/${id}`
            : `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}`;

        return [{
            stream: { id: `autoembed-${id}`, serverName: 'AutoEmbed', url, type: 'iframe' },
            providerInfo: { id: 'autoembed', name: 'AutoEmbed', priority: 2 }
        }];
    }
}

class VidSrcMeProvider {
    static async getStreams(id, type, season = 1, episode = 1) {
        const url = type === 'movie'
            ? `https://vidsrcme.su/embed/movie/${id}`
            : `https://vidsrcme.su/embed/tv/${id}/${season}/${episode}`;

        return [{
            stream: { id: `vidsrc-me-${id}`, serverName: 'VidSrc.me', url, type: 'iframe' },
            providerInfo: { id: 'vidsrc-me', name: 'VidSrc.me', priority: 3 }
        }];
    }
}

class TwoEmbedProvider {
    static async getStreams(id, type, season = 1, episode = 1) {
        const url = type === 'movie'
            ? `https://www.2embed.cc/embed/${id}`
            : `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`;

        return [{
            stream: { id: `2embed-${id}`, serverName: '2Embed', url, type: 'iframe' },
            providerInfo: { id: '2embed', name: '2Embed', priority: 4 }
        }];
    }
}

module.exports = {
    demo: DemoProvider,
    vidlink: VidLinkProvider,
    autoembed: AutoEmbedProvider,
    'vidsrc-me': VidSrcMeProvider,
    '2embed': TwoEmbedProvider
};
