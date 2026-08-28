/**
 * Individual iFrame Provider Implementation Classes
 * Configured with exact custom URL patterns
 */

class VidLinkProvider {
    async getStreams(id, type, season = 1, episode = 1, options = {}) {
        const subOrDub = options.subOrDub || 'sub';
        let url = '';

        if (type === 'anime') {
            url = `https://vidlink.pro/anime/${id}/${episode}/${subOrDub}?fallback=true`;
        } else if (type === 'tv') {
            url = `https://vidlink.pro/tv/${id}/${season}/${episode}`;
        } else {
            url = `https://vidlink.pro/movie/${id}`;
        }

        return [{
            stream: { id: `vidlink-${id}`, serverName: 'VidLink', url, type: 'iframe' },
            providerInfo: { id: 'vidlink', name: 'VidLink', priority: 1 }
        }];
    }
}

class VidSrcProvider {
    async getStreams(id, type, season = 1, episode = 1) {
        const url = type === 'movie'
            ? `https://vidsrc.sbs/embed/movie/${id}`
            : `https://vidsrc.sbs/embed/tv/${id}/${season}/${episode}`;

        return [{
            stream: { id: `vidsrc-${id}`, serverName: 'VidSrc', url, type: 'iframe' },
            providerInfo: { id: 'vidsrc', name: 'VidSrc', priority: 2 }
        }];
    }
}

class AutoEmbedProvider {
    async getStreams(id, type, season = 1, episode = 1) {
        const url = type === 'movie'
            ? `https://player.autoembed.cc/embed/movie/${id}`
            : `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}`;

        return [{
            stream: { id: `autoembed-${id}`, serverName: 'AutoEmbed', url, type: 'iframe' },
            providerInfo: { id: 'autoembed', name: 'AutoEmbed', priority: 3 }
        }];
    }
}

class TwoEmbedProvider {
    async getStreams(id, type, season = 1, episode = 1) {
        const url = type === 'movie'
            ? `https://www.2embed.cc/embed/${id}`
            : `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`;

        return [{
            stream: { id: `2embed-${id}`, serverName: '2Embed', url, type: 'iframe' },
            providerInfo: { id: '2embed', name: '2Embed', priority: 4 }
        }];
    }
}

class SuperEmbedProvider {
    async getStreams(id, type, season = 1, episode = 1) {
        const url = type === 'movie'
            ? `https://multiembed.mov/?video_id=${id}&tmdb=1`
            : `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`;

        return [{
            stream: { id: `superembed-${id}`, serverName: 'SuperEmbed', url, type: 'iframe' },
            providerInfo: { id: 'superembed', name: 'SuperEmbed', priority: 5 }
        }];
    }
}

class SuperEmbedVIPProvider {
    async getStreams(id, type, season = 1, episode = 1) {
        const url = type === 'movie'
            ? `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`
            : `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${season}&e=${episode}`;

        return [{
            stream: { id: `superembed-vip-${id}`, serverName: 'SuperEmbed VIP', url, type: 'iframe' },
            providerInfo: { id: 'superembed-vip', name: 'SuperEmbed VIP', priority: 6 }
        }];
    }
}

class NontonGoProvider {
    async getStreams(id, type, season = 1, episode = 1) {
        const url = type === 'movie'
            ? `https://www.nontongo.win/embed/movie/${id}`
            : `https://www.nontongo.win/embed/tv/${id}/${season}/${episode}`;

        return [{
            stream: { id: `nontongo-${id}`, serverName: 'NontonGo', url, type: 'iframe' },
            providerInfo: { id: 'nontongo', name: 'NontonGo', priority: 7 }
        }];
    }
}

module.exports = {
    demo: VidLinkProvider, // Maps demo requests to VidLink
    vidlink: VidLinkProvider,
    vidsrc: VidSrcProvider,
    autoembed: AutoEmbedProvider,
    '2embed': TwoEmbedProvider,
    superembed: SuperEmbedProvider,
    'superembed-vip': SuperEmbedVIPProvider,
    nontongo: NontonGoProvider
};
