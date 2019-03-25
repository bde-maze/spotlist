const { parse, URLSearchParams } = require('url')
const { request } = require('https')

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

module.exports = (method, url, contentType, { token, body }) =>
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
