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


if (String(collection).trim()) {

  const franchiseResult = await resolveFranchise(
    collection,
    language || 'en-US'
  );

  if (!franchiseResult) {

    return res.status(404).json({
      success: false,
      error: 'Collection not found'
    });

  }

  return res.status(200).json(franchiseResult);
}


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


// ============================================================
// MAROONFLIX FRANCHISE REGISTRY
// ============================================================

const FRANCHISES = {

  // ------------------------------------------------------------
  // MARVEL
  // ------------------------------------------------------------
  marvel: {
    name: 'Marvel',
    collections: [],

    movies: [
      1726,       // Iron Man
      10138,      // Iron Man 2
      68721,      // Iron Man 3
      1771,       // Captain America
      100402,     // Captain America: The Winter Soldier
      271110,     // Captain America: Civil War
      10195,      // Thor
      76338,      // Thor: The Dark World
      284053,     // Thor: Ragnarok
      616037,     // Thor: Love and Thunder
      24428,      // The Avengers
      99861,      // Avengers: Age of Ultron
      299536,     // Avengers: Infinity War
      299534,     // Avengers: Endgame
      118340,     // Guardians of the Galaxy
      283995,     // Guardians Vol. 2
      447365,     // Guardians Vol. 3
      363088,     // Ant-Man
      640146,     // Ant-Man and the Wasp: Quantumania
      284052,     // Doctor Strange
      453395,     // Doctor Strange in the Multiverse of Madness
      299537,     // Captain Marvel
      609681,     // The Marvels
      505642,     // Black Panther
      497698,     // Black Panther: Wakanda Forever
      566525,     // Shang-Chi
      524434,     // Eternals
      568124,     // Black Widow
      533535      // Deadpool & Wolverine
    ],

    tv: [
      85271,      // WandaVision
      88396,      // The Falcon and the Winter Soldier
      84958,      // Loki
      88329,      // Hawkeye
      92749,      // Moon Knight
      92782,      // Ms. Marvel
      92783,      // She-Hulk
      114472,     // Secret Invasion
      91363,      // What If...?
      138501      // Agatha All Along
    ],

    search: [
      'Marvel',
      'Marvel Studios',
      'Marvel Cinematic Universe',
      'Avengers',
      'Iron Man',
      'Captain America',
      'Thor',
      'Guardians of the Galaxy',
      'Ant-Man',
      'Doctor Strange',
      'Black Panther',
      'Captain Marvel',
      'Deadpool',
      'Fantastic Four',
      'Daredevil',
      'Loki',
      'WandaVision',
      'Hawkeye',
      'Moon Knight',
      'Ms. Marvel',
      'She-Hulk',
      'Secret Invasion',
      'What If'
    ],

    searchPages: 3
  },


  // ------------------------------------------------------------
  // DC
  // ------------------------------------------------------------
  dc: {
    name: 'DC',
    collections: [],

    movies: [
      49521,
      209112,
      297761,
      297762,
      141052,
      297802,
      287947,
      474350,
      464052,
      436969,
      436270,
      594767,
      298618,
      565770,
      572802,
      414906,
      791373
    ],

    tv: [
      110492,     // Peacemaker
      100088      // The Penguin
    ],

    search: [
      'DC',
      'DC Comics',
      'DC Universe',
      'DC Extended Universe',
      'Batman',
      'Superman',
      'Wonder Woman',
      'Aquaman',
      'Justice League',
      'The Flash',
      'Shazam',
      'Suicide Squad',
      'Green Lantern',
      'Blue Beetle',
      'Peacemaker',
      'The Penguin',
      'Titans',
      'Doom Patrol',
      'Supergirl',
      'Gotham'
    ],

    searchPages: 3
  },


  // ------------------------------------------------------------
  // STAR WARS
  // ------------------------------------------------------------
  'star-wars': {
    name: 'Star Wars',

    // IMPORTANT:
    // Only the actual Star Wars collection is here.
    // Collection 119 was removed because it is NOT Star Wars.
    collections: [
      10
    ],

    movies: [
      1893,
      1894,
      1895,
      11,
      1891,
      1892,
      140607,
      181808,
      181812,
      348350,
      330459
    ],

    tv: [
      82856,      // The Mandalorian
      83867,      // Andor
      92830,      // Obi-Wan Kenobi
      114461,     // Ahsoka
      115036      // The Book of Boba Fett
    ],

    search: [
      'Star Wars',
      'The Mandalorian',
      'Andor',
      'Ahsoka',
      'Obi-Wan Kenobi',
      'The Book of Boba Fett',
      'The Clone Wars',
      'Star Wars Rebels',
      'The Bad Batch',
      'The Acolyte',
      'Skeleton Crew',
      'Tales of the Jedi',
      'Tales of the Empire'
    ],

    searchPages: 3
  },


  // ------------------------------------------------------------
  // HARRY POTTER / WIZARDING WORLD
  // ------------------------------------------------------------
  'harry-potter': {
    name: 'Harry Potter',

    collections: [
      1241
    ],

    movies: [
      259316,
      338953,
      338952
    ],

    tv: [],

    search: [
      'Harry Potter',
      'Fantastic Beasts',
      'Wizarding World',
      'Hogwarts'
    ],

    searchPages: 3
  },


  // ------------------------------------------------------------
  // LORD OF THE RINGS / MIDDLE EARTH
  // ------------------------------------------------------------
  'lord-of-rings': {
    name: 'The Lord of the Rings',

    collections: [
      119
    ],

    movies: [
      49051,
      57158,
      122917
    ],

    tv: [
      84773
    ],

    search: [
      'The Lord of the Rings',
      'Lord of the Rings',
      'The Hobbit',
      'Middle-earth',
      'Rings of Power'
    ],

    searchPages: 3
  },


  // ------------------------------------------------------------
  // SPIDER-MAN
  // ------------------------------------------------------------
  'spider-man': {
    name: 'Spider-Man',

    collections: [
      556
    ],

    movies: [
      102382,
      157336,
      569094
    ],

    tv: [],

    search: [
      'Spider-Man',
      'Spider Man',
      'The Amazing Spider-Man',
      'Spider-Man Homecoming',
      'Spider-Man Far From Home',
      'Spider-Man No Way Home',
      'Into the Spider-Verse',
      'Across the Spider-Verse',
      'Venom',
      'Morbius'
    ],

    searchPages: 3
  },


  // ------------------------------------------------------------
  // X-MEN
  // ------------------------------------------------------------
  'x-men': {
    name: 'X-Men',

    collections: [
      748
    ],

    movies: [
      293660,
      383498,
      533535,
      340102
    ],

    tv: [],

    search: [
      'X-Men',
      'X Men',
      'Wolverine',
      'Deadpool',
      'Logan',
      'The New Mutants',
      'Legion',
      'The Gifted'
    ],

    searchPages: 3
  },


  // ------------------------------------------------------------
  // FAST & FURIOUS
  // ------------------------------------------------------------
  'fast-furious': {
    name: 'Fast & Furious',

    collections: [
      9485
    ],

    movies: [
      384018
    ],

    tv: [],

    search: [
      'Fast and Furious',
      'Fast Furious',
      'Fast & Furious',
      'Hobbs Shaw'
    ],

    searchPages: 3
  },


  // ------------------------------------------------------------
  // JOHN WICK
  // ------------------------------------------------------------
  'john-wick': {
    name: 'John Wick',

    collections: [
      404609
    ],

    movies: [
      541671
    ],

    tv: [],

    search: [
      'John Wick',
      'Ballerina',
      'The Continental'
    ],

    searchPages: 3
  },


  // ------------------------------------------------------------
  // TRANSFORMERS
  // ------------------------------------------------------------
  transformers: {
    name: 'Transformers',

    collections: [
      8650
    ],

    movies: [
      424783,
      667574
    ],

    tv: [],

    search: [
      'Transformers',
      'Bumblebee',
      'Transformers One'
    ],

    searchPages: 3
  },


  // ------------------------------------------------------------
  // TERMINATOR
  // ------------------------------------------------------------
  terminator: {
    name: 'The Terminator',

    collections: [
      528
    ],

    movies: [],

    tv: [],

    search: [
      'Terminator',
      'Terminator Genisys',
      'Terminator Salvation',
      'Terminator Zero'
    ],

    searchPages: 3
  },


  // ------------------------------------------------------------
  // PREDATOR
  // ------------------------------------------------------------
  predator: {
    name: 'Predator',

    collections: [
      399
    ],

    movies: [
      766507
    ],

    tv: [],

    search: [
      'Predator',
      'Prey',
      'Alien vs Predator'
    ],

    searchPages: 3
  },


  // ------------------------------------------------------------
  // PLANET OF THE APES
  // ------------------------------------------------------------
  'planet-of-the-apes': {
    name: 'Planet of the Apes',

    collections: [
      173710,
      1704
    ],

    movies: [
      61791,
      119450,
      281338,
      653346
    ],

    tv: [],

    search: [
      'Planet of the Apes',
      'Rise of the Planet of the Apes',
      'Dawn of the Planet of the Apes',
      'War for the Planet of the Apes',
      'Kingdom of the Planet of the Apes'
    ],

    searchPages: 3
  },


  // ------------------------------------------------------------
  // MATRIX
  // ------------------------------------------------------------
  matrix: {
    name: 'The Matrix',

    collections: [
      2344
    ],

    movies: [],

    tv: [],

    search: [
      'The Matrix',
      'Matrix'
    ],

    searchPages: 3
  },


  // ------------------------------------------------------------
  // HUNGER GAMES
  // ------------------------------------------------------------
  'hunger-games': {
    name: 'The Hunger Games',

    collections: [
      131635
    ],

    movies: [],

    tv: [],

    search: [
      'The Hunger Games',
      'Catching Fire',
      'Mockingjay'
    ],

    searchPages: 3
  },


  // ------------------------------------------------------------
  // PIRATES OF THE CARIBBEAN
  // ------------------------------------------------------------
  'pirates-caribbean': {
    name: 'Pirates of the Caribbean',

    collections: [
      295
    ],

    movies: [],

    tv: [],

    search: [
      'Pirates of the Caribbean'
    ],

    searchPages: 3
  },


  // ------------------------------------------------------------
  // RESIDENT EVIL
  // ------------------------------------------------------------
  'resident-evil': {
    name: 'Resident Evil',

    collections: [
      133352,
      17255
    ],

    movies: [
      460458,
      138103,
      460465
    ],

    tv: [],

    search: [
      'Resident Evil',
      'Resident Evil Vendetta',
      'Resident Evil Death Island',
      'Resident Evil Degeneration'
    ],

    searchPages: 3
  },


  // ------------------------------------------------------------
  // CRAYON SHIN-CHAN
  // ------------------------------------------------------------
  shinchan: {
    name: 'Shinchan',

    collections: [
      117354
    ],

    movies: [],

    tv: [
      9661
    ],

    search: [
      'Crayon Shin-chan',
      'Shinchan',
      'Shin-chan'
    ],

    searchPages: 3
  },


  // ------------------------------------------------------------
  // DORAEMON
  // ------------------------------------------------------------
  doraemon: {
    name: 'Doraemon',

    collections: [],

    movies: [
      11808,
      15338,
      35690,
      44977,
      71619,
      138396,
      224624,
      371560,
      433132,
      454640,
      603321,
      724495
    ],

    // CORRECT:
    // 65733 = Doraemon
    // 37854 = One Piece
    tv: [
      65733
    ],

    search: [
      'Doraemon',
      'Doraemon Movie',
      'Doraemon Nobita'
    ],

    searchPages: 3
  },


  // ------------------------------------------------------------
  // ONE PIECE
  // ------------------------------------------------------------
  'one-piece': {
    name: 'One Piece',

    collections: [
      23456
    ],

    movies: [
      21055,
      16286,
      23494,
      44723,
      11228,
      123914,
      38408,
      288167,
      572154,
      900667
    ],

    // 37854 = One Piece
    tv: [
      37854
    ],

    search: [
      'One Piece',
      'One Piece Film',
      'One Piece Movie',
      'One Piece Special'
    ],

    searchPages: 3
  },


  // ------------------------------------------------------------
  // DEMON SLAYER
  // ------------------------------------------------------------
  'demon-slayer': {
    name: 'Demon Slayer',

    collections: [],

    movies: [
      635302,
      1311031
    ],

    tv: [
      85937
    ],

    search: [
      'Demon Slayer',
      'Kimetsu no Yaiba',
      'Demon Slayer Mugen Train',
      'Demon Slayer Infinity Castle'
    ],

    searchPages: 3
  },


  // ------------------------------------------------------------
  // POKEMON
  // ------------------------------------------------------------
  pokemon: {
    name: 'Pokémon',

    collections: [
      661026
    ],

    movies: [
      10991,
      12614,
      12615,
      12616,
      12617,
      12618,
      12619,
      12620,
      12621,
      12622
    ],

    // 60572 = Pokémon TV
    tv: [
      60572
    ],

    search: [
      'Pokémon',
      'Pokemon',
      'Pokemon Horizons',
      'Pokemon Journeys',
      'Pokemon Indigo League',
      'Pokemon Advanced',
      'Pokemon Diamond Pearl',
      'Pokemon Black White',
      'Pokemon Sun Moon',
      'Pokemon Master Journeys',
      'Pokemon Ultimate Journeys'
    ],

    searchPages: 3
  },


  // ------------------------------------------------------------
  // DHOOM
  // ------------------------------------------------------------
  dhoom: {
    name: 'Dhoom',

    collections: [],

    movies: [
      11812,
      12591,
      10204
    ],

    tv: [],

    search: [
      'Dhoom'
    ],

    searchPages: 3
  },


  // ------------------------------------------------------------
  // BAAHUBALI
  // ------------------------------------------------------------
  baahubali: {
    name: 'Baahubali',

    collections: [],

    movies: [
      256040,
      350312
    ],

    tv: [],

    search: [
      'Baahubali'
    ],

    searchPages: 3
  },


  // ------------------------------------------------------------
  // DRAGON BALL
  // ------------------------------------------------------------
  'dragon-ball': {
    name: 'Dragon Ball',

    collections: [],

    movies: [
      39138,
      39139,
      39140,
      39141,
      39142
    ],

    tv: [
      12609,
      30668,
      12610,
      62715,
      240411
    ],

    search: [
      'Dragon Ball',
      'Dragon Ball Z',
      'Dragon Ball GT',
      'Dragon Ball Super',
      'Dragon Ball Daima',
      'Dragon Ball Super Broly',
      'Dragon Ball Super Hero'
    ],

    searchPages: 3
  }
};


