const axios = require('axios');
const cheerio = require('cheerio');

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
 * Hindi Anime Provider
 *
 * Resolves a TMDB anime/TV ID to the provider's anime slug, then resolves
 * the requested season/episode and exposes every discovered server using the
 * same standardized structure as the other MaroonFlix providers.
 *
 * This adapter is intentionally self-contained so MaroonFlix does not need
 * a second deployed API or HINDI_ANIME_API_BASE environment variable.
 */
class HindiAnimeProvider {
    constructor(config = {}) {
        this.config = config;
        this.baseUrl = String(
            config.baseUrl || process.env.HINDI_ANIME_BASE_URL || 'https://animesalt.me'
        ).replace(/\/$/, '');
        this.tmdbBase = 'https://api.themoviedb.org/3';
        this.timeout = Number(config.timeout || 12000);
        this.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/131 Safari/537.36',
            'Accept-Language': 'en-US,en;q=0.9'
        };
    }

    normalizeTitle(value = '') {
        return String(value)
            .toLowerCase()
            .replace(/\([^)]*\)|\[[^\]]*\]/g, ' ')
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
    }

    similarity(a, b) {
        const aa = this.normalizeTitle(a);
        const bb = this.normalizeTitle(b);
        if (!aa || !bb) return 0;
        if (aa === bb) return 1;
        if (aa.includes(bb) || bb.includes(aa)) return 0.9;
        const aTokens = new Set(aa.split(' ').filter(Boolean));
        const bTokens = new Set(bb.split(' ').filter(Boolean));
        let common = 0;
        for (const token of aTokens) if (bTokens.has(token)) common++;
        return common / Math.max(aTokens.size, bTokens.size);
    }

    async getTmdbTitles(id) {
        const token = process.env.TMDB_ACCESS_TOKEN;
        if (!token) {
            throw new Error('TMDB_ACCESS_TOKEN is required for the Hindi Anime provider');
        }

        const headers = {
            accept: 'application/json',
            Authorization: `Bearer ${token}`
        };

        // Anime entries on TMDB are normally TV records. Fall back to movie
        // so the provider still works if the frontend classifies an anime film.
        for (const path of [`/tv/${encodeURIComponent(id)}`, `/movie/${encodeURIComponent(id)}`]) {
            try {
                const { data } = await axios.get(`${this.tmdbBase}${path}`, {
                    headers,
                    timeout: this.timeout
                });
                const titles = [data.name, data.original_name, data.title, data.original_title]
                    .filter(Boolean);
                if (Array.isArray(data.alternative_titles?.results)) {
                    for (const item of data.alternative_titles.results) {
                        if (item?.title) titles.push(item.title);
                    }
                }
                return [...new Set(titles)];
            } catch (_) {
                // Try the next TMDB media type.
            }
        }

        throw new Error(`TMDB title lookup failed for ID ${id}`);
    }

    async findAnimeSlug(titles) {
        let best = null;

        for (const title of titles) {
            try {
                const { data } = await axios.get(`${this.baseUrl}/`, {
                    params: { s: title },
                    headers: this.headers,
                    timeout: this.timeout
                });

                const $ = cheerio.load(data);
                $('#aa-movies li.series').each((_, el) => {
                    const candidateTitle = $(el).find('h2.entry-title').text().trim();
                    const href = $(el).find('a.lnk-blk').attr('href');
                    if (!candidateTitle || !href) return;

                    let slug = href
                        .replace(/^https?:\/\/[^/]+\/series\//i, '')
                        .replace(/^\/series\//i, '')
                        .replace(/\/$/, '');
                    if (!slug) return;

                    const score = this.similarity(title, candidateTitle);
                    if (!best || score > best.score) {
                        best = { slug, title: candidateTitle, score };
                    }
                });

                if (best?.score === 1) break;
            } catch (_) {
                // Continue with alternate titles.
            }
        }

        // Avoid silently selecting an unrelated search result.
        return best && best.score >= 0.55 ? best : null;
    }

    async getEpisodeServers(slug, season, episode) {
        const episodeUrl = `${this.baseUrl}/episode/${encodeURIComponent(slug)}-${season}x${episode}`;
        const { data } = await axios.get(episodeUrl, {
            headers: this.headers,
            timeout: this.timeout
        });

        const $ = cheerio.load(data);
        const serverPages = [];

        $('#aa-options > div.video').each((index, el) => {
            let link = $(el).find('iframe').attr('src') || $(el).find('iframe').attr('data-src');
            if (!link) return;
            link = String(link).replace(/&#038;/g, '&');
            try {
                link = new URL(link, this.baseUrl).toString();
            } catch (_) {
                return;
            }
            serverPages.push({
                name: $(el).attr('id') || `Server ${index + 1}`,
                link
            });
        });

        const resolved = await Promise.all(serverPages.map(async (server, index) => {
            try {
                const { data: innerHTML } = await axios.get(server.link, {
                    headers: this.headers,
                    timeout: this.timeout
                });
                const $$ = cheerio.load(innerHTML);
                let embed = $$('iframe').first().attr('src') || $$('iframe').first().attr('data-src') || $$('video source').first().attr('src');
                if (!embed) return null;
                embed = String(embed).replace(/&#038;/g, '&');
                embed = new URL(embed, server.link).toString();
                return {
                    stream: {
                        id: `hindi-anime-${slug}-${season}-${episode}-${index + 1}`,
                        serverName: `Hindi Anime - ${server.name}`,
                        url: embed,
                        type: 'iframe'
                    },
                    providerInfo: {
                        id: 'hindi-anime',
                        name: 'Hindi Anime',
                        priority: 16
                    }
                };
            } catch (_) {
                return null;
            }
        }));

        return resolved.filter(Boolean);
    }

    async getStreams(id, type, season = 1, episode = 1) {
        if (String(type).toLowerCase() !== 'anime') return [];
        if (!id || !season || !episode) return [];

        const titles = await this.getTmdbTitles(String(id));
        const match = await this.findAnimeSlug(titles);
        if (!match) return [];

        return this.getEpisodeServers(match.slug, String(season), String(episode));
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

    // New
    screenscape: ScreenScapeProvider,
    vidzee: VidZeeProvider,
    'vidzee-v2': VidZeeV2Provider,
    vidcore: VidCoreProvider,
    cinemaos: CinemaOSProvider,
    vidnest: VidNestProvider,
    videasy: VideasyProvider,
    nxsha: NxshaProvider,
    'hindi-anime': HindiAnimeProvider
};
