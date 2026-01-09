import valorantLogo from './assets/valorant.png'
import genshinLogo from './assets/genshin.png'
import leagueLogo from './assets/league.png'
import royaleLogo from './assets/royale.png'

export const GAMES = {
  valorant: { key: 'valorant', name: 'Valorant', logo: valorantLogo },
  genshin: { key: 'genshin', name: 'Genshin Impact', logo: genshinLogo },
  league: { key: 'league', name: 'League of Legends', logo: leagueLogo },
  overwatch: { key: 'overwatch', name: 'Overwatch 2', logo: royaleLogo },
}

export const GAME_KEYS = Object.keys(GAMES)


