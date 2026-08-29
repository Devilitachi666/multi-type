module.exports = {
  metadata: {
    api_key: process.env.TMDB_API_KEY || '',
    base_url: 'https://api.themoviedb.org/3'
  },

  default_stream_type: 'iframe',

  providers: [
    {
      id: 'vidlink',
      name: 'VidLink',
      enabled: true,
      priority: 1,
      config: {}
    },
    {
      id: 'vidsrc',
      name: 'VidSrc',
      enabled: true,
      priority: 2,
      config: {}
    },
    {
      id: 'autoembed',
      name: 'AutoEmbed',
      enabled: true,
      priority: 3,
      config: {}
    },
    {
      id: '2embed',
      name: '2Embed',
      enabled: true,
      priority: 4,
      config: {}
    },
    {
      id: 'superembed',
      name: 'SuperEmbed',
      enabled: true,
      priority: 5,
      config: {}
    },
    {
      id: 'superembed-vip',
      name: 'SuperEmbed VIP',
      enabled: true,
      priority: 6,
      config: {}
    },
    {
      id: 'nontongo',
      name: 'NontonGo',
      enabled: true,
      priority: 7,
      config: {}
    },
    {
  id: 'screenscape',
  name: 'ScreenScape',
  enabled: true,
  priority: 8,
  config: {}
},
{
  id: 'vidzee',
  name: 'VidZee',
  enabled: true,
  priority: 9,
  config: {}
},
{
  id: 'vidzee-v2',
  name: 'VidZee V2',
  enabled: true,
  priority: 10,
  config: {}
},
{
  id: 'vidcore',
  name: 'VidCore',
  enabled: true,
  priority: 11,
  config: {}
},
{
  id: 'cinemaos',
  name: 'CinemaOS',
  enabled: true,
  priority: 12,
  config: {}
},
{
  id: 'vidnest',
  name: 'VidNest',
  enabled: true,
  priority: 13,
  config: {}
},
{
  id: 'videasy',
  name: 'Videasy',
  enabled: true,
  priority: 14,
  config: {}
},
{
  id: 'nxsha',
  name: 'Nxsha',
  enabled: true,
  priority: 15,
  config: {}
}
{
   id: 'demo',
      name: 'Demo Provider',
      enabled: false, // Disabled demo since real providers are configured
      priority: 8,
      config: {}
    }
  ],

  cache_ttl: 3600
};
