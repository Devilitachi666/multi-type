class ProviderService {
  constructor(config = {}) {
    this.config = config;
  }

  async getStreams(id, type, s = null, e = null) {
    throw new Error(
      'getStreams() must be implemented by the provider'
    );
  }
}

module.exports = ProviderService;
