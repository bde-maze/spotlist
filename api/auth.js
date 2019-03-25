const { URL } = require('url')
const spotify = require('./spotify.js')

const clientId = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET
const toBase64 = str => Buffer.from(str).toString('base64')
const appToken = `Basic ${toBase64(`${clientId}:${clientSecret}`)}`
const accountURL = 'https://accounts.spotify.com'
const userURL = 'https://api.spotify.com/v1/me'
const contentTypeUrl = 'application/x-www-form-urlencoded'
const contentTypeJson = 'application/json'

const getAccessToken = async (body, redirect_uri, res) => {
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

  const access_token = tokenResponse.access_token
  const refresh_token = tokenResponse.refresh_token

  const userResponse = await spotify('GET', userURL, contentTypeJson, {
    token: `Bearer ${access_token}`
  }).catch(console.error)
  const display_name = userResponse.display_name
  const avatarUrl = userResponse.images
    ? userResponse.images[0].url
    : `https://joeschmoe.io/api/v1/${display_name}` // Thx for https://joeschmoe.io/
  console.log(userResponse)

  await res.writeHead(302, {
    Location: `${redirect_uri}?access_token=${access_token}&refresh_token=${refresh_token}&display_name=${display_name}&avatarUrl=${avatarUrl}`
  })
  res.end('OK')
}

module.exports = async (req, res) => {
  console.log('=== AUTH ===')

  const parsedUrl = new URL(`http://placeholder${req.url}`)
  const code = parsedUrl.searchParams.get('code')
  const refresh_token = parsedUrl.searchParams.get('refresh_token')
  const redirect_uri = parsedUrl.searchParams.get('redirect_uri')

  if (code) {
    console.log({ code })

    await getAccessToken(
      { code: code, redirect_uri, grant_type: 'authorization_code' },
      redirect_uri,
      res
    )
  } else if (refresh_token) {
    console.log({ refresh_token })

    await getAccessToken(
      {
        refresh_token: refresh_token,
        grant_type: 'refresh_token'
      },
      redirect_uri,
      res
    )
  }
  res.end('OK')
}
