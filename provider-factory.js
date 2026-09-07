const ProviderRegistry = require('./provider-registry');

class ProviderFactory {
    /**
     * Instantiates or resolves a provider from the ProviderRegistry
     * 
     * @param {string} providerId - Unique ID of the provider (e.g. 'vidlink', 'vidsrc-me')
     * @param {Object} [config={}] - Optional custom configuration/override parameters
     * @returns {Object|null} Ready-to-use provider instance or null if not found
     */
    static getProvider(providerId, config = {}) {
        const ProviderDefinition = ProviderRegistry[providerId];

        if (!ProviderDefinition) {
            console.warn(`[ProviderFactory] Provider '${providerId}' not found in registry.`);
            return null;
        }

        // Handle class constructor providers
        if (typeof ProviderDefinition === 'function') {
            try {
                return new ProviderDefinition(config);
            } catch (err) {
                // If it's a standard function instead of a constructor class
                return ProviderDefinition(config);
            }
        }

        // Handle object-based providers
        if (typeof ProviderDefinition === 'object') {
            return {
                ...ProviderDefinition,
                config: { ...ProviderDefinition.config, ...config }
            };
        }

        return null;
    }
}

module.exports = ProviderFactory;
