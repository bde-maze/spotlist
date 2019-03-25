const { URL, parse, URLSearchParams } = require('url')
const { request } = require('https')

const clientId = process.env.CLIENT_ID
const clientSecret = process.env.CLIENT_SECRET
const toBase64 = str => Buffer.from(str).toString('base64')
const appToken = `Basic ${toBase64(`${clientId}:${clientSecret}`)}`
const accountURL = 'https://accounts.spotify.com'
const playlistURL = 'https://api.spotify.com/v1/me/playlists'
const contentTypeUrl = 'application/x-www-form-urlencoded'
const contentTypeJson = 'application/json'

const getBody = stream =>
  new Promise((s, f) => {
    const data = []

    stream.on('data', chunk => {
      data.push(chunk.toString('utf8'))
    })
    stream.on('error', f)
    stream.on('end', () => {
      try {
        return s(JSON.parse(data.join('')))
      } catch (err) {
        return s(data)
      }
    })
  })

const spotify = (method, url, contentType, { token, body }) =>
  new Promise((resolve, reject) => {
    const headers = { Authorization: token, 'content-type': contentType }
    request({ ...parse(url), method, headers }, response => {
      if (response.statusCode === 200) return resolve(getBody(response))
      if (response.statusCode === 204) return resolve(null)

      getBody(response)
        .then(({ error }) =>
          reject(
            Object.assign(Error(response.statusMessage), {
              url,
              method,
              headers,
              code: response.statusCode,
              requestBody: body,
              ...error
            })
          )
        )
        .catch(reject)
    })
      .on('error', reject)
      .end(body && new URLSearchParams(body).toString())
  })

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
  const parsedUrl = new URL(`http://placeholder${req.url}`)
  const code = parsedUrl.searchParams.get('code')
  const access_token = parsedUrl.searchParams.get('access_token')
  const refresh_token = parsedUrl.searchParams.get('refresh_token')
  const redirect_uri = parsedUrl.searchParams.get('redirect_uri')
  const playlists = []

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
  } else if (access_token) {
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
