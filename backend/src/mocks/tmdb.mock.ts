export const mockSearchResults = {
  results: [
    {
      id: 550,
      media_type: 'movie',
      title: 'Fight Club',
      overview: 'A ticking-Loss of identity explosive satire on consumerism, corporate America, and the male condition.',
      poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
      release_date: '1999-10-15',
      vote_average: 8.4,
    },
    {
      id: 603,
      media_type: 'movie',
      title: 'The Matrix',
      overview: 'Set in the 22nd century, The Matrix tells the story of a computer hacker who joins a group of underground insurgents fighting the vast and powerful computers who now rule the earth.',
      poster_path: '/f89U3ADr1oiB1s9GkdPOEpXUk5H.jpg',
      release_date: '1999-03-30',
      vote_average: 8.2,
    },
    {
      id: 1396,
      media_type: 'tv',
      name: 'Breaking Bad',
      overview: 'When Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer and given a prognosis of two years left to live, he becomes filled with a sense of fearlessness and an unrelenting desire to secure his family\'s financial future at any cost as he enters the dangerous world of drugs and crime.',
      poster_path: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
      first_air_date: '2008-01-20',
      vote_average: 8.9,
    },
    {
      id: 66732,
      media_type: 'tv',
      name: 'Stranger Things',
      overview: 'When a young boy vanishes, a small town uncovers a mystery involving secret experiments, terrifying supernatural forces, and one strange little girl.',
      poster_path: '/49WJfeN0moxb9IPfGn8AIqMGskD.jpg',
      first_air_date: '2016-07-15',
      vote_average: 8.6,
    },
    {
      id: 278,
      media_type: 'movie',
      title: 'The Shawshank Redemption',
      overview: 'Framed in the 1940s for the double murder of his wife and her lover, upstanding banker Andy Dufresne begins a new life at the Shawshank prison.',
      poster_path: '/q6y0Go1tsGEsmtFryDOJo3dEmqu.jpg',
      release_date: '1994-09-23',
      vote_average: 8.7,
    },
  ],
};

export const mockMovieDetails = {
  id: 550,
  title: 'Fight Club',
  overview: 'A ticking-Loss of identity explosive satire on consumerism, corporate America, and the male condition.',
  poster_path: '/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg',
  release_date: '1999-10-15',
  runtime: 139,
  vote_average: 8.4,
  genres: [{ id: 18, name: 'Drama' }, { id: 53, name: 'Thriller' }],
};

export const mockSeriesDetails = {
  id: 1396,
  name: 'Breaking Bad',
  overview: 'When Walter White, a New Mexico chemistry teacher, is diagnosed with Stage III cancer...',
  poster_path: '/ggFHVNu6YYI5L9pCfOacjizRGt.jpg',
  first_air_date: '2008-01-20',
  vote_average: 8.9,
  number_of_seasons: 5,
  seasons: [
    { season_number: 1, episode_count: 7, name: 'Season 1' },
    { season_number: 2, episode_count: 13, name: 'Season 2' },
    { season_number: 3, episode_count: 13, name: 'Season 3' },
    { season_number: 4, episode_count: 13, name: 'Season 4' },
    { season_number: 5, episode_count: 16, name: 'Season 5' },
  ],
};

export const mockTrendingMovies = {
  results: [
    {
      id: 912649,
      title: 'Venom: The Last Dance',
      overview: 'Eddie and Venom are on the run. Hunted by both of their worlds and with the net closing in, the duo are forced into a devastating decision that will bring the curtains down on Venom and Eddie\'s last dance.',
      poster_path: '/aosm8NMQ3UyoBVpSxyimorCQykC.jpg',
      backdrop_path: '/3V4kLQg0kSqPLctI5ziYWabAZYF.jpg',
      release_date: '2024-10-22',
      vote_average: 6.7,
    },
    {
      id: 1184918,
      title: 'The Wild Robot',
      overview: 'After a shipwreck, an intelligent robot called Roz is stranded on an uninhabited island. To survive the harsh environment, Roz bonds with the island\'s animals and cares for an orphaned baby goose.',
      poster_path: '/wTnV3PCVW5O92JMrFvvrRcV39RU.jpg',
      backdrop_path: '/mQZJoIhTEkNhCYAqcHrQqhENLdu.jpg',
      release_date: '2024-09-12',
      vote_average: 8.4,
    },
    {
      id: 698687,
      title: 'Transformers One',
      overview: 'The untold origin story of Optimus Prime and Megatron, better known as sworn enemies, but once were friends bonded like brothers.',
      poster_path: '/iRCgVpOjaq8OJUoe7wHjn3BPNFX.jpg',
      backdrop_path: '/2lBkCSrtzhX8wPXTRJf6IB2VuYU.jpg',
      release_date: '2024-09-11',
      vote_average: 8.0,
    },
    {
      id: 945961,
      title: 'Alien: Romulus',
      overview: 'While scavenging the deep ends of a derelict space station, a group of young space colonizers come face to face with the most terrifying life form in the universe.',
      poster_path: '/b33nnKl1GSFbao4l3fZDDqsMx0F.jpg',
      backdrop_path: '/9SSEUrSqhljBMzRe4aBTh17wUFB.jpg',
      release_date: '2024-08-13',
      vote_average: 7.2,
    },
    {
      id: 1022789,
      title: 'Inside Out 2',
      overview: 'Teenager Riley\'s mind headquarters is undergoing a sudden demolition to make room for something entirely unexpected: new Emotions!',
      poster_path: '/vpnVM9B6NMmQpWeZvzLvDESb2QY.jpg',
      backdrop_path: '/xg27NrXi7VXCGUr7MN75UqLl6Vg.jpg',
      release_date: '2024-06-11',
      vote_average: 7.6,
    },
  ],
};

