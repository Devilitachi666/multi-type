const StreamNormalizer = require('./stream-normalizer');

class StreamManager {
    static process(providerResults = []) {
        if (!Array.isArray(providerResults)) {
            return [];
        }

        const normalized = [];

        for (const result of providerResults) {
            if (!result || !result.stream) {
                continue;
            }

            const stream = StreamNormalizer.normalize(
                result.stream,
                result.providerInfo || {}
            );

            if (stream) {
                normalized.push(stream);
            }
        }

        const seen = new Set();

        return normalized
            .filter(stream => {
                const key =
                    `${stream.provider}|` +
                    `${stream.type}|` +
                    `${stream.url}`;

                if (seen.has(key)) {
                    return false;
                }

                seen.add(key);
                return true;
            })
            .sort(
                (a, b) =>
                    (a.priority ?? 10) -
                    (b.priority ?? 10)
            );
    }
}

module.exports = StreamManager;
