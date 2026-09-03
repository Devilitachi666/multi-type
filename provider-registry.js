/**
 * MaroonFlix Provider Implementations
 *
 * All providers return the same standardized iframe structure.
 * TMDB ID is used for movie/TV providers.
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
            stream: {
                id: `vidlink-${id}`,
                serverName: 'VidLink',
                url,
                type: 'iframe'
            },
            providerInfo: {
                id: 'vidlink',
                name: 'VidLink',
                priority: 1
            }
        }];
    }
}


class VidSrcProvider {
    async getStreams(id, type, season = 1, episode = 1) {
        const url = type === 'movie'
            ? `https://vidsrc.sbs/embed/movie/${id}`
            : `https://vidsrc.sbs/embed/tv/${id}/${season}/${episode}`;

        return [{
            stream: {
                id: `vidsrc-${id}`,
                serverName: 'VidSrc',
                url,
                type: 'iframe'
            },
            providerInfo: {
                id: 'vidsrc',
                name: 'VidSrc',
                priority: 2
            }
        }];
    }
}


class AutoEmbedProvider {
    async getStreams(id, type, season = 1, episode = 1) {
        const url = type === 'movie'
            ? `https://player.autoembed.cc/embed/movie/${id}`
            : `https://player.autoembed.cc/embed/tv/${id}/${season}/${episode}`;

        return [{
            stream: {
                id: `autoembed-${id}`,
                serverName: 'AutoEmbed',
                url,
                type: 'iframe'
            },
            providerInfo: {
                id: 'autoembed',
                name: 'AutoEmbed',
                priority: 3
            }
        }];
    }
}


class TwoEmbedProvider {
    async getStreams(id, type, season = 1, episode = 1) {
        const url = type === 'movie'
            ? `https://www.2embed.cc/embed/${id}`
            : `https://www.2embed.cc/embedtv/${id}&s=${season}&e=${episode}`;

        return [{
            stream: {
                id: `2embed-${id}`,
                serverName: '2Embed',
                url,
                type: 'iframe'
            },
            providerInfo: {
                id: '2embed',
                name: '2Embed',
                priority: 4
            }
        }];
    }
}


/*
 * SuperEmbed
 *
 * Kept as a normal iframe provider for now.
 * If the provider blocks third-party framing, the browser will
 * enforce that restriction.
 */
class SuperEmbedProvider {
    async getStreams(id, type, season = 1, episode = 1) {
        const url = type === 'movie'
            ? `https://multiembed.mov/?video_id=${id}&tmdb=1`
            : `https://multiembed.mov/?video_id=${id}&tmdb=1&s=${season}&e=${episode}`;

        return [{
            stream: {
                id: `superembed-${id}`,
                serverName: 'SuperEmbed',
                url,
                type: 'iframe'
            },
            providerInfo: {
                id: 'superembed',
                name: 'SuperEmbed',
                priority: 5
            }
        }];
    }
}


class SuperEmbedVIPProvider {
    async getStreams(id, type, season = 1, episode = 1) {
        const url = type === 'movie'
            ? `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1`
            : `https://multiembed.mov/directstream.php?video_id=${id}&tmdb=1&s=${season}&e=${episode}`;

        return [{
            stream: {
                id: `superembed-vip-${id}`,
                serverName: 'SuperEmbed VIP',
                url,
                type: 'iframe'
            },
            providerInfo: {
                id: 'superembed-vip',
                name: 'SuperEmbed VIP',
                priority: 6
            }
        }];
    }
}


class NontonGoProvider {
    async getStreams(id, type, season = 1, episode = 1) {
        const url = type === 'movie'
            ? `https://www.nontongo.win/embed/movie/${id}`
            : `https://www.nontongo.win/embed/tv/${id}/${season}/${episode}`;

        return [{
            stream: {
                id: `nontongo-${id}`,
                serverName: 'NontonGo',
                url,
                type: 'iframe'
            },
            providerInfo: {
                id: 'nontongo',
                name: 'NontonGo',
                priority: 7
            }
        }];
    }
}


/* ============================================================
 * NEW PROVIDERS
 * ========================================================= */


/**
 * ScreenScape
 *
 * Movie:
 * https://nxsha.screenscape.me/embed?tmdb=10195&type=movie
 *
 * TV:
 * https://nxsha.screenscape.me/embed?tmdb=1396&type=tv&s=1&e=1
 */
