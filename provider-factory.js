const ProviderRegistry = require('./provider-registry');

class ProviderFactory {

    static getProvider(providerId, config = {}) {

        const ProviderClass =
            ProviderRegistry[providerId];

        if (!ProviderClass) {
            return null;
        }

        return ProviderClass;
    }
}

module.exports = ProviderFactory;
