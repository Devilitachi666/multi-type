const vidsrc = require('./vidsrc');
const mmVidhide = require('./mm-vidhide');
const mmCloud = require('./mm-cloud');

const providers = [vidsrc, mmVidhide, mmCloud];

const fetchAllSources = async (type, id, s, e) => {
    const allResults = [];

    const promises = providers.map(async (provider) => {
        try {
            const result = (type === 'movie') 
                ? await provider.getMovieSource(id)
                : await provider.getTvSource(id, s, e);
            
            if (result && result.success) {
                return result;
            }
        } catch (err) { return null; }
    });

    const resolved = await Promise.all(promises);
    
    resolved.forEach(res => {
        if (res) allResults.push(res);
    });

    // Ranking Logic: Hindi > English > 1080p
    return allResults.sort((a, b) => {
        const aHasHi = a.sources.some(s => s.languages.includes('hi'));
        const bHasHi = b.sources.some(s => s.languages.includes('hi'));
        if (aHasHi && !bHasHi) return -1;
        if (!aHasHi && bHasHi) return 1;
        return 0;
    });
};

module.exports = { fetchAllSources };
