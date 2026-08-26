const serverConfig = require('./server-config');
const ProviderFactory = require('./provider-factory');

class ProviderManager {
    constructor() {
        this.providers = (serverConfig.providers || [])
            .filter(provider => provider.enabled)
            .sort((a, b) => a.priority - b.priority);
    }

    async fetchAllStreams(id, type, s = null, e = null) {

    console.log('SOURCE DEBUG: providers =', this.providers);

    const streamPromises = this.providers.map(async (provider) => {

        try {

            console.log(
                'SOURCE DEBUG: calling provider =',
                provider.id
            );

            const instance =
                ProviderFactory.getProvider(
                    provider.id,
                    provider.config
                );

            console.log(
                'SOURCE DEBUG: provider instance =',
                instance
            );

            if (!instance) {
                console.log(
                    'SOURCE DEBUG: NO PROVIDER INSTANCE'
                );

                return [];
            }

            const streams =
                await instance.getStreams(
                    id,
                    type,
                    s,
                    e
                );

            console.log(
                'SOURCE DEBUG: provider streams =',
                streams
            );

            return streams;

        } catch (error) {

            console.error(
                'SOURCE DEBUG: provider failed =',
                provider.id,
                error
            );

            return [];
        }
    });

    const results =
        await Promise.all(
            streamPromises
        );

    console.log(
        'SOURCE DEBUG: provider results =',
        results
    );

    const flattened =
        results.flat();

    console.log(
        'SOURCE DEBUG: flattened =',
        flattened
    );

    return flattened;
}

module.exports = new ProviderManager();
