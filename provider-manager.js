const serverConfig = require('./server-config');
const ProviderFactory = require('./provider-factory');

class ProviderManager {
    constructor() {
        this.providers = (serverConfig.providers || [])
            .filter(provider => provider.enabled)
            .sort((a, b) => a.priority - b.priority);
    }

    async fetchAllStreams(id, type, s = null, e = null) {
        const streamPromises = this.providers.map(async (provider) => {
            try {
                const instance = ProviderFactory.getProvider(
                    provider.id,
                    provider.config
                );

                if (!instance) {
                    return [];
                }

                return await instance.getStreams(
                    id,
                    type,
                    s,
                    e
                );

            } catch (error) {
                console.error(
                    `Provider ${provider.id} failed:`,
                    error
                );

                return [];
            }
        });

        const results = await Promise.all(streamPromises);

        return results.flat();
    }
}

module.exports = new ProviderManager();
