const serverConfig = require('../config/server-config');
const ProviderFactory = require('./provider-factory');

class ProviderManager {
    constructor() {
        this.providers = this.loadProviders();
    }

    loadProviders() {
        return (serverConfig.providers || [])
            .filter(provider => provider && provider.enabled !== false)
            .sort(
                (a, b) =>
                    (a.priority ?? 10) - (b.priority ?? 10)
            );
    }

    async fetchAllStreams(id, type, s = null, e = null) {
        const results = await Promise.all(
            this.providers.map(async providerInfo => {
                try {
                    const provider = ProviderFactory.getProvider(
                        providerInfo.id,
                        providerInfo.config || {}
                    );

                    if (!provider) {
                        console.warn(
                            `Provider "${providerInfo.id}" is not registered`
                        );

                        return [];
                    }

                    const streams = await provider.getStreams(
                        id,
                        type,
                        s,
                        e
                    );

                    if (!Array.isArray(streams)) {
                        return [];
                    }

                    return streams.map(stream => ({
                        stream,
                        providerInfo
                    }));
                } catch (error) {
                    console.error(
                        `Provider "${providerInfo.id}" failed:`,
                        error.message
                    );

                    return [];
                }
            })
        );

        return results.flat();
    }
}

module.exports = new ProviderManager();
