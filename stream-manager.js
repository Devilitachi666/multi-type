const StreamNormalizer = require('./stream-normalizer');

class StreamManager {
    /**
     * Processes, normalizes, deduplicates, and sorts raw provider results
     * 
     * @param {Array} providerResults - Raw results returned by ProviderManager
     * @returns {Array} Clean array of normalized iframe stream objects
     */
    static process(providerResults = []) {
        if (!Array.isArray(providerResults)) {
            return [];
        }

        const normalized = [];

        for (const result of providerResults) {
            if (!result) continue;

            // Handle nested payload format: { stream: {...}, providerInfo: {...} }
            if (result.stream) {
                const stream = StreamNormalizer.normalize(
                    result.stream,
                    result.providerInfo || {}
                );
                if (stream) normalized.push(stream);
            } 
            // Handle flat payload format: { url: "...", providerId: "...", ... }
            else if (result.url) {
                const stream = StreamNormalizer.normalize(
                    result,
                    {
                        id: result.providerId || result.provider || 'unknown',
                        name: result.name || result.providerName || result.providerId || 'Unknown Server',
                        priority: result.priority ?? 10
                    }
                );
                if (stream) normalized.push(stream);
            }
        }

        const seenUrls = new Set();

        return normalized
            .filter(stream => {
                // Deduplicate strictly by embed URL
                if (seenUrls.has(stream.url)) {
                    return false;
                }
                seenUrls.add(stream.url);
                return true;
            })
            .sort((a, b) => (a.priority ?? 10) - (b.priority ?? 10));
    }
}

module.exports = StreamManager;
