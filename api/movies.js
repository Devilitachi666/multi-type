const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

function tmdbHeaders() {
    const token = process.env.TMDB_ACCESS_TOKEN;

    if (!token) {
        throw new Error('TMDB_ACCESS_TOKEN is not configured');
    }

    return {
        accept: 'application/json',
        Authorization: `Bearer ${token}`
    };
}


/*
 * --------------------------------------------------
 * MOVIE NORMALIZER
 * --------------------------------------------------
 */

function normalizeMovie(movie) {
    return {
        id: String(movie.id),
        type: 'movie',

        title:
            movie.title ||
            movie.original_title ||
            'Untitled',

        originalTitle:
            movie.original_title ||
            movie.title ||
            '',

        overview:
            movie.overview || '',

        releaseDate:
            movie.release_date || '',

        year:
            movie.release_date
                ? movie.release_date.slice(0, 4)
                : '',

        rating:
            Number(movie.vote_average || 0),

        voteCount:
            Number(movie.vote_count || 0),

        poster:
            movie.poster_path
                ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
                : null,

        backdrop:
            movie.backdrop_path
                ? `https://image.tmdb.org/t/p/w1280${movie.backdrop_path}`
                : null
    };
}


/*
 * --------------------------------------------------
 * TV NORMALIZER
 * --------------------------------------------------
 */

function normalizeTV(show) {
    return {
        id: String(show.id),
        type: 'tv',

        title:
            show.name ||
            show.original_name ||
            'Untitled',

        originalTitle:
            show.original_name ||
            show.name ||
            '',

        overview:
            show.overview || '',

        releaseDate:
            show.first_air_date || '',

        year:
            show.first_air_date
                ? show.first_air_date.slice(0, 4)
                : '',

        rating:
            Number(show.vote_average || 0),

        voteCount:
            Number(show.vote_count || 0),

        poster:
            show.poster_path
                ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
                : null,

        backdrop:
            show.backdrop_path
                ? `https://image.tmdb.org/t/p/w1280${show.backdrop_path}`
                : null
    };
}


/*
 * --------------------------------------------------
 * TMDB REQUEST
 * --------------------------------------------------
 */

async function tmdbRequest(
    path,
    params = {}
) {
    const url =
        new URL(`${TMDB_BASE_URL}${path}`);

    Object.entries(params).forEach(
        ([key, value]) => {

            if (
                value !== undefined &&
                value !== null &&
                value !== ''
            ) {
                url.searchParams.set(
                    key,
                    String(value)
                );
            }

        }
    );

    const response =
        await fetch(
            url.toString(),
            {
                headers: tmdbHeaders()
            }
        );

    if (!response.ok) {

        const text =
            await response.text();

        throw new Error(
            `TMDB ${response.status}: ${text}`
        );
    }

    return response.json();
}


/*
 * --------------------------------------------------
 * API
 * --------------------------------------------------
 */