class ScreenScapeProvider {
    async getStreams(id, type, season = 1, episode = 1) {
        let url;

        if (type === 'movie') {
            url = `https://nxsha.screenscape.me/embed?tmdb=${id}&type=movie`;
        } else if (type === 'tv') {
            url = `https://nxsha.screenscape.me/embed?tmdb=${id}&type=tv&s=${season}&e=${episode}`;
        } else {
            return [];
        }

        return [{
            stream: {
                id: `screenscape-${id}`,
                serverName: 'ScreenScape',
                url,
                type: 'iframe'
            },
            providerInfo: {
                id: 'screenscape',
                name: 'ScreenScape',
                priority: 8
            }
        }];
    }
}


/**
 * VidZee V1
 */
class VidZeeProvider {
    async getStreams(id, type, season = 1, episode = 1) {
        let url;

        if (type === 'movie') {
            url = `https://player.vidzee.wtf/embed/movie/${id}`;
        } else if (type === 'tv') {
            url = `https://player.vidzee.wtf/embed/tv/${id}/${season}/${episode}`;
        } else {
            return [];
        }

        return [{
            stream: {
                id: `vidzee-${id}`,
                serverName: 'VidZee',
                url,
                type: 'iframe'
            },
            providerInfo: {
                id: 'vidzee',
                name: 'VidZee',
                priority: 9
            }
        }];
    }
}


/**
 * VidZee V2
 */
class VidZeeV2Provider {
    async getStreams(id, type, season = 1, episode = 1) {
        let url;

        if (type === 'movie') {
            url = `https://player.vidzee.wtf/v2/embed/movie/${id}`;
        } else if (type === 'tv') {
            url = `https://player.vidzee.wtf/v2/embed/tv/${id}/${season}/${episode}`;
        } else {
            return [];
        }

        return [{
            stream: {
                id: `vidzee-v2-${id}`,
                serverName: 'VidZee V2',
                url,
                type: 'iframe'
            },
            providerInfo: {
                id: 'vidzee-v2',
                name: 'VidZee V2',
                priority: 10
            }
        }];
    }
}


/**
 * VidCore
 */
class VidCoreProvider {
    async getStreams(id, type, season = 1, episode = 1) {
        let url;

        if (type === 'movie') {
            url = `https://vidcore.org/embed/movie/${id}`;
        } else if (type === 'tv') {
            url = `https://vidcore.org/embed/tv/${id}/${season}/${episode}`;
        } else {
            return [];
        }

        return [{
            stream: {
                id: `vidcore-${id}`,
                serverName: 'VidCore',
                url,
                type: 'iframe'
            },
            providerInfo: {
                id: 'vidcore',
                name: 'VidCore',
                priority: 11
            }
        }];
    }
}


/**
 * CinemaOS
 */
class CinemaOSProvider {
    async getStreams(id, type, season = 1, episode = 1) {
        let url;

        if (type === 'movie') {
            url = `https://cinemaos.tech/player/${id}`;
        } else if (type === 'tv') {
            url = `https://cinemaos.tech/player/${id}/${season}/${episode}`;
        } else {
            return [];
        }

        return [{
            stream: {
                id: `cinemaos-${id}`,
                serverName: 'CinemaOS',
                url,
                type: 'iframe'
            },
            providerInfo: {
                id: 'cinemaos',
                name: 'CinemaOS',
                priority: 12
            }
        }];
    }
}


/**
 * VidNest
 *
 * Movie:
 * /movie/{TMDB_ID}
 *
 * TV:
 * /tv/{TMDB_ID}/{SEASON}/{EPISODE}
 *
 * Anime endpoint intentionally not implemented here because
 * it requires an AniList ID rather than the TMDB ID currently
 * passed by ProviderManager.
 */
class VidNestProvider {
    async getStreams(id, type, season = 1, episode = 1) {
        let url;

        if (type === 'movie') {
            url = `https://vidnest.fun/movie/${id}`;
        } else if (type === 'tv') {
            url = `https://vidnest.fun/tv/${id}/${season}/${episode}`;
        } else {
            return [];
        }

        return [{
            stream: {
                id: `vidnest-${id}`,
                serverName: 'VidNest',
                url,
                type: 'iframe'
            },
            providerInfo: {
                id: 'vidnest',
                name: 'VidNest',
                priority: 13
            }
        }];
    }
}


/**
 * Videasy
 */
