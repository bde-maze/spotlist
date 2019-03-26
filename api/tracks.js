const { URL } = require('url')
const spotify = require('./spotify.js')

const trackURL = 'https://api.spotify.com/v1/me/tracks'
const contentTypeJson = 'application/json'
const contentTypeUrl = 'application/x-www-form-urlencoded'

const track = {
  contains: (token, trackId) =>
    spotify('GET', `${trackURL}/contains?ids=${trackId}`, contentTypeUrl, {
      token
    }),
  save: (token, trackId) =>
    spotify('PUT', trackURL, contentTypeJson, {
      token,
      body: {
        ids: [trackId]
      }
    }),
  remove: (token, trackId) =>
    spotify('DELETE', trackURL, contentTypeJson, {
      token,
      body: {
        ids: [trackId]
      }
    })
}

const setDelay = delay =>
  new Promise(success => {
    setTimeout(success, delay)
  })

module.exports = async (req, res) => {
  console.log('=== TRACKS ===')

  res.setHeader('Content-Type', 'application/json')
  const parsedUrl = new URL(`http://placeholder${req.url}`)
  const accessToken = parsedUrl.searchParams.get('access_token')
  const action = parsedUrl.searchParams.get('action')
  const trackId = parsedUrl.searchParams.get('track_id')

  try {
    if (accessToken) {
      console.log({ accessToken })
      console.log({ action })
      console.log({ trackId })

      if (action && trackId) {
        const response = await track[action](`Bearer ${accessToken}`, trackId)
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
