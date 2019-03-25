console.log('index.js')
console.log(Number(localStorage.setAt), Number(localStorage.expiresIn) * 1000)

const displayUserInformations = () => {
  console.log(localStorage.displayName, localStorage.avatarUrl)

  // const displayNameElement = document.getElementById('display-name')
  // displayNameElement.textContent = localStorage.displayName

  const avatar = document.getElementById('avatar')
  avatar.style.backgroundImage = `url(${localStorage.avatarUrl})`
}

const displayPlayerInformations = playerInformations => {
  console.log(playerInformations)

  const deviceBlock = document.getElementById('device')
  deviceBlock.textContent = `Listening on ${playerInformations.device.name}`

  const artistsBlock = document.getElementById('artists')
  const artists = playerInformations.item.artists.map(artist => artist.name)
  artistsBlock.textContent = artists.join(', ')

  const nameBlock = document.getElementById('name')
  nameBlock.textContent = playerInformations.item.name

  const trackCoverUrl = playerInformations.item.album.images[0]
    ? playerInformations.item.album.images[0].url
    : ''
  const trackCover = document.getElementById('track-cover')
  trackCover.src = trackCoverUrl

  const playPauseIcon = document.getElementById('play-pause')
  if (playerInformations.is_playing) {
    playPauseIcon.classList.remove('paused')
    playPauseIcon.classList.add('playing')
    playPauseIcon.onclick = () => {
      fetch(`/api/spotify/player?access_token=${token}&action=pause`)
        .then(response => {
          return response.json()
        })
        .then(playerInformations => {
          displayPlayerInformations(playerInformations)
        })
        .catch(console.error)
    }
  } else {
    playPauseIcon.classList.remove('playing')
    playPauseIcon.classList.add('paused')
    playPauseIcon.onclick = () => {
      fetch(`/api/spotify/player?access_token=${token}&action=play`)
        .then(response => {
          return response.json()
        })
        .then(playerInformations => {
          displayPlayerInformations(playerInformations)
        })
        .catch(console.error)
    }
  }
  document.getElementById('prev').onclick = () => {
    fetch(`/api/spotify/player?access_token=${token}&action=previous`)
      .then(response => {
        return response.json()
      })
      .then(playerInformations => {
        displayPlayerInformations(playerInformations)
      })
      .catch(console.error)
  }
  document.getElementById('next').onclick = () => {
    fetch(`/api/spotify/player?access_token=${token}&action=next`)
      .then(response => {
        return response.json()
      })
      .then(playerInformations => {
        displayPlayerInformations(playerInformations)
      })
      .catch(console.error)
  }
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
const callAuth = url => {
  fetch(url)
    .then(response => {
      const url = new URL(response.url)
      const accessToken = url.searchParams.get('access_token')
      const refreshToken = url.searchParams.get('refresh_token')
      const setAt = url.searchParams.get('set_at')
      const expiresIn = url.searchParams.get('expires_in')
      const displayName = url.searchParams.get('display_name')
      const avatarUrl = url.searchParams.get('avatar_url')
      accessToken && (localStorage.token = accessToken)
      refreshToken && (localStorage.refreshToken = refreshToken)
      expiresIn && (localStorage.expiresIn = expiresIn)
      avatarUrl && (localStorage.avatarUrl = avatarUrl)
      displayName && (localStorage.displayName = displayName)
      localStorage.setAt = setAt
      window.location = '/'
    })
    .catch(console.error)
}

if (searchParams.get('code')) {
  // We have a code, so we call our API to get a Token
  console.log('Fetch token')

  if (localStorage.state === searchParams.get('state')) {
    const url = `/api/spotify/auth?${searchParams}&redirect_uri=${redirect_uri}`
    callAuth(url)
  }
} else if (!token) {
  // No token we fetch spotify to get a code
  console.log('No token')

  const accountURL = 'https://accounts.spotify.com'
  const clientId = '4f8480235baf45c4974e35137a331e38'
  const scopes =
    'user-read-email user-read-private user-read-playback-state user-modify-playback-state playlist-read-private playlist-modify-public playlist-modify-private playlist-read-collaborative'
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
} else if (
  Number(localStorage.setAt) + Number(localStorage.expiresIn) * 1000 <=
  Date.now()
) {
  // Our Token expired, we ask a new one
  console.log('Token expired')

  const url = `/api/spotify/auth?refresh_token=${
    localStorage.refreshToken
  }&redirect_uri=${redirect_uri}`
  callAuth(url)
} else {
  // We Fetch the playlists
  console.log('Fetch playlists')

  displayUserInformations()

  fetch(`/api/spotify/player?access_token=${token}`)
    .then(response => {
      return response.json()
    })
    .then(playerInformations => {
      displayPlayerInformations(playerInformations)
    })
    .catch(console.error)

  fetch(`/api/spotify/playlists?access_token=${token}`)
    .then(response => {
      return response.json()
    })
    .then(playlists =>
      displayPlaylist(addNbTracks(playlists.flat(), 'nbTracks').sort(compare))
    )
    .catch(console.error)
}
