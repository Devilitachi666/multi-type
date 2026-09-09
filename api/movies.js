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
    collection = '',
    year = '',
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
 * COLLECTION / FRANCHISE ENGINE — STAGE 1
 * ==================================================
 *
 * This system does NOT search movie or TV titles.
 *
 * It loads only:
 *
 * 1. Exact TMDB movie collection IDs
 * 2. Exact individual movie IDs
 * 3. Exact individual TV series IDs
 *
 * Stage 2 will populate FRANCHISES with the correct
 * IDs for every MaroonFlix collection.
 *
 */


if (
    String(collection).trim()
) {

    const collectionKey =
        String(collection)
            .toLowerCase()
            .trim();


    /*
     * ==================================================
     * FRANCHISE REGISTRY
     * ==================================================
     *
     * STAGE 1:
     *
     * Keep arrays empty for now.
     *
     * Stage 2 will add the exact TMDB IDs.
     *
     */


    const FRANCHISES = {

    /*
     * ==================================================
     * MARVEL
     * ==================================================
     */

    'marvel': {
        name: 'Marvel',
        mode: 'franchise',

        /*
         * Multiple exact franchise groups.
         * Stage 2 will merge these.
         */
        collectionSearches: [
            'Marvel Cinematic Universe'
        ],

        /*
         * Important:
         * Marvel is not represented by one normal TMDB
         * collection containing every MCU movie.
         *
         * We will use exact movie registry data in Stage 2.
         */
        movieSearches: [
            'Iron Man',
            'Captain America',
            'Thor',
            'The Avengers',
            'Guardians of the Galaxy',
            'Ant-Man',
            'Doctor Strange',
            'Spider-Man'
        ],

        tvSearches: [
            'WandaVision',
            'Loki',
            'The Falcon and the Winter Soldier',
            'Hawkeye',
            'Moon Knight',
            'Ms. Marvel',
            'She-Hulk',
            'Secret Invasion'
        ]
    },


    /*
     * ==================================================
     * DC
     * ==================================================
     */

    'dc': {
        name: 'DC',
        mode: 'franchise',

        collectionSearches: [
            'DC Extended Universe'
        ],

        movieSearches: [
            'Batman',
            'Superman',
            'Wonder Woman',
            'Justice League',
            'Aquaman',
            'Shazam'
        ],

        tvSearches: [
            'Peacemaker',
            'The Penguin'
        ]
    },


    /*
     * ==================================================
     * STAR WARS
     * ==================================================
     */

    'star-wars': {
        name: 'Star Wars',
        mode: 'collection',
        collectionSearches: [
            'Star Wars Collection'
        ],
        tvSearches: [
            'The Mandalorian',
            'Andor',
            'Obi-Wan Kenobi',
            'Ahsoka',
            'The Book of Boba Fett'
        ]
    },


    /*
     * ==================================================
     * HARRY POTTER
     * ==================================================
     */

    'harry-potter': {
        name: 'Harry Potter',
        mode: 'collection',
        collectionSearches: [
            'Harry Potter Collection'
        ],
        movieSearches: [
            'Fantastic Beasts'
        ]
    },


    /*
     * ==================================================
     * DORAEMON
     * ==================================================
     */

    'doraemon': {
        name: 'Doraemon',
        mode: 'franchise',
        collectionSearches: [
            'Doraemon Collection'
        ],
        tvSearches: [
            'Doraemon'
        ]
    },


    /*
     * ==================================================
     * FAST & FURIOUS
     * ==================================================
     */

    'fast-furious': {
        name: 'Fast & Furious',
        mode: 'collection',
        collectionSearches: [
            'Fast & Furious Collection'
        ],
        movieSearches: [
            'Hobbs & Shaw'
        ]
    },


    /*
     * ==================================================
     * PIRATES OF THE CARIBBEAN
     * ==================================================
     */

    'pirates-caribbean': {
        name: 'Pirates of the Caribbean',
        mode: 'collection',
        collectionSearches: [
            'Pirates of the Caribbean Collection'
        ]
    },


    /*
     * ==================================================
     * RESIDENT EVIL
     * ==================================================
     */

    'resident-evil': {
        name: 'Resident Evil',
        mode: 'franchise',
        collectionSearches: [
            'Resident Evil Collection',
            'Resident Evil: Welcome to Raccoon City Collection'
        ],
        movieSearches: [
            'Resident Evil: The Final Chapter',
            'Resident Evil: Death Island'
        ]
    },


    /*
     * ==================================================
     * SHINCHAN
     * ==================================================
     */

    'shinchan': {
        name: 'Shinchan',
        mode: 'franchise',
        collectionSearches: [
            'Crayon Shin-chan Collection'
        ],
        tvSearches: [
            'Crayon Shin-chan'
        ]
    },


    /*
     * ==================================================
     * TRANSFORMERS
     * ==================================================
     */

    'transformers': {
        name: 'Transformers',
        mode: 'franchise',
        collectionSearches: [
            'Transformers Collection'
        ],
        movieSearches: [
            'Bumblebee',
            'Transformers One'
        ]
    },


    /*
     * ==================================================
     * TWILIGHT
     * ==================================================
     */

    'twilight': {
        name: 'Twilight',
        mode: 'collection',
        collectionSearches: [
            'The Twilight Collection'
        ]
    },


    /*
     * ==================================================
     * X-MEN
     * ==================================================
     */

    'x-men': {
        name: 'X-Men',
        mode: 'franchise',
        collectionSearches: [
            'X-Men Collection'
        ],
        movieSearches: [
            'Deadpool',
            'Deadpool 2',
            'Deadpool & Wolverine',
            'The New Mutants'
        ]
    },


    /*
     * ==================================================
     * MISSION IMPOSSIBLE
     * ==================================================
     */

    'mission-impossible': {
        name: 'Mission: Impossible',
        mode: 'collection',
        collectionSearches: [
            'Mission: Impossible Collection'
        ]
    },


    /*
     * ==================================================
     * FINAL DESTINATION
     * ==================================================
     */

    'final-destination': {
        name: 'Final Destination',
        mode: 'collection',
        collectionSearches: [
            'Final Destination Collection'
        ]
    },


    /*
     * ==================================================
     * LORD OF THE RINGS
     * ==================================================
     */

    'lord-of-rings': {
        name: 'The Lord of the Rings',
        mode: 'franchise',

        collectionSearches: [
            'The Lord of the Rings Collection',
            'The Hobbit Collection'
        ],

        tvSearches: [
            'The Lord of the Rings: The Rings of Power'
        ]
    },


    /*
     * ==================================================
     * TERMINATOR
     * ==================================================
     */

    'terminator': {
        name: 'The Terminator',
        mode: 'collection',
        collectionSearches: [
            'Terminator Collection'
        ]
    },


    /*
     * ==================================================
     * PREDATOR
     * ==================================================
     */

    'predator': {
        name: 'Predator',
        mode: 'franchise',
        collectionSearches: [
            'Predator Collection'
        ],
        movieSearches: [
            'Prey'
        ]
    },


    /*
     * ==================================================
     * PLANET OF THE APES
     * ==================================================
     */

    'planet-of-the-apes': {
        name: 'Planet of the Apes',
        mode: 'franchise',
        collectionSearches: [
            'Planet of the Apes Collection'
        ],
        movieSearches: [
            'Rise of the Planet of the Apes',
            'Dawn of the Planet of the Apes',
            'War for the Planet of the Apes',
            'Kingdom of the Planet of the Apes'
        ]
    },


    /*
     * ==================================================
     * SPIDER-MAN
     * ==================================================
     */

    'spider-man': {
        name: 'Spider-Man',
        mode: 'franchise',

        collectionSearches: [
            'Spider-Man Collection',
            'The Amazing Spider-Man Collection',
            'Spider-Man: Spider-Verse Collection'
        ]
    },


    /*
     * ==================================================
     * BATMAN
     * ==================================================
     */

    'batman': {
        name: 'Batman',
        mode: 'franchise',

        collectionSearches: [
            'Batman Collection',
            'The Dark Knight Collection'
        ],

        movieSearches: [
            'The Batman'
        ]
    },


    /*
     * ==================================================
     * JOHN WICK
     * ==================================================
     */

    'john-wick': {
        name: 'John Wick',
        mode: 'franchise',
        collectionSearches: [
            'John Wick Collection'
        ],
        movieSearches: [
            'Ballerina'
        ]
    },


    /*
     * ==================================================
     * THE CONJURING
     * ==================================================
     */

    'conjuring': {
        name: 'The Conjuring Universe',
        mode: 'franchise',

        collectionSearches: [
            'The Conjuring Collection',
            'Annabelle Collection',
            'The Nun Collection'
        ]
    },


    /*
     * ==================================================
     * JURASSIC
     * ==================================================
     */

    'jurassic-park': {
        name: 'Jurassic Park',
        mode: 'franchise',

        collectionSearches: [
            'Jurassic Park Collection'
        ]
    },


    /*
     * ==================================================
     * MATRIX
     * ==================================================
     */

    'matrix': {
        name: 'The Matrix',
        mode: 'collection',

        collectionSearches: [
            'The Matrix Collection'
        ]
    },


    /*
     * ==================================================
     * AVATAR
     * ==================================================
     */

    'avatar': {
        name: 'Avatar',
        mode: 'collection',

        collectionSearches: [
            'Avatar Collection'
        ]
    },


    /*
     * ==================================================
     * HUNGER GAMES
     * ==================================================
     */

    'hunger-games': {
        name: 'The Hunger Games',
        mode: 'collection',

        collectionSearches: [
            'The Hunger Games Collection'
        ]
    },


    /*
     * ==================================================
     * DHOOM
     * ==================================================
     */

    'dhoom': {
        name: 'Dhoom',
        mode: 'franchise',

        movieSearches: [
            'Dhoom',
            'Dhoom 2',
            'Dhoom 3'
        ]
    },


    /*
     * ==================================================
     * BAAHUBALI
     * ==================================================
     */

    'baahubali': {
        name: 'Baahubali',
        mode: 'franchise',

        movieSearches: [
            'Baahubali: The Beginning',
            'Baahubali 2: The Conclusion'
        ]
    },


    /*
     * ==================================================
     * DRAGON BALL
     * ==================================================
     */

    'dragon-ball': {
        name: 'Dragon Ball',
        mode: 'franchise',

        collectionSearches: [
            'Dragon Ball Collection'
        ],

        tvSearches: [
            'Dragon Ball',
            'Dragon Ball Z',
            'Dragon Ball GT',
            'Dragon Ball Super',
            'Dragon Ball DAIMA'
        ]
    },


    /*
     * ==================================================
     * ONE PIECE
     * ==================================================
     */

    'one-piece': {
        name: 'One Piece',
        mode: 'franchise',

        collectionSearches: [
            'One Piece Collection'
        ],

        tvSearches: [
            'One Piece'
        ]
    },


    /*
     * ==================================================
     * DEMON SLAYER
     * ==================================================
     */

    'demon-slayer': {
        name: 'Demon Slayer',
        mode: 'franchise',

        movieSearches: [
            'Demon Slayer: Kimetsu no Yaiba'
        ],

        tvSearches: [
            'Demon Slayer: Kimetsu no Yaiba'
        ]
    },


    /*
     * ==================================================
     * POKÉMON
     * ==================================================
     */

    'pokemon': {
        name: 'Pokémon',
        mode: 'franchise',

        collectionSearches: [
            'Pokémon Collection'
        ],

        tvSearches: [
            'Pokémon'
        ]
    }

};

    /*
     * ==================================================
     * GET FRANCHISE
     * ==================================================
     */


    const franchise =
        FRANCHISES[
            collectionKey
        ];


    if (
        !franchise
    ) {

        return res
            .status(404)
            .json({

                success:
                    false,

                error:
                    'Collection not found'

            });

    }


    /*
     * ==================================================
     * RESULT STORAGE
     * ==================================================
     */


    let results = [];


    /*
     * ==================================================
     * LOAD EXACT TMDB COLLECTIONS
     * ==================================================
     *
     * TMDB collection endpoint returns the actual
     * `parts` belonging to that exact collection.
     *
     */


    if (
        Array.isArray(
            franchise.collections
        ) &&
        franchise.collections.length
    ) {

        const collectionGroups =
            await Promise.all(

                franchise.collections.map(
                    async collectionId => {

                        try {

                            const data =
                                await tmdbRequest(
                                    `/collection/${encodeURIComponent(
                                        collectionId
                                    )}`,
                                    {
                                        language
                                    }
                                );


                            return Array.isArray(
                                data.parts
                            )
                                ? data.parts.map(
                                    normalizeMovie
                                )
                                : [];

                        }

                        catch (
                            collectionError
                        ) {

                            console.error(
                                '[Franchise Collection Error]',
                                collectionKey,
                                collectionId,
                                collectionError
                            );


                            return [];

                        }

                    }
                )

            );


        results.push(
            ...collectionGroups.flat()
        );

    }


    /*
     * ==================================================
     * LOAD EXACT MOVIES
     * ==================================================
     */


    if (
        Array.isArray(
            franchise.movies
        ) &&
        franchise.movies.length
    ) {

        const movieGroups =
            await Promise.all(

                franchise.movies.map(
                    async movieId => {

                        try {

                            const movie =
                                await tmdbRequest(
                                    `/movie/${encodeURIComponent(
                                        movieId
                                    )}`,
                                    {
                                        language
                                    }
                                );


                            return normalizeMovie(
                                movie
                            );

                        }

                        catch (
                            movieError
                        ) {

                            console.error(
                                '[Franchise Movie Error]',
                                collectionKey,
                                movieId,
                                movieError
                            );


                            return null;

                        }

                    }
                )

            );


        results.push(
            ...movieGroups.filter(
                Boolean
            )
        );

    }


    /*
     * ==================================================
     * LOAD EXACT TV SHOWS
     * ==================================================
     */


    if (
        Array.isArray(
            franchise.tv
        ) &&
        franchise.tv.length
    ) {

        const tvGroups =
            await Promise.all(

                franchise.tv.map(
                    async tvId => {

                        try {

                            const show =
                                await tmdbRequest(
                                    `/tv/${encodeURIComponent(
                                        tvId
                                    )}`,
                                    {
                                        language
                                    }
                                );


                            return normalizeTV(
                                show
                            );

                        }

                        catch (
                            tvError
                        ) {

                            console.error(
                                '[Franchise TV Error]',
                                collectionKey,
                                tvId,
                                tvError
                            );


                            return null;

                        }

                    }
                )

            );


        results.push(
            ...tvGroups.filter(
                Boolean
            )
        );

    }


    /*
     * ==================================================
     * REMOVE DUPLICATES
     * ==================================================
     */


    const uniqueResults =
        new Map();


    results.forEach(
        item => {

            if (
                !item ||
                !item.id
            ) {

                return;

            }


            const uniqueKey =
                `${item.type}:${item.id}`;


            if (
                !uniqueResults.has(
                    uniqueKey
                )
            ) {

                uniqueResults.set(
                    uniqueKey,
                    item
                );

            }

        }
    );


    const movies =
        Array.from(
            uniqueResults.values()
        );


    /*
     * ==================================================
     * SORT CHRONOLOGICALLY
     * ==================================================
     */


    movies.sort(
        (
            a,
            b
        ) => {

            const dateA =
                new Date(
                    a.releaseDate ||
                    '9999-12-31'
                ).getTime();


            const dateB =
                new Date(
                    b.releaseDate ||
                    '9999-12-31'
                ).getTime();


            return (
                dateA -
                dateB
            );

        }
    );


    /*
     * ==================================================
     * RESPONSE
     * ==================================================
     */


    return res
        .status(200)
        .json({

            success:
                true,

            mode:
                'franchise',

            collection:
                collectionKey,

            collectionName:
                franchise.name,

            page:
                1,

            totalPages:
                1,

            totalResults:
                movies.length,

            movies:
                movies

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
 * YEAR FILTER
 * ==================================================
 *
 * /api/movies?year=2000
 *
 * Returns movies AND TV shows from the selected year.
 */

if (
    String(year).trim()
) {

    const selectedYear =
        String(year).trim();


    /*
     * Validate year
     */

    if (
        !/^\d{4}$/.test(
            selectedYear
        )
    ) {

        return res
            .status(400)
            .json({

                success: false,

                error:
                    'Invalid year'

            });

    }


    /*
     * --------------------------------------------------
     * MOVIES FROM YEAR
     * --------------------------------------------------
     */

    const movieData =
        await tmdbRequest(
            '/discover/movie',
            {
                language,
                region,
                page,

                primary_release_year:
                    selectedYear,

                sort_by:
                    'popularity.desc',

                include_adult:
                    'false',

                include_video:
                    'false'
            }
        );


    /*
     * --------------------------------------------------
     * TV SHOWS FROM YEAR
     * --------------------------------------------------
     */

    const tvData =
        await tmdbRequest(
            '/discover/tv',
            {
                language,
                page,

                first_air_date_year:
                    selectedYear,

                sort_by:
                    'popularity.desc',

                include_adult:
                    'false'
            }
        );


    /*
     * --------------------------------------------------
     * NORMALIZE
     * --------------------------------------------------
     */

    const movies =
        Array.isArray(
            movieData.results
        )
            ? movieData.results.map(
                normalizeMovie
            )
            : [];


    const tvShows =
        Array.isArray(
            tvData.results
        )
            ? tvData.results.map(
                normalizeTV
            )
            : [];


    /*
     * --------------------------------------------------
     * COMBINE MOVIES + TV SHOWS
     * --------------------------------------------------
     */

    const combined = [
        ...movies,
        ...tvShows
    ];


    /*
     * Sort by popularity
     */

    combined.sort(
        (a, b) => {

            const votesA =
                Number(
                    a.voteCount ||
                    0
                );

            const votesB =
                Number(
                    b.voteCount ||
                    0
                );

            return (
                votesB -
                votesA
            );

        }
    );


    /*
     * --------------------------------------------------
     * RETURN
     * --------------------------------------------------
     */

    return res
        .status(200)
        .json({

            success:
                true,

            mode:
                'year',

            year:
                selectedYear,

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
 * Examples:
 *
 * /api/movies?type=tv
 *
 * /api/movies?type=tv&category=top-rated
 */

if (
    String(type).toLowerCase() === 'tv'
) {

    let tvEndpoint =
        '/tv/popular';


    let tvCategory =
        'popular';


    /*
     * TOP RATED TV SHOWS
     */

    if (
        String(category)
            .toLowerCase() ===
        'top-rated'
    ) {

        tvEndpoint =
            '/tv/top_rated';

        tvCategory =
            'top-rated';

    }


    const tvData =
        await tmdbRequest(
            tvEndpoint,
            {
                language,
                page
            }
        );


    return res
        .status(200)
        .json({

            success:
                true,

            mode:
                'tv',

            type:
                'tv',

            category:
                tvCategory,

            page:
                tvData.page || 1,

            totalPages:
                tvData.total_pages || 1,

            totalResults:
                tvData.total_results || 0,

            movies:
                Array.isArray(
                    tvData.results
                )
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
