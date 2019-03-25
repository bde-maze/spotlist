const { URL } = require('url')
const spotify = require('./spotify.js')

const playerURL = 'https://api.spotify.com/v1/me/player'
const contentTypeJson = 'application/json'
const contentTypeUrl = 'application/x-www-form-urlencoded'

const player = {
  play: token => spotify('PUT', `${playerURL}/play`, contentTypeUrl, { token }),
  pause: token =>
    spotify('PUT', `${playerURL}/pause`, contentTypeUrl, { token }),
  next: token =>
    spotify('POST', `${playerURL}/next`, contentTypeUrl, { token }),
  previous: token =>
    spotify('POST', `${playerURL}/previous`, contentTypeUrl, { token })
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
  res.setHeader('Content-Type', 'application/json')
  try {
    if (accessToken) {
      console.log({ accessToken })

      if (action) {
        console.log({ action })
        await player[action](`Bearer ${accessToken}`)
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
