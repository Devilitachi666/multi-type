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


            const details =
                await tmdbRequest(
                    `/${mediaType}/${encodeURIComponent(id)}`,
                    {
                        language
                    }
                );


            const normalized =
                mediaType === 'tv'
                    ? normalizeTV(details)
                    : normalizeMovie(details);


            return res.status(200).json({

                success: true,

                mode: 'detail',

                movie: normalized

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

        if (
            String(query).trim()
        ) {

            const searchQuery =
                String(query).trim();


            /*
             * Search movies
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
             * Search TV
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
             * Normalize both
             */

            const movies =
                Array.isArray(movieData.results)
                    ? movieData.results.map(
                        normalizeMovie
                    )
                    : [];


            const tvShows =
                Array.isArray(tvData.results)
                    ? tvData.results.map(
                        normalizeTV
                    )
                    : [];


            /*
             * Combine results
             */

            const combined =
                [
                    ...movies,
                    ...tvShows
                ];


            /*
             * Sort by popularity
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

                movies: combined

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
