console.log('index.js')

const compare = (a, b) => {
  if (a.nbTracks < b.nbTracks) return -1
  if (a.nbTracks > b.nbTracks) return 1
  return 0
}

const addNbTracks = playlists =>
  playlists.map(playlist => {
    playlist.nbTracks = playlist.tracks.total
    return playlist
  })

const displayPlaylist = playlists => {
  console.log(playlists)
  const playlistContainer = document.getElementById('playlists')

  for (const playlist of playlists) {
    console.log(playlist)
    const name = playlist.name
    const cover = playlist.images[0] ? playlist.images[0].url : ''
    const nbTracks = playlist.nbTracks

    const playlistBlock = document.createElement('div')
    playlistBlock.classList.add('playlist')

    const coverContainerBlock = document.createElement('div')
    coverContainerBlock.classList.add('cover-container')

    const coverBlock = document.createElement('img')
    coverBlock.classList.add('cover')
    coverBlock.src = cover

    const infoBlock = document.createElement('div')
    infoBlock.classList.add('info')

    const nameBlock = document.createElement('p')
    nameBlock.classList.add('name')

    const nbTracksBlock = document.createElement('p')
    nbTracksBlock.classList.add('nbTracks')

    nameBlock.textContent = name
    nbTracksBlock.textContent = nbTracks
    infoBlock.appendChild(nameBlock)
    infoBlock.appendChild(nbTracksBlock)

    cover && coverContainerBlock.appendChild(coverBlock)
    playlistBlock.appendChild(coverContainerBlock)
    playlistBlock.appendChild(infoBlock)
    playlistContainer.appendChild(playlistBlock)
  }
}

const token = localStorage.token
const { searchParams, origin } = new URL(window.location)
const redirect_uri = origin
if (searchParams.get('code')) {
  console.log('Fetch token')
  if (localStorage.state === searchParams.get('state')) {
    fetch(`/api/spotify?${searchParams}&redirect_uri=${redirect_uri}`).then(
      response => {
        const url = new URL(response.url)
        const access_token = url.searchParams.get('access_token')
        const refresh_token = url.searchParams.get('refresh_token')
        access_token && (localStorage.token = access_token)
        refresh_token && (localStorage.refresh_token = refresh_token)
        localStorage.setAt = Date.now()
        window.location = '/'
      }
    )
  }
} else if (!token) {
  console.log('No token')
  const accountURL = 'https://accounts.spotify.com'
  const clientId = '4f8480235baf45c4974e35137a331e38'
  const scopes =
    'playlist-read-private playlist-modify-public playlist-modify-private playlist-read-collaborative'
  const state = Math.random()
    .toString(36)
    .slice(2)
  localStorage.state = state
  const url = `${accountURL}/authorize?${new URLSearchParams({
    redirect_uri,
    state: state,
    client_id: clientId,
    response_type: 'code',
    scope: scopes
  })}`
  window.location = url
} else if (Number(localStorage.setAt) + 3600000 <= Date.now()) {
  console.log('Token expired')
  fetch(
    `/api/spotify?refresh_token=${
      localStorage.refresh_token
    }&redirect_uri=${redirect_uri}`
  )
    .then(response => {
      const url = new URL(response.url)
      const access_token = url.searchParams.get('access_token')
      const refresh_token = url.searchParams.get('refresh_token')
      access_token && (localStorage.token = access_token)
      refresh_token && (localStorage.refresh_token = refresh_token)
      localStorage.setAt = Date.now()
      console.log(localStorage.setAt)
      window.location = '/'
    })
    .catch(console.error)
} else {
  console.log('Fetch playlists')
  fetch(`/api/spotify?access_token=${token}`)
    .then(response => {
      return response.json()
    })
    .then(playlists =>
      displayPlaylist(addNbTracks(playlists.flat(), 'nbTracks').sort(compare))
    )
    .catch(console.error)
}
