const providerManager = require('./provider-manager');
const StreamManager = require('../streams/stream-manager');

class SourceManager {
    async getSources(id, type, s = null, e = null) {
        if (!id) {
            throw new Error('Missing media ID');
        }

        if (!type) {
            throw new Error('Missing media type');
        }

        if (type !== 'movie' && type !== 'tv') {
            throw new Error('Invalid media type');
        }

        const providerResults =
            await providerManager.fetchAllStreams(
                id,
                type,
                s,
                e
            );

        return StreamManager.process(providerResults);
    }
}

module.exports = new SourceManager();
