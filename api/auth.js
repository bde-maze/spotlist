const { URL } = require('url')
const spotify = require('./spotify.js')

const clientId = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET
const toBase64 = str => Buffer.from(str).toString('base64')
const appToken = `Basic ${toBase64(`${clientId}:${clientSecret}`)}`
const accountURL = 'https://accounts.spotify.com'
const contentTypeUrl = 'application/x-www-form-urlencoded'

const getAccessToken = async (body, redirect_uri, res) => {
  const response = await spotify(
    'POST',
    `${accountURL}/api/token`,
    contentTypeUrl,
    {
      body,
      token: appToken
    }
  ).catch(error => console.dir(error))
  console.log({ response })
  const access_token = response.access_token
  const refresh_token = response.refresh_token
  res.writeHead(302, {
    Location: `${redirect_uri}?access_token=${access_token}&refresh_token=${refresh_token}`
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
