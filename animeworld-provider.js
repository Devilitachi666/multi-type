const ProviderService = require('./providers');
const Stream = require('./stream');

class AnimeWorldProvider extends ProviderService {
    constructor(config = {}) {
        super({
            id: 'animeworld',
            name: 'AnimeWorld Hindi',
            priority: 1,
            ...config
        });

        this.baseUrl = process.env.ANIMEWORLD_API_BASE;
    }

    async request(endpoint, params = {}) {
        if (!this.baseUrl) {
            throw new Error(
                'ANIMEWORLD_API_BASE environment variable is not configured'
            );
        }

        const base = this.baseUrl.replace(/\/$/, '');

        const url = new URL(
            `${base}/${endpoint.replace(/^\//, '')}`
        );

        for (const [key, value] of Object.entries(params)) {
            if (
                value !== undefined &&
                value !== null &&
                value !== ''
            ) {
                url.searchParams.set(key, String(value));
            }
        }

        const response = await fetch(url.toString());

        if (!response.ok) {
            throw new Error(
                `AnimeWorld API returned ${response.status}`
            );
        }

        return response.json();
    }

    /**
     * Get anime playback streams.
     *
     * id = AnimeWorld episode/movie ID
     */
    async getStreams(
        id,
        type,
        s = null,
        e = null,
        options = {}
    ) {

        if (String(type).toLowerCase() !== 'anime') {
            return [];
        }

        let data;

        /*
         * Anime episode
         *
         * The frontend should send:
         *
         * id = episodeId
         * type = anime
         */
        if (options.contentType === 'episode' || (s && e)) {

            data = await this.request('stream.php', {
                episodeId: id
            });

        } else {

            /*
             * Anime movie
             *
             * id = movieId
             */
            data = await this.request('stream.php', {
                movieId: id
            });
        }

        const streamUrl =
            data?.stream?.streamLink ||
            data?.stream?.url ||
            data?.streamLink ||
            data?.url;

        if (!streamUrl) {
            return [];
        }

        return [
            new Stream({
                id: `animeworld-${id}`,

                provider: this.id,

                name: 'AnimeWorld Hindi',

                url: streamUrl,

                /*
                 * Change this only if the API response
                 * explicitly gives you an HLS URL.
                 */
                type: 'iframe',

                quality: 'Auto',

                languages: ['Hindi'],

                priority: this.priority
            })
        ];
    }
}

module.exports = AnimeWorldProvider;
