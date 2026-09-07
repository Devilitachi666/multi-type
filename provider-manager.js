const serverConfig = require('./server-config');
const ProviderFactory = require('./provider-factory');

class ProviderManager {
    constructor() {
        this.providers = (serverConfig.providers || [])
            .filter(provider => provider.enabled)
            .sort((a, b) => a.priority - b.priority);
    }

    /**
     * Fetches iframe stream sources from active providers
     * 
     * @param {string} id - TMDB or IMDb ID
     * @param {string} type - 'movie' or 'tv'
     * @param {string|number|null} s - Season number
     * @param {string|number|null} e - Episode number
     * @param {string|null} targetProviderId - Optional provider filter
     * @returns {Promise<Array>} List of resolved iframe stream objects
     */
    async fetchAllStreams(id, type, s = null, e = null, targetProviderId = null) {
        // Filter by target provider if requested, otherwise use all enabled providers
        const activeProviders = targetProviderId
            ? this.providers.filter(p => p.id === targetProviderId)
            : this.providers;

        const streamPromises = activeProviders.map(async (provider) => {
            try {
                const instance = ProviderFactory.getProvider(
                    provider.id,
                    provider.config
                );

                if (!instance) {
                    console.warn(`[ProviderManager] Unable to instantiate: ${provider.id}`);
                    return [];
                }

                let result = null;

                // 1. Call standard class instance method (getStreams / getEmbed / getStreamUrl)
                if (typeof instance.getStreams === 'function') {
                    result = await instance.getStreams(id, type, s, e);
                } else if (typeof instance.getEmbed === 'function') {
                    result = await instance.getEmbed(id, type, s, e);
                } else if (typeof instance.getStreamUrl === 'function') {
                    result = await instance.getStreamUrl(id, type, s, e);
                } 
                // 2. Fallback for functional configuration objects with builder functions
                else if (instance.config) {
                    const embedUrl = type === 'movie'
                        ? (typeof instance.config.movie === 'function' ? instance.config.movie(id) : null)
                        : (typeof instance.config.tv === 'function' ? instance.config.tv(id, s || 1, e || 1) : null);

                    if (embedUrl) {
                        result = {
                            providerId: provider.id,
                            name: provider.name || provider.id,
                            priority: provider.priority,
                            streamType: 'iframe',
                            url: embedUrl
                        };
                    }
                }

                if (!result) return [];

                // Standardize output format into array
                const normalized = Array.isArray(result) ? result : [result];

                return normalized.map(item => {
                    if (typeof item === 'string') {
                        return {
                            providerId: provider.id,
                            name: provider.name || provider.id,
                            priority: provider.priority,
                            streamType: 'iframe',
                            url: item
                        };
                    }
                    return {
                        providerId: provider.id,
                        name: provider.name || provider.id,
                        priority: provider.priority,
                        streamType: 'iframe',
                        ...item
                    };
                });

            } catch (error) {
                console.error(`[ProviderManager] Failed fetching from ${provider.id}:`, error.message);
                return [];
            }
        });

        const results = await Promise.all(streamPromises);
        return results.flat();
    }
}

module.exports = new ProviderManager();
