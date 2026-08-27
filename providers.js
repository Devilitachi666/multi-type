class ProviderService {
  constructor(config = {}) {
    this.config = config;
    this.name = config.name || 'BaseProvider';
    this.id = config.id || 'base';
    this.priority = config.priority || 99;
  }

  /**
   * Abstract method that all providers must implement
   * 
   * @param {string} id - TMDB ID, IMDb ID, or MAL ID
   * @param {string} type - Media type ('movie', 'tv', 'anime')
   * @param {string|number|null} s - Season number
   * @param {string|number|null} e - Episode number
   * @param {Object} [options={}] - Extra options (e.g., { subOrDub: 'sub' })
   * @returns {Promise<Array>} List of stream objects
   */
  async getStreams(id, type, s = null, e = null, options = {}) {
    throw new Error(
      `getStreams() must be implemented by provider '${this.name}'`
    );
  }

  /**
   * Helper utility to quickly construct standardized iFrame response payloads
   */
  buildIframeResponse(id, embedUrl, serverName = this.name) {
    return [{
      stream: {
        id: `${this.id}-${id}`,
        serverName: serverName,
        url: embedUrl,
        type: 'iframe'
      },
      providerInfo: {
        id: this.id,
        name: this.name,
        priority: this.priority
      }
    }];
  }
}

module.exports = ProviderService;
