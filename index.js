console.log('index.js')
console.log(Number(localStorage.setAt), Number(localStorage.expiresIn) * 1000)

const isMobileDevice = () => {
  return (
    typeof window.orientation !== 'undefined' ||
    navigator.userAgent.indexOf('IEMobile') !== -1
  )
}

const displayUserInformations = () => {
  console.log(localStorage.displayName, localStorage.avatarUrl)

  // const displayNameElement = document.getElementById('display-name')
  // displayNameElement.textContent = localStorage.displayName

  const avatar = document.getElementById('avatar')
  avatar.style.backgroundImage = `url(${localStorage.avatarUrl})`

  if (localStorage.plan !== 'premium') {
    document.getElementById('premium-banner').style.display = 'block'
  }
  if (isMobileDevice()) {
    document.getElementById('mobile-banner').style.display = 'block'
  }
}

window.onSpotifyWebPlaybackSDKReady = () => {
  const token = localStorage.token
  if (token) {
    const player = new Spotify.Player({
      name: 'Spotlist Web Player',
      getOAuthToken: callback => {
        callback(token)
      }
    })

    // Error handling
    player.addListener('initialization_error', ({ message }) => {
      console.error(message)
    })
    player.addListener('authentication_error', ({ message }) => {
      console.error(message)
    })
    player.addListener('account_error', ({ message }) => {
      console.error(message)
    })
    player.addListener('playback_error', ({ message }) => {
      console.error(message)
    })

    // Playback status updates
    player.addListener('player_state_changed', state => {
      if (
        Number(localStorage.setAt) + Number(localStorage.expiresIn) * 1000 <=
        Date.now()
      ) {
        // Our Token expired, we ask a new one
        refreshToken()
      }
      console.log('player_state_changed', { state })
      displayTrackInformations(state.track_window.current_track)
      playerController(player, state)
    })

    // Ready
    player.addListener('ready', res => {
      console.log('Ready with Device ID', res.device_id)
      transferDevice(res.device_id)
      playerController(player)
    })

    // Not Ready
    player.addListener('not_ready', ({ deviceId }) => {
      console.log('Device ID has gone offline', deviceId)
    })

    // Connect to the player!
    player.connect()
  }
}

const playerController = async (player, state) => {
  console.log('Player Controller')
  const playPauseIcon = document.getElementById('play-pause')
  state || (await player.getCurrentState())
  console.log({ state })

  if (!state) {
    console.warn('Nothing playing through Spotlist')
    playPauseIcon.onclick = () => {
      player.resume()
    }
    return
  } else if (state.paused) {
    console.log('Paused')
    playPauseIcon.classList.remove('playing')
    playPauseIcon.classList.add('paused')
    playPauseIcon.onclick = () => {
      player.resume()
    }
  } else {
    console.log('Playing')
    playPauseIcon.classList.remove('paused')
    playPauseIcon.classList.add('playing')
    playPauseIcon.onclick = () => {
      player.pause()
    }
  }
  document.getElementById('prev').onclick = () => {
    player.previousTrack()
  }
  document.getElementById('next').onclick = () => {
    player.nextTrack()
  }
}

const transferDevice = deviceId => {
  fetch(
    `/api/spotify/player?access_token=${
      localStorage.token
    }&action=transfer&device_id=${deviceId}`
  ).catch(console.error)
}

const checkUserSavedTrack = async trackId => {
  return await fetch(
    `/api/spotify/tracks?access_token=${
      localStorage.token
    }&action=contains&track_id=${trackId}`
  )
    .then(response => {
      return response.json()
    })
    .catch(console.error)
}

const saveTrack = async trackId => {
  return await fetch(
    `/api/spotify/tracks?access_token=${
      localStorage.token
    }&action=save&track_id=${trackId}`
  )
    .then(response => {
      return response.json()
    })
    .catch(console.error)
}

const unsaveTrack = async trackId => {
  return await fetch(
    `/api/spotify/tracks?access_token=${
      localStorage.token
    }&action=remove&track_id=${trackId}`
  )
    .then(response => {
      return response.json()
    })
    .catch(console.error)
}

const playRandomTrack = () => {
  console.log('Play random track')
  fetch(
    `/api/spotify/discover?access_token=${
      localStorage.token
    }&action=random_track`
  )
    .then(async response => {
      const data = await response.json()
      console.log({ data })
      const tracks = data.tracks && data.tracks
      const uris = tracks.map(track => track.uri)
      fetch(
        `/api/spotify/player?access_token=${
          localStorage.token
        }&action=play_with_uri&track_uris=${uris}`
      ).catch(console.error)
      return data
    })
    .catch(console.error)
}

