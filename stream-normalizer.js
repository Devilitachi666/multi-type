const Stream = require('./stream');

class StreamNormalizer {
    /**
     * Normalizes raw stream inputs into a standardized Stream object for iFrame consumption
     * 
     * @param {Object} rawStream - Stream object returned by provider
     * @param {Object} providerInfo - Provider metadata (id, name, priority)
     * @returns {Stream|null} Normalized Stream object or null
     */
    static normalize(rawStream, providerInfo = {}) {
        if (!rawStream || !rawStream.url) {
            return null;
        }

        const providerId =
            providerInfo.id ||
            rawStream.providerId ||
            rawStream.provider ||
            'unknown';

        const providerName =
            providerInfo.name ||
            rawStream.serverName ||
            rawStream.name ||
            rawStream.provider ||
            providerId;

        const priority =
            rawStream.priority ??
            providerInfo.priority ??
            10;

        return new Stream({
            id:
                rawStream.id ||
                `${providerId}-${Date.now()}-${Math.random()
                    .toString(36)
                    .slice(2, 8)}`,

            provider: providerId,

            name: providerName,

            url: rawStream.url,

            type: rawStream.type || 'iframe',

            quality: rawStream.quality || 'Auto',

            qualities: Array.isArray(rawStream.qualities)
                ? rawStream.qualities
                : [],

            languages: Array.isArray(rawStream.languages)
                ? rawStream.languages
                : [],

            audioTracks: Array.isArray(rawStream.audioTracks)
                ? rawStream.audioTracks
                : [],

            subtitles: Array.isArray(rawStream.subtitles)
                ? rawStream.subtitles
                : [],

            headers: rawStream.headers || {},

            priority
        });
    }
}

module.exports = StreamNormalizer;
