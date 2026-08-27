const sourceManager = require('../source-manager');

module.exports = async (req, res) => {
    // 1. Set CORS specifically for your Blogger domain (or fallback during local testing)
    const allowedOrigin = 'https://freemoviedekhlo.blogspot.com';
    const requestOrigin = req.headers.origin;

    if (requestOrigin === allowedOrigin || process.env.NODE_ENV !== 'production') {
        res.setHeader('Access-Control-Allow-Origin', requestOrigin || allowedOrigin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 2. Preflight request handling
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // 3. Method validation
    if (req.method !== 'GET') {
        return res.status(405).json({
            success: false,
            error: 'Method Not Allowed'
        });
    }

    // 4. Extract parameters (including optional provider string)
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

    try {
        // 5. Fetch iFrame sources via sourceManager
        const sources = await sourceManager.getSources(
            String(id),
            String(type),
            s !== null ? String(s) : null,
            e !== null ? String(e) : null,
            provider ? String(provider) : null
        );

        return res.status(200).json({
            success: true,
            sources
        });

    } catch (error) {
        console.error('Source API error:', error);

        return res.status(500).json({
            success: false,
            error: 'Unable to retrieve iframe sources'
        });
    }
};
