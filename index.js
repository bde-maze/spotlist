console.log('index.js')

const displayUserInformations = () => {
  console.log(localStorage.display_name, localStorage.avatarUrl)

  const displayNameElement = document.getElementById('display-name')
  displayNameElement.textContent = localStorage.display_name

  const avatar = document.getElementById('avatar')
  avatar.style.backgroundImage = `url(${localStorage.avatarUrl})`
}

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
    nbTracksBlock.textContent = `${nbTracks} songs`
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
  // We have a code, so we call our API to get a Token
  console.log('Fetch token')

  if (localStorage.state === searchParams.get('state')) {
    fetch(
      `/api/spotify/auth?${searchParams}&redirect_uri=${redirect_uri}`
    ).then(response => {
      const url = new URL(response.url)
      const access_token = url.searchParams.get('access_token')
      const refresh_token = url.searchParams.get('refresh_token')
      const display_name = url.searchParams.get('display_name')
      const avatarUrl = url.searchParams.get('avatarUrl')
      access_token && (localStorage.token = access_token)
      refresh_token && (localStorage.refresh_token = refresh_token)
      avatarUrl && (localStorage.avatarUrl = avatarUrl)
      display_name && (localStorage.display_name = display_name)
      localStorage.setAt = Date.now()
      window.location = '/'
    })
  }
} else if (!token) {
  // No token we fetch spotify to get a code
  console.log('No token')

  const accountURL = 'https://accounts.spotify.com'
  const clientId = '4f8480235baf45c4974e35137a331e38'
  const scopes =
    'user-read-email user-read-private playlist-read-private playlist-modify-public playlist-modify-private playlist-read-collaborative'
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
  // Our Token expired, we ask a new one
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
  // We Fetch the playlists
  console.log('Fetch playlists')

  displayUserInformations()

  fetch(`/api/spotify/playlists?access_token=${token}`)
    .then(response => {
      return response.json()
    })
    .then(playlists =>
      displayPlaylist(addNbTracks(playlists.flat(), 'nbTracks').sort(compare))
    )
    .catch(console.error)
}
