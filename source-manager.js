const providerManager = require('./provider-manager');
const streamManager = require('./stream-manager');

class SourceManager {
    /**
     * Resolves and processes iframe stream sources from active providers
     * 
     * @param {string} id - TMDB, IMDb, or MAL ID
     * @param {string} type - Media type ('movie', 'tv', 'anime')
     * @param {string|number|null} s - Season number
     * @param {string|number|null} e - Episode number
     * @param {string|null} provider - Target provider ID (optional)
     * @returns {Promise<Array>} Normalized list of iframe stream objects
     */
    async getSources(id, type, s = null, e = null, provider = null) {
        const rawStreams = await providerManager.fetchAllStreams(
            id,
            type,
            s,
            e,
            provider
        );

        return streamManager.process(rawStreams);
    }
}

module.exports = new SourceManager();
