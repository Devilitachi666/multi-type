# multi-type

## Hindi Anime provider

The `hindi-anime` provider is built directly into `provider-registry.js`. It does not require a second API deployment. For `type=anime`, it resolves the TMDB ID to a title using `TMDB_ACCESS_TOKEN`, searches the configured Hindi anime source, resolves the matching anime slug, and returns all available servers for the requested season and episode.

Optional environment variable:

`HINDI_ANIME_BASE_URL=https://animesalt.ac`

If omitted, that value is used by default.
