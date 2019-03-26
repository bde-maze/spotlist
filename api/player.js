const { URL } = require('url')
const spotify = require('./spotify.js')

const playerURL = 'https://api.spotify.com/v1/me/player'
const contentTypeJson = 'application/json'
const contentTypeUrl = 'application/x-www-form-urlencoded'

const player = {
  transfer: (token, deviceId) =>
    spotify('PUT', playerURL, contentTypeJson, {
      token,
      body: {
        device_ids: [deviceId]
      }
    }),
  play: token =>
    spotify('PUT', `${playerURL}/play`, contentTypeJson, { token }),
  play_with_uri: (token, trackUri) =>
    spotify('PUT', `${playerURL}/play`, contentTypeJson, {
      token,
      body: {
        uris: [trackUri]
      }
    }),
  play_with_device: (token, deviceId) =>
    spotify('PUT', `${playerURL}/play`, contentTypeJson, {
      token,
      body: {
        device_id: deviceId
      }
    }),
  pause: token =>
    spotify('PUT', `${playerURL}/pause`, contentTypeUrl, { token }),
  next: token =>
    spotify('POST', `${playerURL}/next`, contentTypeUrl, { token }),
  previous: token =>
    spotify('POST', `${playerURL}/previous`, contentTypeUrl, { token }),
  devices: token =>
    spotify('GET', `${playerURL}/devices`, contentTypeUrl, { token })
}

const setDelay = delay =>
  new Promise(success => {
    setTimeout(success, delay)
  })

module.exports = async (req, res) => {
  console.log('=== PLAYER ===')

  const parsedUrl = new URL(`http://placeholder${req.url}`)
  const accessToken = parsedUrl.searchParams.get('access_token')
  const action = parsedUrl.searchParams.get('action')
  const deviceId = parsedUrl.searchParams.get('device_id')
  const trackUri = parsedUrl.searchParams.get('track_uri')
  res.setHeader('Content-Type', 'application/json')
  try {
    if (accessToken) {
      console.log({ accessToken })
      console.log({ action })

      if (action) {
        if (
          deviceId &&
          (action === 'play_with_device' || action === 'transfer')
        )
          await player[action](`Bearer ${accessToken}`, deviceId)
        else if (trackUri && action === 'play_with_uri') {
          await player[action](`Bearer ${accessToken}`, trackUri)
        } else {
          await player[action](`Bearer ${accessToken}`)
        }

        await setDelay(250)
      }

      const response = await spotify('GET', playerURL, contentTypeJson, {
        token: `Bearer ${accessToken}`
      })
      console.log({ response })

      res.end(JSON.stringify(response))
    }
  } catch (err) {
    console.dir(err)
    res.statusCode = 500
    res.end(JSON.stringify({ error: err.message }))
  }
}