export const mockTrendingTv = {
  results: [
    {
      id: 94997,
      name: 'House of the Dragon',
      overview: 'The Targaryen dynasty is at the absolute apex of its power, with more than 15 dragons under their yoke. Most combatants combatants combatants when combatants combatants.',
      poster_path: '/7QMsOTMUswlwxJP0rTTZfmz2tX2.jpg',
      backdrop_path: '/etj8E2o0Bud0HkONVQPjyCkIvpv.jpg',
      first_air_date: '2022-08-21',
      vote_average: 8.4,
    },
    {
      id: 236235,
      name: 'The Penguin',
      overview: 'Following the events of The Batman, Oz Cobb rises through the ranks of Gotham\'s criminal underworld.',
      poster_path: '/a1FTdMRkGFAHMbTmOigBpFKphkR.jpg',
      backdrop_path: '/oHPoF0Gzu8HQ4JBEyj0JQIyLLlp.jpg',
      first_air_date: '2024-09-19',
      vote_average: 8.5,
    },
    {
      id: 84773,
      name: 'The Lord of the Rings: The Rings of Power',
      overview: 'Beginning in a time of relative peace, we follow an ensemble cast of characters as they confront the re-emergence of evil to Middle-earth.',
      poster_path: '/NNC08YmJFFlLi1prBkK8quk3dp.jpg',
      backdrop_path: '/jDJ3MYmBiKfOtMfFVcRdBfDBcbz.jpg',
      first_air_date: '2022-09-01',
      vote_average: 7.3,
    },
    {
      id: 95396,
      name: 'Severance',
      overview: 'Mark leads a team of office workers whose memories have been surgically divided between their work and personal lives.',
      poster_path: '/lFf6LLrQjYZOOlZmDqgBqxjAEdB.jpg',
      backdrop_path: '/jDJ3MYmBiKfOtMfFVcRdBfDBcbz.jpg',
      first_air_date: '2022-02-18',
      vote_average: 8.3,
    },
    {
      id: 67557,
      name: 'The Bear',
      overview: 'A young chef from the fine dining world returns to Chicago to run his family\'s Italian beef sandwich shop.',
      poster_path: '/sHFEQR6jcCCFvbMbGGDgelowYd8.jpg',
      backdrop_path: '/q4yOsSer2PXlKNPG4gXT0IqPWzR.jpg',
      first_air_date: '2022-06-23',
      vote_average: 8.2,
    },
  ],
};

export const mockSeasonDetails: Record<number, { episodes: { episode_number: number; name: string; overview: string }[] }> = {
  1: {
    episodes: [
      { episode_number: 1, name: 'Pilot', overview: 'Walter White, a chemistry teacher, discovers that he has cancer and decides to get into the meth-making business.' },
      { episode_number: 2, name: 'Cat\'s in the Bag...', overview: 'Walt and Jesse attempt to tie up loose ends.' },
      { episode_number: 3, name: '...And the Bag\'s in the River', overview: 'Walt is struggling with a difficult decision.' },
      { episode_number: 4, name: 'Cancer Man', overview: 'Walt tells his family about his cancer.' },
      { episode_number: 5, name: 'Gray Matter', overview: 'Walt rejects financial help from former colleagues.' },
      { episode_number: 6, name: 'Crazy Handful of Nothin\'', overview: 'Walt begins to build his drug empire.' },
      { episode_number: 7, name: 'A No-Rough-Stuff-Type Deal', overview: 'Walt and Jesse try a new business model.' },
    ],
  },
  2: {
    episodes: Array.from({ length: 13 }, (_, i) => ({
      episode_number: i + 1,
      name: `Season 2 Episode ${i + 1}`,
      overview: `Episode ${i + 1} of Season 2.`,
    })),
  },
  3: {
    episodes: Array.from({ length: 13 }, (_, i) => ({
      episode_number: i + 1,
      name: `Season 3 Episode ${i + 1}`,
      overview: `Episode ${i + 1} of Season 3.`,
    })),
  },
  4: {
    episodes: Array.from({ length: 13 }, (_, i) => ({
      episode_number: i + 1,
      name: `Season 4 Episode ${i + 1}`,
      overview: `Episode ${i + 1} of Season 4.`,
    })),
  },
  5: {
    episodes: Array.from({ length: 16 }, (_, i) => ({
      episode_number: i + 1,
      name: `Season 5 Episode ${i + 1}`,
      overview: `Episode ${i + 1} of Season 5.`,
    })),
  },
};
