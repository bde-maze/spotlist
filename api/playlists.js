const { URL } = require('url')
const spotify = require('./spotify.js')

const playlistURL = 'https://api.spotify.com/v1/me/playlists'
const contentTypeJson = 'application/json'

const getPlaylists = async url => {
  const response = await spotify('GET', url, contentTypeJson, {
    token: `Bearer ${access_token}`
  }).catch(error => console.dir(error))
  playlists.push(response.items)
  if (response.next) await getPlaylists(response.next)
}

module.exports = async (req, res) => {
  console.log('=== PLAYLISTS ===')

  const parsedUrl = new URL(`http://placeholder${req.url}`)
  const access_token = parsedUrl.searchParams.get('access_token')
  const playlists = []

  if (access_token) {
    console.log({ access_token })

    const getPlaylists = async url => {
      const response = await spotify('GET', url, contentTypeJson, {
        token: `Bearer ${access_token}`
      }).catch(error => console.dir(error))
      playlists.push(response.items)
      if (response.next) await getPlaylists(response.next)
    }

    await getPlaylists(`${playlistURL}?limit=50`)

    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(playlists))
  }
}
