const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

/*
|--------------------------------------------------------------------------
| TMDB AUTHENTICATION
|--------------------------------------------------------------------------
*/

function tmdbHeaders() {
    const token = process.env.TMDB_ACCESS_TOKEN;

    if (!token) {
        throw new Error(
            'TMDB_ACCESS_TOKEN is not configured'
        );
    }

    return {
        accept: 'application/json',
        Authorization: `Bearer ${token}`
    };
}


/*
|--------------------------------------------------------------------------
| NORMALIZE MOVIE
|--------------------------------------------------------------------------
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
|--------------------------------------------------------------------------
| TMDB REQUEST
|--------------------------------------------------------------------------
*/

async function tmdbRequest(
    path,
    params = {}
) {
    const url = new URL(
        `${TMDB_BASE_URL}${path}`
    );

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
|--------------------------------------------------------------------------
| API HANDLER
|--------------------------------------------------------------------------
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


    /*
     * OPTIONS / PREFLIGHT
     */

    if (req.method === 'OPTIONS') {

        return res
            .status(204)
            .end();

    }


    /*
     * METHOD CHECK
     */

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

            /*
             * Search query
             *
             * Example:
             * /api/movies?query=avatar
             */

            query = '',

            /*
             * Pagination
             */

            page = '1',

            /*
             * TMDB language
             */

            language = 'en-US',

            /*
             * Region
             */

            region = 'IN'
        } = req.query || {};


        /*
        |--------------------------------------------------------------------------
        | SPECIFIC MOVIE
        |--------------------------------------------------------------------------
        |
        | Example:
        | /api/movies?id=550
        |
        */

        if (id) {

            const movie =
                await tmdbRequest(
                    `/movie/${encodeURIComponent(id)}`,
                    {
                        language
                    }
                );

            return res
                .status(200)
                .json({
                    success: true,

                    movie:
                        normalizeMovie(movie)
                });

        }


        /*
        |--------------------------------------------------------------------------
        | MOVIE SEARCH
        |--------------------------------------------------------------------------
        |
        | Example:
        | /api/movies?query=avatar
        |
        */

        if (
            String(query).trim()
        ) {

            const searchQuery =
                String(query).trim();

            const data =
                await tmdbRequest(
                    '/search/movie',
                    {
                        query:
                            searchQuery,

                        language,

                        region,

                        page,

                        include_adult:
                            'false'
                    }
                );

            return res
                .status(200)
                .json({

                    success: true,

                    mode: 'search',

                    query:
                        searchQuery,

                    page:
                        data.page || 1,

                    totalPages:
                        data.total_pages || 1,

                    totalResults:
                        data.total_results || 0,

                    movies:
                        Array.isArray(
                            data.results
                        )
                            ? data.results.map(
                                normalizeMovie
                            )
                            : []

                });

        }


        /*
        |--------------------------------------------------------------------------
        | DEFAULT POPULAR MOVIES
        |--------------------------------------------------------------------------
        |
        | Used by your current homepage.
        |
        | Example:
        | /api/movies?page=1&language=en-US&region=IN
        |
        */

        const data =
            await tmdbRequest(
                '/movie/popular',
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


        return res
            .status(200)
            .json({

                success: true,

                mode: 'popular',

                page:
                    data.page || 1,

                totalPages:
                    data.total_pages || 1,

                totalResults:
                    data.total_results || 0,

                movies:
                    Array.isArray(
                        data.results
                    )
                        ? data.results.map(
                            normalizeMovie
                        )
                        : []

            });


    } catch (error) {

        /*
         * SERVER LOG
         */

        console.error(
            'TMDB metadata error:',
            error
        );


        /*
         * CLIENT RESPONSE
         */

        return res
            .status(500)
            .json({

                success: false,

                error:
                    'Unable to retrieve movie metadata'

            });

    }

};