module.exports = async (
    req,
    res
) => {

    /*
     * CORS
     */

    res.setHeader(
        'Access-Control-Allow-Origin',
        '*'
    );

    res.setHeader(
        'Access-Control-Allow-Methods',
        'GET, OPTIONS'
    );

    res.setHeader(
        'Access-Control-Allow-Headers',
        'Content-Type'
    );


    if (req.method === 'OPTIONS') {

        return res
            .status(204)
            .end();

    }


    if (req.method !== 'GET') {

        return res
            .status(405)
            .json({
                success: false,
                error: 'Method Not Allowed'
            });

    }


    try {

        const {
            id,
            type = '',
            query = '',
            genre = '',
            category = '',
            page = '1',
            language = 'en-US',
            region = 'IN'
        } = req.query || {};


        /*
         * ==================================================
         * SPECIFIC DETAIL
         * ==================================================
         *
         * /api/movies?id=969681&type=movie
         *
         * /api/movies?id=20&type=tv
         */

      if (id) {

    const mediaType =
        String(type).toLowerCase() === 'tv'
            ? 'tv'
            : 'movie';


    /*
     * ==================================================
     * TV SERIES DETAIL + SEASONS + EPISODES
     * ==================================================
     */

    if (mediaType === 'tv') {

        /*
         * GET SHOW DETAILS
         */

        const details =
            await tmdbRequest(
                `/tv/${encodeURIComponent(id)}`,
                {
                    language
                }
            );


        const normalized =
            normalizeTV(details);


        /*
         * --------------------------------------------------
         * AVAILABLE SEASONS
         * --------------------------------------------------
         */

        const availableSeasons =
            Array.isArray(details.seasons)
                ? details.seasons
                    .filter(
                        season =>
                            Number(
                                season.season_number
                            ) > 0
                    )
                    .map(
                        season => ({
                            id:
                                String(id),

                            parentShowId:
                                String(id),

                            parentShowName:
                                details.name ||
                                details.original_name ||
                                'Untitled',

                            seasonNumber:
                                Number(
                                    season.season_number
                                ),

                            seasonTitle:
                                season.name ||
                                `Season ${season.season_number}`,

                            title:
                                season.name ||
                                `Season ${season.season_number}`,

                            overview:
                                season.overview || '',

                            releaseDate:
                                season.air_date || '',

                            year:
                                season.air_date
                                    ? season.air_date.slice(
                                        0,
                                        4
                                    )
                                    : '',

                            episodeCount:
                                Number(
                                    season.episode_count || 0
                                ),

                            poster:
                                season.poster_path
                                    ? `https://image.tmdb.org/t/p/w500${season.poster_path}`
                                    : (
                                        details.poster_path
                                            ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
                                            : null
                                    )
                        })
                    )
                : [];


        /*
         * --------------------------------------------------
         * SELECTED SEASON
         *
         * URL example:
         *
         * /api/movies?id=46260&type=tv&season=1
         * --------------------------------------------------
         */

        let selectedSeasonNumber =
            req.query &&
            req.query.season !== undefined &&
            req.query.season !== null &&
            req.query.season !== ''
                ? Number(req.query.season)
                : null;


        /*
         * DEFAULT TO FIRST AVAILABLE SEASON
         */

        if (
            !selectedSeasonNumber &&
            availableSeasons.length > 0
        ) {

            selectedSeasonNumber =
                availableSeasons[0]
                    .seasonNumber;

        }


        /*
         * --------------------------------------------------
         * EPISODES
         * --------------------------------------------------
         */

        let episodes = [];


        if (
            selectedSeasonNumber !== null &&
            Number.isFinite(
                selectedSeasonNumber
            )
        ) {

            try {

                const seasonData =
                    await tmdbRequest(
                        `/tv/${encodeURIComponent(
                            id
                        )}/season/${encodeURIComponent(
                            selectedSeasonNumber
                        )}`,
                        {
                            language
                        }
                    );


                episodes =
                    Array.isArray(
                        seasonData.episodes
                    )
                        ? seasonData.episodes.map(
                            episode => ({

                                id:
                                    Number(
                                        episode.id
                                    ),

                                episodeNumber:
                                    Number(
                                        episode.episode_number
                                    ),

                                seasonNumber:
                                    Number(
                                        episode.season_number ||
                                        selectedSeasonNumber
                                    ),

                                title:
                                    episode.name ||
                                    `Episode ${episode.episode_number}`,

                                overview:
                                    episode.overview || '',

                                airDate:
                                    episode.air_date || '',

                                runtime:
                                    Number(
                                        episode.runtime || 0
                                    ),

                                still:
                                    episode.still_path
                                        ? `https://image.tmdb.org/t/p/w500${episode.still_path}`
                                        : null

                            })
                        )
                        : [];


            }

            catch (seasonError) {

                console.error(
                    '[TV Season] Failed:',
                    seasonError
                );

                episodes = [];

            }

        }


        /*
         * ==================================================
         * TV DETAIL RESPONSE
         * ==================================================
         */

        return res.status(200).json({

            success: true,

            mode: 'detail',

            type: 'tv',

            movie:
                normalized,

            seasons:
                availableSeasons,

            selectedSeason:
                selectedSeasonNumber,

            episodes:
                episodes

        });

    }


    /*
     * ==================================================
     * NORMAL MOVIE DETAIL
     * ==================================================
     */

    const details =
        await tmdbRequest(
            `/movie/${encodeURIComponent(id)}`,
            {
                language
            }
        );


    const normalized =
        normalizeMovie(
            details
        );


    return res.status(200).json({

        success:
            true,

        mode:
            'detail',

        type:
            'movie',

        movie:
            normalized

    });

} 

        /*
         * ==================================================
         * SEARCH
         * ==================================================
         *
         * Searches BOTH movies and TV.
         *
         * Example:
         *
         * /api/movies?query=naruto
         *
         */

        if (String(query).trim()) {

    const searchQuery =
        String(query).trim();

    /*
     * --------------------------------------------------
     * SEARCH MOVIES
     * --------------------------------------------------
     */

    const movieData =
        await tmdbRequest(
            '/search/movie',
            {
                query: searchQuery,
                language,
                region,
                page,
                include_adult: 'false'
            }
        );


    /*
     * --------------------------------------------------
     * SEARCH TV SERIES
     * --------------------------------------------------
     */

    const tvData =
        await tmdbRequest(
            '/search/tv',
            {
                query: searchQuery,
                language,
                page,
                include_adult: 'false'
            }
        );


    /*
     * --------------------------------------------------
     * NORMALIZE MOVIES
     * --------------------------------------------------
     */

    const movies =
        Array.isArray(movieData.results)
            ? movieData.results.map(
                normalizeMovie
            )
            : [];


    /*
     * --------------------------------------------------
     * NORMALIZE TV SERIES
     * --------------------------------------------------
     */

    const tvShows =
        Array.isArray(tvData.results)
            ? tvData.results.map(
                normalizeTV
            )
            : [];


    /*
     * --------------------------------------------------
     * COMBINE MOVIES + TV
     * --------------------------------------------------
     */

    const combined = [
        ...movies,
        ...tvShows
    ];


    /*
     * --------------------------------------------------
     * SORT BY RATING
     * --------------------------------------------------
     */

    combined.sort(
        (a, b) => {

            const ratingA =
                Number(a.rating || 0);

            const ratingB =
                Number(b.rating || 0);

            return ratingB - ratingA;
        }
    );


    /*
     * --------------------------------------------------
     * RESPONSE
     * --------------------------------------------------
     */

    return res.status(200).json({

        success: true,

        mode: 'search',

        query: searchQuery,

        page:
            Number(page) || 1,

        totalPages:
            Math.max(
                movieData.total_pages || 1,
                tvData.total_pages || 1
            ),

        totalResults:
            combined.length,

        movies:
            combined

    });

}


        /*
 * ==================================================
 * TV / WEB SERIES
 * ==================================================
 *
 * /api/movies?type=tv
 *
 * Returns popular TV/web-series results.
 */

if (
    String(type).toLowerCase() === 'tv'
) {

    const tvData =
        await tmdbRequest(
            '/tv/popular',
            {
                language,
                page
            }
        );


    return res.status(200).json({

        success: true,

        mode: 'tv',

        type: 'tv',

        page:
            tvData.page || 1,

        totalPages:
            tvData.total_pages || 1,

        totalResults:
            tvData.total_results || 0,

        movies:
            Array.isArray(tvData.results)
                ? tvData.results.map(
                    normalizeTV
                )
                : []

    });

}

        /*
 * ==================================================
 * LATEST ANIME
 * ==================================================
 *
 * /api/movies?anime=true
 *
 * Anime = Japanese animated TV series.
 */

      if (
    String(req.query.anime).toLowerCase() === 'true'
) {

    const animeData =
        await tmdbRequest(
            '/discover/tv',
            {
                language,
                page,

                with_genres: '16',

                with_original_language: 'ja',

                with_origin_country: 'JP',

                sort_by:
                    'popularity.desc',

                'vote_count.gte': '10',

                include_adult:
                    'false'
            }
        );


    return res.status(200).json({

        success: true,

        mode: 'anime',

        page:
            animeData.page || 1,

        totalPages:
            animeData.total_pages || 1,

        totalResults:
            animeData.total_results || 0,

        movies:
            Array.isArray(
                animeData.results
            )
                ? animeData.results.map(
                    normalizeTV
                )
                : []

    });

}

        /*
 * ==================================================
 * LATEST CARTOONS
 * ==================================================
 *
 * /api/movies?cartoon=true
 *
 * Animated content excluding Japanese anime as much
 * as possible.
 */

if (
    String(req.query.cartoon).toLowerCase() === 'true'
) {

    const cartoonData =
        await tmdbRequest(
            '/discover/movie',
            {
                language,
                region,
                page,

                /*
                 * Animation genre
                 */

                with_genres:
                    '16',

                /*
                 * Avoid Japanese anime movies.
                 */

                without_original_language:
                    'ja',

                sort_by:
                    'popularity.desc',

                'vote_count.gte':
                    '10',

                include_adult:
                    'false',

                include_video:
                    'false'
            }
        );


    return res.status(200).json({

        success: true,

        mode: 'cartoon',

        page:
            cartoonData.page || 1,

        totalPages:
            cartoonData.total_pages || 1,

        totalResults:
            cartoonData.total_results || 0,

        movies:
            Array.isArray(
                cartoonData.results
            )
                ? cartoonData.results.map(
                    normalizeMovie
                )
                : []

    });

}

        /*
 * ==================================================
 * RECENTLY ADDED SEASONS
 * ==================================================
 *
 * /api/movies?seasons=true&page=1
 *
 * Returns individual TV seasons.
 */

if (
    String(
        req.query.seasons
    ).toLowerCase() === 'true'
) {

    /*
     * --------------------------------------------------
     * 1. GET RECENT TV SHOWS
     * --------------------------------------------------
     */

    const tvData =
        await tmdbRequest(
            '/discover/tv',
            {
                language,

                page,

                sort_by:
                    'first_air_date.desc',

                'vote_count.gte':
                    '10',

                include_adult:
                    'false'
            }
        );


    const shows =
        Array.isArray(
            tvData.results
        )
            ? tvData.results
            : [];


    /*
     * --------------------------------------------------
     * 2. FETCH DETAILS FOR EACH SHOW
     * --------------------------------------------------
     *
     * Limit results to avoid making too many
     * TMDB requests in one API call.
     */

    const showsToProcess =
        shows.slice(
            0,
            10
        );


    const seasonGroups =
        await Promise.all(

            showsToProcess.map(
                async show => {

                    try {

                        const details =
                            await tmdbRequest(
                                `/tv/${encodeURIComponent(show.id)}`,
                                {
                                    language
                                }
                            );


                        const seasons =
                            Array.isArray(
                                details.seasons
                            )
                                ? details.seasons
                                : [];


                        /*
                         * --------------------------------------------------
                         * 3. CONVERT SHOW SEASONS TO CARDS
                         * --------------------------------------------------
                         */

                        return seasons
                            .filter(
                                season =>
                                    Number(
                                        season.season_number
                                    ) > 0
                            )
                            .map(
                                season => {

                                    const airDate =
                                        season.air_date ||
                                        '';

                                    return {

                                        /*
                                         * Parent show
                                         */

                                        id:
                                            String(
                                                show.id
                                            ),

                                        type:
                                            'tv',


                                        /*
                                         * Parent show information
                                         */

                                        parentShowId:
                                            String(
                                                show.id
                                            ),

                                        parentShowName:
                                            details.name ||
                                            details.original_name ||
                                            show.name ||
                                            'Untitled',


                                        /*
                                         * Season information
                                         */

                                        season:
                                            Number(
                                                season.season_number
                                            ),

                                        seasonNumber:
                                            Number(
                                                season.season_number
                                            ),

                                        seasonTitle:
                                            season.name ||
                                            `Season ${season.season_number}`,


                                        /*
                                         * Card title
                                         */

                                        title:
                                            `${details.name || show.name || 'Untitled'} — ${season.name || `Season ${season.season_number}`}`,


                                        /*
                                         * Description
                                         */

                                        overview:
                                            season.overview ||
                                            details.overview ||
                                            '',


                                        /*
                                         * Dates
                                         */

                                        releaseDate:
                                            airDate,

                                        year:
                                            airDate
                                                ? airDate.slice(
                                                    0,
                                                    4
                                                )
                                                : '',


                                        /*
                                         * Poster
                                         */

                                        poster:
                                            season.poster_path
                                                ? `https://image.tmdb.org/t/p/w500${season.poster_path}`
                                                : (
                                                    show.poster_path
                                                        ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
                                                        : null
                                                ),


                                        /*
                                         * Backdrop
                                         */

                                        backdrop:
                                            details.backdrop_path
                                                ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}`
                                                : null,


                                        /*
                                         * Rating
                                         */

                                        rating:
                                            Number(
                                                details.vote_average ||
                                                show.vote_average ||
                                                0
                                            ),


                                        /*
                                         * Useful metadata
                                         */

                                        episodeCount:
                                            Number(
                                                season.episode_count ||
                                                0
                                            )

                                    };

                                }
                            );

                    }

                    catch (
                        showError
                    ) {

                        console.error(
                            '[Seasons] Failed to load show:',
                            show.id,
                            showError
                        );


                        return [];

                    }

                }
            )

        );


    /*
     * --------------------------------------------------
     * 4. FLATTEN ALL SEASONS
     * --------------------------------------------------
     */

    const seasons =
        seasonGroups.flat();


    /*
     * --------------------------------------------------
     * 5. SORT BY SEASON AIR DATE
     * --------------------------------------------------
     */

    seasons.sort(
        (
            a,
            b
        ) => {

            const dateA =
                new Date(
                    a.releaseDate ||
                    0
                ).getTime();


            const dateB =
                new Date(
                    b.releaseDate ||
                    0
                ).getTime();


            return (
                dateB -
                dateA
            );

        }
    );


    /*
     * --------------------------------------------------
     * 6. RETURN SEASONS
     * --------------------------------------------------
     */

    return res.status(200).json({

        success:
            true,

        mode:
            'seasons',

        type:
            'tv',

        page:
            Number(
                tvData.page ||
                page ||
                1
            ),

        totalPages:
            Number(
                tvData.total_pages ||
                1
            ),

        totalResults:
            seasons.length,

        movies:
            seasons

    });

}

        /*
 * ==================================================
 * RECENTLY ADDED EPISODES
 * ==================================================
 *
 * /api/movies?episodes=true&page=1
 *
 * Returns individual episodes from recently aired TV shows.
 */

if (
    String(
        req.query.episodes
    ).toLowerCase() === 'true'
) {

    /*
     * --------------------------------------------------
     * GET CURRENT / RECENT TV SHOWS
     * --------------------------------------------------
     */

    const tvData =
        await tmdbRequest(
            '/tv/on_the_air',
            {
                language,
                page
            }
        );


    const shows =
        Array.isArray(
            tvData.results
        )
            ? tvData.results
            : [];


    /*
     * --------------------------------------------------
     * LIMIT SHOWS
     *
     * Prevent too many TMDB requests.
     * --------------------------------------------------
     */

    const showsToProcess =
        shows.slice(
            0,
            12
        );


    /*
     * --------------------------------------------------
     * LOAD LATEST SEASON EPISODES
     * --------------------------------------------------
     */

    const episodeGroups =
        await Promise.all(

            showsToProcess.map(
                async show => {

                    try {

                        /*
                         * Get full TV details
                         */

                        const details =
                            await tmdbRequest(
                                `/tv/${encodeURIComponent(
                                    show.id
                                )}`,
                                {
                                    language
                                }
                            );


                        /*
                         * TMDB provides the latest aired episode.
                         */

                        const lastEpisode =
                            details.last_episode_to_air;


                        if (
                            !lastEpisode
                        ) {

                            return [];

                        }


                        const seasonNumber =
                            Number(
                                lastEpisode.season_number ||
                                1
                            );


                        /*
                         * Don't process specials.
                         */

                        if (
                            seasonNumber <= 0
                        ) {

                            return [];

                        }


                        /*
                         * Load the complete latest season
                         */

                        const seasonData =
                            await tmdbRequest(
                                `/tv/${encodeURIComponent(
                                    show.id
                                )}/season/${encodeURIComponent(
                                    seasonNumber
                                )}`,
                                {
                                    language
                                }
                            );


                        const seasonEpisodes =
                            Array.isArray(
                                seasonData.episodes
                            )
                                ? seasonData.episodes
                                : [];


                        /*
                         * Convert episodes into cards.
                         */

                        return seasonEpisodes
                            .filter(
                                episode =>
                                    episode.air_date
                            )
                            .map(
                                episode => {

                                    return {

                                        /*
                                         * Unique episode ID
                                         */

                                        id:
                                            `${show.id}-s${episode.season_number}-e${episode.episode_number}`,


                                        /*
                                         * MEDIA TYPE
                                         */

                                        type:
                                            'tv',


                                        /*
                                         * PARENT SHOW
                                         */

                                        parentShowId:
                                            String(
                                                show.id
                                            ),

                                        parentShowName:
                                            details.name ||
                                            details.original_name ||
                                            show.name ||
                                            'Untitled',


                                        /*
                                         * SHOW TITLE
                                         */

                                        showTitle:
                                            details.name ||
                                            show.name ||
                                            'Untitled',


                                        /*
                                         * SEASON / EPISODE
                                         */

                                        seasonNumber:
                                            Number(
                                                episode.season_number ||
                                                seasonNumber
                                            ),

                                        episodeNumber:
                                            Number(
                                                episode.episode_number ||
                                                0
                                            ),


                                        /*
                                         * EPISODE TITLE
                                         */

                                        title:
                                            episode.name ||
                                            `Episode ${episode.episode_number}`,


                                        /*
                                         * DESCRIPTION
                                         */

                                        overview:
                                            episode.overview ||
                                            '',


                                        /*
                                         * AIR DATE
                                         */

                                        releaseDate:
                                            episode.air_date ||
                                            '',

                                        airDate:
                                            episode.air_date ||
                                            '',

                                        year:
                                            episode.air_date
                                                ? episode.air_date.slice(
                                                    0,
                                                    4
                                                )
                                                : '',


                                        /*
                                         * EPISODE IMAGE
                                         */

                                        poster:
                                            episode.still_path
                                                ? `https://image.tmdb.org/t/p/w500${episode.still_path}`
                                                : (
                                                    show.poster_path
                                                        ? `https://image.tmdb.org/t/p/w500${show.poster_path}`
                                                        : null
                                                ),

                                        still:
                                            episode.still_path
                                                ? `https://image.tmdb.org/t/p/w500${episode.still_path}`
                                                : null,


                                        /*
                                         * BACKDROP
                                         */

                                        backdrop:
                                            details.backdrop_path
                                                ? `https://image.tmdb.org/t/p/w1280${details.backdrop_path}`
                                                : null,


                                        /*
                                         * EPISODE RUNTIME
                                         */

                                        runtime:
                                            Number(
                                                episode.runtime ||
                                                0
                                            ),


                                        /*
                                         * SHOW RATING
                                         */

                                        rating:
                                            Number(
                                                details.vote_average ||
                                                show.vote_average ||
                                                0
                                            )

                                    };

                                }
                            );

                    }

                    catch (
                        episodeError
                    ) {

                        console.error(
                            '[Episodes] Failed to load show:',
                            show.id,
                            episodeError
                        );


                        return [];

                    }

                }
            )

        );


    /*
     * --------------------------------------------------
     * FLATTEN ALL EPISODES
     * --------------------------------------------------
     */

    const episodes =
        episodeGroups.flat();


    /*
     * --------------------------------------------------
     * SORT BY AIR DATE
     *
     * Newest episode first.
     * --------------------------------------------------
     */

    episodes.sort(
        (
            a,
            b
        ) => {

            const dateA =
                new Date(
                    a.airDate ||
                    0
                ).getTime();


            const dateB =
                new Date(
                    b.airDate ||
                    0
                ).getTime();


            return (
                dateB -
                dateA
            );

        }
    );


    /*
     * --------------------------------------------------
     * LIMIT RESPONSE
     * --------------------------------------------------
     */

    const recentEpisodes =
        episodes.slice(
            0,
            24
        );


    /*
     * --------------------------------------------------
     * RESPONSE
     * --------------------------------------------------
     */

    return res.status(200).json({

        success:
            true,

        mode:
            'episodes',

        type:
            'tv',

        page:
            Number(
                tvData.page ||
                page ||
                1
            ),

        totalPages:
            Number(
                tvData.total_pages ||
                1
            ),

        totalResults:
            recentEpisodes.length,

        movies:
            recentEpisodes

    });

}


        /*
         * ==================================================
         * MOVIE GENRE
         * ==================================================
         */

        if (
            String(genre).trim()
        ) {

            const data =
                await tmdbRequest(
                    '/discover/movie',
                    {
                        language,
                        region,
                        page,

                        with_genres:
                            String(genre),

                        sort_by:
                            'popularity.desc',

                        include_adult:
                            'false',

                        include_video:
                            'false'
                    }
                );


            return res.status(200).json({

                success: true,

                mode: 'genre',

                genre:
                    String(genre),

                page:
                    data.page || 1,

                totalPages:
                    data.total_pages || 1,

                totalResults:
                    data.total_results || 0,

                movies:
                    Array.isArray(data.results)
                        ? data.results.map(
                            normalizeMovie
                        )
                        : []

            });

        }


        /*
         * ==================================================
         * MOVIE CATEGORIES
         * ==================================================
         */

        let endpoint =
            '/movie/popular';

        let categoryName =
            'popular';


        switch (
            String(category).toLowerCase()
        ) {

            case 'popular':

                endpoint =
                    '/movie/popular';

                categoryName =
                    'popular';

                break;


            case 'top-rated':

            case 'top_rated':

                endpoint =
                    '/movie/top_rated';

                categoryName =
                    'top-rated';

                break;


            case 'now-playing':

            case 'now_playing':

                endpoint =
                    '/movie/now_playing';

                categoryName =
                    'now-playing';

                break;


            case 'upcoming':

                endpoint =
                    '/movie/upcoming';

                categoryName =
                    'upcoming';

                break;


            default:

                endpoint =
                    '/movie/popular';

                categoryName =
                    'popular';

                break;

        }


        const data =
            await tmdbRequest(
                endpoint,
                {
                    language,
                    region,
                    page,

                    include_adult:
                        'false',

                    include_video:
                        'false'
                }
            );


        return res.status(200).json({

            success: true,

            mode: 'category',

            category:
                categoryName,

            page:
                data.page || 1,

            totalPages:
                data.total_pages || 1,

            totalResults:
                data.total_results || 0,

            movies:
                Array.isArray(data.results)
                    ? data.results.map(
                        normalizeMovie
                    )
                    : []

        });

    }

    catch (error) {

        console.error(
            'TMDB metadata error:',
            error
        );


        return res
            .status(500)
            .json({

                success: false,

                error:
                    'Unable to retrieve movie metadata'

            });

    }

};