// ============================================================
// FRANCHISE RESOLVER
// ============================================================
//
// This does NOT depend on hundreds of manually entered IDs.
//
// Process:
// 1. Load official TMDB collections
// 2. Load known movie IDs
// 3. Load known TV IDs
// 4. Search TMDB automatically using aliases
// 5. Keep both movies and TV
// 6. Remove duplicates
// 7. Sort by release/air date
//
// ============================================================

async function resolveFranchise(collection, language = 'en-US') {

  const collectionKey = String(collection || '')
    .trim()
    .toLowerCase();

  const franchise = FRANCHISES[collectionKey];

  if (!franchise) {
    return null;
  }

  const results = [];
  const seen = new Set();

  function addResult(item) {

    if (!item || !item.id || !item.type) {
      return;
    }

    const key = `${item.type}:${item.id}`;

    if (seen.has(key)) {
      return;
    }

    seen.add(key);
    results.push(item);
  }


  // ----------------------------------------------------------
  // 1. TMDB COLLECTIONS
  // ----------------------------------------------------------

  if (
    Array.isArray(franchise.collections) &&
    franchise.collections.length
  ) {

    for (const collectionId of franchise.collections) {

      try {

        const data = await tmdbRequest(
          `/collection/${collectionId}`,
          {
            language
          }
        );

        if (
          data &&
          Array.isArray(data.parts)
        ) {

          for (const movie of data.parts) {

            addResult(
              normalizeMovie(movie)
            );

          }
        }

      } catch (error) {

        console.warn(
          `Franchise collection ${collectionId} failed:`,
          error.message
        );

      }
    }
  }


  // ----------------------------------------------------------
  // 2. KNOWN MOVIE IDS
  // ----------------------------------------------------------

  if (
    Array.isArray(franchise.movies) &&
    franchise.movies.length
  ) {

    for (const movieId of franchise.movies) {

      try {

        const movie = await tmdbRequest(
          `/movie/${movieId}`,
          {
            language
          }
        );

        if (movie && movie.id) {

          addResult(
            normalizeMovie(movie)
          );

        }

      } catch (error) {

        console.warn(
          `Franchise movie ${movieId} failed:`,
          error.message
        );

      }
    }
  }


  // ----------------------------------------------------------
  // 3. KNOWN TV IDS
  // ----------------------------------------------------------

  if (
    Array.isArray(franchise.tv) &&
    franchise.tv.length
  ) {

    for (const tvId of franchise.tv) {

      try {

        const tv = await tmdbRequest(
          `/tv/${tvId}`,
          {
            language
          }
        );

        if (tv && tv.id) {

          addResult(
            normalizeTV(tv)
          );

        }

      } catch (error) {

        console.warn(
          `Franchise TV ${tvId} failed:`,
          error.message
        );

      }
    }
  }


  // ----------------------------------------------------------
  // 4. AUTOMATIC TMDB SEARCH
  // ----------------------------------------------------------
  //
  // Search aliases instead of manually adding every ID.
  //
  // /search/multi returns movies + TV.
  //
  // ----------------------------------------------------------

  if (
    Array.isArray(franchise.search) &&
    franchise.search.length
  ) {

    const searchPages = Math.max(
      1,
      Math.min(
        Number(franchise.searchPages) || 1,
        5
      )
    );


    for (const searchTerm of franchise.search) {

      if (!searchTerm) {
        continue;
      }


      for (let page = 1; page <= searchPages; page++) {

        try {

          const data = await tmdbRequest(
            '/search/multi',
            {
              query: searchTerm,
              page,
              language,
              include_adult: false
            }
          );


          if (
            !data ||
            !Array.isArray(data.results)
          ) {
            continue;
          }


          for (const item of data.results) {

            if (!item || !item.id) {
              continue;
            }


            // ------------------------------------------------
            // MOVIE
            // ------------------------------------------------

            if (item.media_type === 'movie') {

              addResult(
                normalizeMovie(item)
              );

            }


            // ------------------------------------------------
            // TV
            // ------------------------------------------------

            else if (item.media_type === 'tv') {

              addResult(
                normalizeTV(item)
              );

            }

          }

        } catch (error) {

          console.warn(
            `Franchise search "${searchTerm}" page ${page} failed:`,
            error.message
          );

          break;
        }
      }
    }
  }


  // ----------------------------------------------------------
  // 5. SORT
  // ----------------------------------------------------------

  results.sort((a, b) => {

    const dateA =
      a.releaseDate ||
      a.firstAirDate ||
      '';

    const dateB =
      b.releaseDate ||
      b.firstAirDate ||
      '';

    return String(dateB)
      .localeCompare(String(dateA));

  });


  // ----------------------------------------------------------
  // 6. RETURN
  // ----------------------------------------------------------

  return {

    success: true,

    mode: 'franchise',

    collection: collectionKey,

    collectionName: franchise.name,

    page: 1,

    totalPages: 1,

    totalResults: results.length,

    movies: results
  };
}

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
