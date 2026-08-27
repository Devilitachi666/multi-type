const sourceManager = require('../source-manager');

module.exports = async (req, res) => {
    // 1. CORS Setup (Origin matches your Blogger frontend)
    const allowedOrigin = 'https://freemoviedekhlo.blogspot.com';
    const requestOrigin = req.headers.origin;

    // Allow your blog domain or localhost/previews if testing
    if (requestOrigin === allowedOrigin || process.env.NODE_ENV !== 'production') {
        res.setHeader('Access-Control-Allow-Origin', requestOrigin || allowedOrigin);
    } else {
        res.setHeader('Access-Control-Allow-Origin', allowedOrigin);
    }

    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Preflight check
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // Only GET method allowed
    if (req.method !== 'GET') {
        return res.status(405).json({
            error: 'Method Not Allowed'
        });
    }

    // Extract query parameters (including optional provider selection)
    const {
        id,
        type,
        s = null,
        e = null,
        provider = null
    } = req.query || {};

    if (!id || !type) {
        return res.status(400).json({
            error: 'Missing required parameters: id and type'
        });
    }

    try {
        // Retrieve iFrame embed sources from sourceManager
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
