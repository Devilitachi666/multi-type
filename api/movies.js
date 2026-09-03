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
     * TV SERIES
     * ==================================================
     */

    if (mediaType === 'tv') {

        /*
         * --------------------------------------------------
         * GET TV SHOW DETAILS
         * --------------------------------------------------
         */

        const details =
            await tmdbRequest(
                `/tv/${encodeURIComponent(id)}`,
                {
                    language
                }
            );


        const normalizedShow =
            normalizeTV(details);


        /*
         * --------------------------------------------------
         * CHECK IF A SPECIFIC SEASON WAS REQUESTED
         *
         * Example:
         *
         * /api/movies?id=123&type=tv&season=1
         * --------------------------------------------------
         */

        const requestedSeason =
            req.query &&
            req.query.season !== undefined &&
            req.query.season !== null &&
            req.query.season !== ''
                ? Number(req.query.season)
                : null;


        /*
         * ==================================================
         * SPECIFIC SEASON + EPISODES
         * ==================================================
         */

        if (
            requestedSeason !== null &&
            Number.isFinite(requestedSeason) &&
            requestedSeason >= 0
        ) {

            const seasonDetails =
                await tmdbRequest(
                    `/tv/${encodeURIComponent(
                        id
                    )}/season/${encodeURIComponent(
                        requestedSeason
                    )}`,
                    {
                        language
                    }
                );


            const episodes =
                Array.isArray(
                    seasonDetails.episodes
                )
                    ? seasonDetails.episodes.map(
                        episode => {

                            const airDate =
                                episode.air_date ||
                                '';

                            return {

                                id:
                                    String(
                                        episode.id
                                    ),

                                type:
                                    'episode',


                                /*
                                 * Parent show
                                 */

                                showId:
                                    String(id),

                                parentShowId:
                                    String(id),

                                showName:
                                    details.name ||
                                    details.original_name ||
                                    'Untitled',

                                parentShowName:
                                    details.name ||
                                    details.original_name ||
                                    'Untitled',


                                /*
                                 * Season information
                                 */

                                season:
                                    Number(
                                        requestedSeason
                                    ),

                                seasonNumber:
                                    Number(
                                        requestedSeason
                                    ),

                                seasonTitle:
                                    seasonDetails.name ||
                                    `Season ${requestedSeason}`,


                                /*
                                 * Episode information
                                 */

                                episode:
                                    Number(
                                        episode.episode_number
                                    ),

                                episodeNumber:
                                    Number(
                                        episode.episode_number
                                    ),

                                title:
                                    episode.name ||
                                    `Episode ${episode.episode_number}`,

                                episodeTitle:
                                    episode.name ||
                                    `Episode ${episode.episode_number}`,


                                overview:
                                    episode.overview ||
                                    '',


                                releaseDate:
                                    airDate,

                                year:
                                    airDate
                                        ? airDate.slice(
                                            0,
                                            4
                                        )
                                        : '',


                                rating:
                                    Number(
                                        episode.vote_average ||
                                        0
                                    ),

                                voteCount:
                                    Number(
                                        episode.vote_count ||
                                        0
                                    ),


                                /*
                                 * Episode image
                                 */

                                still:
                                    episode.still_path
                                        ? `https://image.tmdb.org/t/p/w780${episode.still_path}`
                                        : null,

                                poster:
                                    episode.still_path
                                        ? `https://image.tmdb.org/t/p/w780${episode.still_path}`
                                        : (
                                            details.poster_path
                                                ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
                                                : null
                                        ),


                                /*
                                 * Runtime
                                 */

                                runtime:
                                    Number(
                                        episode.runtime ||
                                        0
                                    )

                            };

                        }
                    )
                    : [];


            /*
             * --------------------------------------------------
             * RETURN SELECTED SEASON
             * --------------------------------------------------
             */

            return res.status(200).json({

                success:
                    true,

                mode:
                    'season',

                type:
                    'tv',


                movie:
                    normalizedShow,


                show:
                    normalizedShow,


                season: {

                    seasonNumber:
                        Number(
                            requestedSeason
                        ),

                    season:
                        Number(
                            requestedSeason
                        ),

                    title:
                        seasonDetails.name ||
                        `Season ${requestedSeason}`,

                    overview:
                        seasonDetails.overview ||
                        '',

                    airDate:
                        seasonDetails.air_date ||
                        '',

                    episodeCount:
                        Number(
                            seasonDetails.episodes
                                ? seasonDetails.episodes.length
                                : 0
                        ),

                    poster:
                        seasonDetails.poster_path
                            ? `https://image.tmdb.org/t/p/w500${seasonDetails.poster_path}`
                            : (
                                details.poster_path
                                    ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
                                    : null
                            )

                },


                episodes:
                    episodes

            });

        }


        /*
         * ==================================================
         * TV SHOW DETAIL + ALL SEASONS
         * ==================================================
         */

        const seasons =
            Array.isArray(
                details.seasons
            )
                ? details.seasons
                    .filter(
                        seasonItem =>
                            Number(
                                seasonItem.season_number
                            ) >= 0
                    )
                    .map(
                        seasonItem => {

                            const airDate =
                                seasonItem.air_date ||
                                '';

                            return {

                                /*
                                 * Parent show
                                 */

                                id:
                                    String(id),

                                type:
                                    'tv',

                                showId:
                                    String(id),

                                parentShowId:
                                    String(id),

                                showName:
                                    details.name ||
                                    details.original_name ||
                                    'Untitled',

                                parentShowName:
                                    details.name ||
                                    details.original_name ||
                                    'Untitled',


                                /*
                                 * Season information
                                 */

                                season:
                                    Number(
                                        seasonItem.season_number
                                    ),

                                seasonNumber:
                                    Number(
                                        seasonItem.season_number
                                    ),

                                title:
                                    seasonItem.name ||
                                    `Season ${seasonItem.season_number}`,

                                seasonTitle:
                                    seasonItem.name ||
                                    `Season ${seasonItem.season_number}`,


                                overview:
                                    seasonItem.overview ||
                                    '',


                                releaseDate:
                                    airDate,

                                year:
                                    airDate
                                        ? airDate.slice(
                                            0,
                                            4
                                        )
                                        : '',


                                episodeCount:
                                    Number(
                                        seasonItem.episode_count ||
                                        0
                                    ),


                                poster:
                                    seasonItem.poster_path
                                        ? `https://image.tmdb.org/t/p/w500${seasonItem.poster_path}`
                                        : (
                                            details.poster_path
                                                ? `https://image.tmdb.org/t/p/w500${details.poster_path}`
                                                : null
                                        )

                            };

                        }
                    )
                : [];


        /*
         * --------------------------------------------------
         * RETURN TV SHOW + SEASONS
         * --------------------------------------------------
         */

        return res.status(200).json({

            success:
                true,

            mode:
                'detail',

            type:
                'tv',


            movie:
                normalizedShow,


            show:
                normalizedShow,


            seasons:
                seasons

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
