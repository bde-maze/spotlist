const { URL, URLSearchParams } = require('url')
const spotify = require('./spotify.js')

const discoverURL = 'https://api.spotify.com/v1/recommendations'
const contentTypeJson = 'application/json'
const contentTypeUrl = 'application/x-www-form-urlencoded'

const shuffle = array => {
  var j, x, i
  for (i = array.length - 1; i > 0; i--) {
    j = Math.floor(Math.random() * (i + 1))
    x = array[i]
    array[i] = array[j]
    array[j] = x
  }
  return array
}

const tracks = {
  random_track: (token, selectedGenres, targets) =>
    spotify(
      'GET',
      `${discoverURL}?limit=33&seed_genres=${selectedGenres}&${targets}`,
      contentTypeJson,
      {
        token
      }
    )
}

const setDelay = delay =>
  new Promise(success => {
    setTimeout(success, delay)
  })

module.exports = async (req, res) => {
  console.log('=== DISCOVER ===')

  res.setHeader('Content-Type', 'application/json')
  const parsedUrl = new URL(`http://placeholder${req.url}`)
  const accessToken = parsedUrl.searchParams.get('access_token')
  const action = parsedUrl.searchParams.get('action')

  const selectedGenres = encodeURIComponent(
    shuffle(genres)
      .slice(0, 5)
      .join(',')
  )
  console.log(selectedGenres)
  const targets = new URLSearchParams({
    target_acousticness: Math.round(Math.random() * 10) / 10,
    target_danceability: Math.round(Math.random() * 10) / 10,
    target_energy: Math.round(Math.random() * 10) / 10,
    target_instrumentalness: Math.round(Math.random() * 10) / 10,
    target_liveness: Math.round(Math.random() * 10) / 10,
    target_loudness: Math.round(Math.random() * 10) / 10,
    target_popularity: Math.floor(Math.random() * 100),
    target_speechiness: Math.round(Math.random() * 10) / 10,
    target_valence: Math.round(Math.random() * 10) / 10
  }).toString()
  console.log({ targets })

  try {
    if (accessToken) {
      console.log({ accessToken })
      console.log({ action })

      if (action) {
        const response = await tracks[action](
          `Bearer ${accessToken}`,
          selectedGenres,
          targets
        )
        await setDelay(250)
        console.log({ response })
        res.end(JSON.stringify(response))
      }
    }
  } catch (err) {
    console.dir(err)
    res.statusCode = 500
    res.end(JSON.stringify({ error: err.message }))
  }
}

const genres = [
  'acoustic',
  'afrobeat',
  'alt-rock',
  'alternative',
  'ambient',
  'anime',
  'black-metal',
  'bluegrass',
  'blues',
  'bossanova',
  'brazil',
  'breakbeat',
  'british',
  'cantopop',
  'chicago-house',
  'children',
  'chill',
  'classical',
  'club',
  'comedy',
  'country',
  'dance',
  'dancehall',
  'death-metal',
  'deep-house',
  'detroit-techno',
  'disco',
  'disney',
  'drum-and-bass',
  'dub',
  'dubstep',
  'edm',
  'electro',
  'electronic',
  'emo',
  'folk',
  'forro',
  'french',
  'funk',
  'garage',
  'german',
  'gospel',
  'goth',
  'grindcore',
  'groove',
  'grunge',
  'guitar',
  'happy',
  'hard-rock',
  'hardcore',
  'hardstyle',
  'heavy-metal',
  'hip-hop',
  'holidays',
  'honky-tonk',
  'house',
  'idm',
  'indian',
  'indie',
  'indie-pop',
  'industrial',
  'iranian',
  'j-dance',
  'j-idol',
  'j-pop',
  'j-rock',
  'jazz',
  'k-pop',
  'kids',
  'latin',
  'latino',
  'malay',
  'mandopop',
  'metal',
  'metal-misc',
  'metalcore',
  'minimal-techno',
  'movies',
  'mpb',
  'new-age',
  'new-release',
  'opera',
  'pagode',
  'party',
  'philippines-opm',
  'piano',
  'pop',
  'pop-film',
  'post-dubstep',
  'power-pop',
  'progressive-house',
  'psych-rock',
  'punk',
  'punk-rock',
  'r-n-b',
  'rainy-day',
  'reggae',
  'reggaeton',
  'road-trip',
  'rock',
  'rock-n-roll',
  'rockabilly',
  'romance',
  'sad',
  'salsa',
  'samba',
  'sertanejo',
  'show-tunes',
  'singer-songwriter',
  'ska',
  'sleep',
  'songwriter',
  'soul',
  'soundtracks',
  'spanish',
  'study',
  'summer',
  'swedish',
  'synth-pop',
  'tango',
  'techno',
  'trance',
  'trip-hop',
  'turkish',
  'work-out',
  'world-music'
]
