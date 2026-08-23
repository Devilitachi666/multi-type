class Stream {
    constructor({
        id,
        provider,
        name,
        url,
        type,
        quality = 'Unknown',
        qualities = [],
        languages = [],
        audioTracks = [],
        subtitles = [],
        headers = {},
        priority = 10
    }) {
        this.id = id;
        this.provider = provider;
        this.name = name;
        this.url = url;
        this.type = type;
        this.quality = quality;
        this.qualities = qualities;
        this.languages = languages;
        this.audioTracks = audioTracks;
        this.subtitles = subtitles;
        this.headers = headers;
        this.priority = priority;
    }
}

module.exports = Stream;
