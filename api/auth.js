const { URL, URLSearchParams } = require('url')
const spotify = require('./spotify.js')

const clientId = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET
const toBase64 = str => Buffer.from(str).toString('base64')
const appToken = `Basic ${toBase64(`${clientId}:${clientSecret}`)}`
const accountURL = 'https://accounts.spotify.com'
const userURL = 'https://api.spotify.com/v1/me'
const contentTypeUrl = 'application/x-www-form-urlencoded'
const contentTypeJson = 'application/json'

const getAccessToken = async (body, redirectUri, res) => {
  const tokenResponse = await spotify(
    'POST',
    `${accountURL}/api/token`,
    contentTypeUrl,
    {
      body,
      token: appToken
    }
  ).catch(error => console.dir(error))
  console.log({
    tokenResponse
  })

  const accessToken = tokenResponse.access_token
  const refreshToken = tokenResponse.refresh_token
  const expiresIn = tokenResponse.expires_in

  const userResponse = await spotify('GET', userURL, contentTypeJson, {
    token: `Bearer ${accessToken}`
  }).catch(console.error)
  console.log(userResponse)
  const displayName = userResponse.display_name
  const avatarUrl =
    userResponse.images && userResponse.images.length > 0
      ? userResponse.images[0].url
      : `https://joeschmoe.io/api/v1/${new URLSearchParams(
          displayName
        ).toString()}` // Thx for https://joeschmoe.io/

  await res.writeHead(302, {
    Location: `${redirectUri}?access_token=${accessToken}&refresh_token=${refreshToken}&expires_in=${expiresIn}&set_at=${Date.now()}&display_name=${displayName}&avatar_url=${avatarUrl}`
  })
  res.end('OK')
}

module.exports = async (req, res) => {
  console.log('=== AUTH ===')

  const parsedUrl = new URL(`http://placeholder${req.url}`)
  const code = parsedUrl.searchParams.get('code')
  const refreshToken = parsedUrl.searchParams.get('refresh_token')
  const redirectUri = parsedUrl.searchParams.get('redirect_uri')

  if (code) {
    console.log({ code })

    await getAccessToken(
      {
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      },
      redirectUri,
      res
    )
  } else if (refreshToken) {
    console.log({ refreshToken })

    await getAccessToken(
      {
        refresh_token: refreshToken,
        grant_type: 'refresh_token'
      },
      redirectUri,
      res
    )
  }
  res.end('OK')
}
