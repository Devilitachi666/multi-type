const cineverse = require('./providers/cineverse');
const gdmirror = require('./providers/gdmirror');
const screenscape = require('./providers/screenscape');
const nxsha = require('./providers/nxsha');
const nhdapi = require('./providers/nhdapi');

const providers = [cineverse, gdmirror, screenscape, nxsha, nhdapi];

module.exports = {
    getAvailable: () => providers.filter(p => p.enabled).map(p => ({ id: p.id, name: p.name })),
    getSource: (pid, type, id, s, e) => {
        const p = providers.find(x => x.id === pid);
        if (!p) return { success: false };
        return type === 'movie' ? p.getMovie(id) : p.getTv(id, s, e);
    }
};
