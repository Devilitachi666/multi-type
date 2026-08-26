const sourceManager = require('../source-manager');

module.exports = async (req, res) => {

    // CORS
    res.setHeader(
        'Access-Control-Allow-Origin',
        'https://freemoviedekhlo.blogspot.com'
    );

    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, OPTIONS'
    );

    res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type'
    );

    // Preflight
    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    // Only GET
    if (req.method !== 'GET') {
        return res.status(405).json({
            error: 'Method Not Allowed'
        });
    }

    const {
        id,
        type,
        s = null,
        e = null
    } = req.query || {};

    if (!id || !type) {
        return res.status(400).json({
            error: 'Missing required parameters: id and type'
        });
    }

    try {

        const sources =
            await sourceManager.getSources(
                String(id),
                String(type),
                s !== null
                    ? String(s)
                    : null,
                e !== null
                    ? String(e)
                    : null
            );

        return res.status(200).json({
            sources
        });

    } catch (error) {

        console.error(
            'Source API error:',
            error
        );

        return res.status(500).json({
            error: 'Unable to retrieve sources'
        });

    }

};
