```js
const sourceManager = require('../source-manager');

module.exports = async (req, res) => {
    // ---------------------------------------------------------
    // CORS
    // ---------------------------------------------------------
    const allowedOrigin = 'https://freemoviedekhlo.blogspot.com';
    const requestOrigin = req.headers.origin;

    if (requestOrigin === allowedOrigin) {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type'
    );

    // Allow browser/proxy caching to vary by Origin
    res.setHeader('Vary', 'Origin');

    // ---------------------------------------------------------
    // OPTIONS / PREFLIGHT
    // ---------------------------------------------------------
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // ---------------------------------------------------------
    // GET ONLY
    // ---------------------------------------------------------
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method Not Allowed'
        });
    }

    // ---------------------------------------------------------
    // QUERY PARAMETERS
    // ---------------------------------------------------------
    const {
        id,
        type,
        s = null,
        e = null,
        provider = null
    } = req.query || {};

    if (!id || !type) {
        return res.status(400).json({
            success: false,
            error: 'Missing required parameters: id and type'
        });
    }

    // ---------------------------------------------------------
    // VALID MEDIA TYPES
    // ---------------------------------------------------------
    const mediaType = String(type).toLowerCase();

    if (!['movie', 'tv', 'anime'].includes(mediaType)) {
        return res.status(400).json({
            success: false,
            error: 'Invalid type. Use movie, tv, or anime.'
        });
    }

    try {
        console.log(
            `[Sources API] id=${id} type=${mediaType} s=${s} e=${e} provider=${provider || 'all'}`
        );

        const sources = await sourceManager.getSources(
            String(id),
            mediaType,
            s !== null ? String(s) : null,
            e !== null ? String(e) : null,
            provider ? String(provider) : null
        );

        return res.status(200).json({
            success: true,
            sources
        });

    } catch (error) {
        console.error('[Sources API] Error:', error);

        return res.status(500).json({
            success: false,
            error: 'Unable to retrieve iframe sources'
        });
    }
};
```
