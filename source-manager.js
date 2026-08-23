const providerManager = require('./provider-manager');
const streamManager = require('./stream-manager');

class SourceManager {
    async getSources(id, type, s = null, e = null) {
        const rawStreams = await providerManager.fetchAllStreams(
            id,
            type,
            s,
            e
        );

        return streamManager.process(rawStreams);
    }
}

module.exports = new SourceManager();