const displayTrackInformations = async trackInformations => {
  console.log({ trackInformations })
  const nameElem = document.getElementById('name')
  if (trackInformations) {
    const libraryStateBlock = document.getElementById('library-state')
    const isSaved = await checkUserSavedTrack(trackInformations.id)
    if (isSaved && isSaved[0]) {
      libraryStateBlock.classList.remove('to-save')
      libraryStateBlock.classList.add('saved')
      libraryStateBlock.onclick = () => {
        libraryStateBlock.classList.remove('saved')
        libraryStateBlock.classList.add('to-save')
        unsaveTrack(trackInformations.id)
      }
    } else {
      libraryStateBlock.classList.remove('saved')
      libraryStateBlock.classList.add('to-save')
      libraryStateBlock.onclick = () => {
        libraryStateBlock.classList.remove('to-save')
        libraryStateBlock.classList.add('saved')
        saveTrack(trackInformations.id)
      }
    }

    const artistsBlock = document.getElementById('artists')
    const artists = trackInformations.artists.map((artist, index) => {
      const link = document.createElement('a')
      link.textContent =
        index + 1 < trackInformations.artists.length
          ? `${artist.name}, `
          : artist.name
      link.setAttribute('target', '_blank')
      link.setAttribute(
        'href',
        `https://open.spotify.com/artist/${artist.uri.split(':')[2]}`
      )
      return link
    })
    artistsBlock.innerHTML = ''
    for (const artistLink of artists) {
      artistsBlock.appendChild(artistLink)
    }

    nameElem.textContent = trackInformations.name
    nameElem.setAttribute(
      'href',
      `https://open.spotify.com/track/${trackInformations.uri.split(':')[2]}`
    )

    const trackCoverUrl = trackInformations.album.images[0]
      ? trackInformations.album.images[0].url
      : ''
    const trackCover = document.getElementById('track-cover')
    trackCover.src = trackCoverUrl
  } else {
    nameElem.textContent = 'Nothing playing'
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
  console.dir(playlists)
  const playlistContainer = document.getElementById('playlists')

  for (const playlist of playlists) {
    const name = playlist.name
    const url = playlist.external_urls.spotify
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

    const nameBlock = document.createElement('a')
    nameBlock.classList.add('name')

    const nbTracksBlock = document.createElement('p')
    nbTracksBlock.classList.add('nbTracks')

    nameBlock.textContent = name
    nameBlock.href = url
    nameBlock.target = '_blank'
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
      const plan = url.searchParams.get('plan')
      const avatarUrl = url.searchParams.get('avatar_url')
      accessToken && (localStorage.token = accessToken)
      refreshToken && (localStorage.refreshToken = refreshToken)
      expiresIn && (localStorage.expiresIn = expiresIn)
      avatarUrl && (localStorage.avatarUrl = avatarUrl)
      displayName && (localStorage.displayName = displayName)
      plan && (localStorage.plan = plan)
      localStorage.setAt = setAt
      window.location = '/'
    })
    .catch(console.error)
}

const fetchSpotifyCode = () => {
  console.log('No token')

  const accountURL = 'https://accounts.spotify.com'
  const clientId = '4f8480235baf45c4974e35137a331e38'
  const scopes =
    'user-library-read user-library-modify streaming user-read-birthdate user-read-email user-read-private user-read-playback-state user-modify-playback-state playlist-read-private playlist-modify-public playlist-modify-private playlist-read-collaborative'
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
}

const fetchToken = () => {
  console.log('Fetch token')

  if (localStorage.state === searchParams.get('state')) {
    const url = `/api/spotify/auth?${searchParams}&redirect_uri=${redirect_uri}`
    callAuth(url)
  }
}

const refreshToken = () => {
  console.log('Token expired')

  const url = `/api/spotify/auth?refresh_token=${
    localStorage.refreshToken
  }&redirect_uri=${redirect_uri}`
  callAuth(url)
}

const fetchPlaylists = () => {
  console.log('Fetch playlists')

  displayUserInformations()

  fetch(`/api/spotify/playlists?access_token=${token}`)
    .then(response => {
      return response.json()
    })
    .then(
      playlists =>
        playlists &&
        displayPlaylist(addNbTracks(playlists.flat(), 'nbTracks').sort(compare))
    )
    .catch(console.error)
}

if (searchParams.get('code')) {
  // We have a code, so we call our API to get a Token
  fetchToken()
} else if (
  !token ||
  !localStorage.refreshToken ||
  localStorage.refreshToken === 'undefined'
) {
  // No token we fetch spotify to get a code
  fetchSpotifyCode()
} else if (
  Number(localStorage.setAt) + Number(localStorage.expiresIn) * 1000 <=
  Date.now()
) {
  // Our Token expired, we ask a new one
  refreshToken()
} else {
  // We Fetch the playlists
  fetchPlaylists()
}
