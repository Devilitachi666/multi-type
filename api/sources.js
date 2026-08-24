module.exports = async (req, res) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(204).end();
    }

    if (req.method !== 'GET') {
        return res.status(405).json({
            error: 'Method Not Allowed'
        });
    }

    const { id, type } = req.query || {};

    if (!id || !type) {
        return res.status(400).json({
            error: 'Missing required parameters: id and type'
        });
    }

    return res.status(200).json({
        sources: [],
        test: true,
        id: String(id),
        type: String(type),
        message: 'MaroonFlix API is working. No providers have been added yet.'
    });
};
