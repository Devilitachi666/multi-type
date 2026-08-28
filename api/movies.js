const TMDB_BASE_URL = 'https://api.themoviedb.org/3';

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

module.exports = async (
    req,
    res
) => {

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
            query = '',
            genre = '',
            category = '',
            page = '1',
            language = 'en-US',
            region = 'IN'
        } = req.query || {};


        /*
        |--------------------------------------------------------------------------
        | SPECIFIC MOVIE
        |--------------------------------------------------------------------------
        */

        if (id) {

            const movie =
                await tmdbRequest(
                    `/movie/${encodeURIComponent(id)}`,
                    {
                        language
                    }
                );

            return res.status(200).json({

                success: true,

                mode: 'detail',

                movie:
                    normalizeMovie(movie)

            });
        }


        /*
        |--------------------------------------------------------------------------
        | SEARCH
        |--------------------------------------------------------------------------
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

            return res.status(200).json({

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
                    Array.isArray(data.results)
                        ? data.results.map(
                            normalizeMovie
                        )
                        : []

            });
        }


        /*
        |--------------------------------------------------------------------------
        | GENRE
        |--------------------------------------------------------------------------
        |
        | Example:
        | /api/movies?genre=28
        |
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
        |--------------------------------------------------------------------------
        | CATEGORIES
        |--------------------------------------------------------------------------
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

    } catch (error) {

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
