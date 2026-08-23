const ProviderRegistry = require('./provider-registry');

class ProviderFactory {
    static getProvider(providerId, config = {}) {
        const ProviderClass = ProviderRegistry[providerId];

        if (!ProviderClass) {
            return null;
        }

        return new ProviderClass(config);
    }
}

module.exports = ProviderFactory;