class VideasyProvider {
    async getStreams(id, type, season = 1, episode = 1) {
        let url;

        if (type === 'movie') {
            url = `https://player.videasy.to/movie/${id}`;
        } else if (type === 'tv') {
            url = `https://player.videasy.to/tv/${id}/${season}/${episode}`;
        } else {
            return [];
        }

        return [{
            stream: {
                id: `videasy-${id}`,
                serverName: 'Videasy',
                url,
                type: 'iframe'
            },
            providerInfo: {
                id: 'videasy',
                name: 'Videasy',
                priority: 14
            }
        }];
    }
}


/**
 * Nxsha
 *
 * Movie:
 * /embed/movie/{TMDB_ID}
 *
 * TV:
 * /embed/tv/{TMDB_ID}/{SEASON}/{EPISODE}
 */
class NxshaProvider {
    async getStreams(id, type, season = 1, episode = 1) {
        let url;

        if (type === 'movie') {
            url = `https://nxsha.space/embed/movie/${id}`;
        } else if (type === 'tv') {
            url = `https://nxsha.space/embed/tv/${id}/${season}/${episode}`;
        } else {
            return [];
        }

        return [{
            stream: {
                id: `nxsha-${id}`,
                serverName: 'Nxsha',
                url,
                type: 'iframe'
            },
            providerInfo: {
                id: 'nxsha',
                name: 'Nxsha',
                priority: 15
            }
        }];
    }
}


/**
 * AnimeWorld Hindi
 *
 * Uses AnimeWorld's own episode/movie IDs.
 * This provider is intentionally limited to type="anime".
 */
class AnimeWorldProvider {
    constructor() {
        this.id = 'animeworld';
        this.name = 'AnimeWorld Hindi';
        this.priority = 1;
        this.baseUrl = process.env.ANIMEWORLD_API_BASE;
    }

    async getStreams(id, type, season = null, episode = null, options = {}) {
        if (type !== 'anime') {
            return [];
        }

        if (!this.baseUrl) {
            throw new Error(
                'ANIMEWORLD_API_BASE environment variable is missing'
            );
        }

        const baseUrl = this.baseUrl.replace(/\/$/, '');

        /*
         * For AnimeWorld content, `id` must be the actual
         * AnimeWorld episode ID or movie ID.
         *
         * options.contentType:
         *   "episode" -> episodeId
         *   "movie"   -> movieId
         */
        const contentType = options.contentType || 'episode';

        const url = new URL(`${baseUrl}/stream.php`);

        if (contentType === 'movie') {
            url.searchParams.set('movieId', String(id));
        } else {
            url.searchParams.set('episodeId', String(id));
        }

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(
                `AnimeWorld API returned HTTP ${response.status}`
            );
        }

        const data = await response.json();

        const streamUrl =
            data?.stream?.streamLink ||
            data?.stream?.url ||
            data?.streamLink ||
            data?.url ||
            null;

        if (!streamUrl) {
            return [];
        }

        return [{
            stream: {
                id: `animeworld-${id}`,
                serverName: 'AnimeWorld Hindi',
                url: streamUrl,

                /*
                 * If AnimeWorld returns a direct .m3u8 URL,
                 * your frontend may need to support "hls".
                 *
                 * Otherwise keep iframe if the URL is an embed page.
                 */
                type: streamUrl.includes('.m3u8')
                    ? 'hls'
                    : 'iframe',

                languages: ['Hindi']
            },

            providerInfo: {
                id: 'animeworld',
                name: 'AnimeWorld Hindi',
                priority: 1
            }
        }];
    }
}


/* ============================================================
 * EXPORT PROVIDERS
 * ============================================================ */

module.exports = {
    demo: VidLinkProvider,

    // Existing
    vidlink: VidLinkProvider,
    vidsrc: VidSrcProvider,
    autoembed: AutoEmbedProvider,
    '2embed': TwoEmbedProvider,
    superembed: SuperEmbedProvider,
    'superembed-vip': SuperEmbedVIPProvider,
    nontongo: NontonGoProvider,

     // Anime
    animeworld: AnimeWorldProvider,


    // New
    screenscape: ScreenScapeProvider,
    vidzee: VidZeeProvider,
    'vidzee-v2': VidZeeV2Provider,
    vidcore: VidCoreProvider,
    cinemaos: CinemaOSProvider,
    vidnest: VidNestProvider,
    videasy: VideasyProvider,
    nxsha: NxshaProvider
};
