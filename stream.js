class Stream {
    constructor({
        id,
        provider,
        name,
        url,
        type = 'iframe',
        quality = 'Auto',
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

    /**
     * Custom JSON output to prevent bloated responses when using standard iFrame embeds
     */
    toJSON() {
        const payload = {
            id: this.id,
            provider: this.provider,
            name: this.name,
            url: this.url,
            type: this.type,
            priority: this.priority
        };

        // Only include non-empty metadata fields if populated
        if (this.quality && this.quality !== 'Auto') payload.quality = this.quality;
        if (this.qualities.length > 0) payload.qualities = this.qualities;
        if (this.languages.length > 0) payload.languages = this.languages;
        if (this.audioTracks.length > 0) payload.audioTracks = this.audioTracks;
        if (this.subtitles.length > 0) payload.subtitles = this.subtitles;
        if (Object.keys(this.headers).length > 0) payload.headers = this.headers;

        return payload;
    }
}

module.exports = Stream;
