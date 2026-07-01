import {
  SportsCatalogMarket,
  SportsCatalogSportItem,
  SportsCatalogTeam,
  SportsCatalogTournament,
} from '@/types/sportsCatalog.types';

export const DUMMY_SPORT_ITEMS: SportsCatalogSportItem[] = [
  {
    id: 'sweet-bonanza',
    name: 'Sweet Bonanza',
  },
  {
    id: 'gates-of-olympus',
    name: 'Gates of Olympus',
  },
  {
    id: 'dragon-tiger',
    name: 'Dragon Tiger',
  },
  {
    id: 'lucky-neko',
    name: 'Lucky Neko',
  },
  {
    id: 'blackjack-vip',
    name: 'Blackjack VIP',
  },
  {
    id: 'roulette-pro',
    name: 'Roulette Pro',
  },
  {
    id: 'aztec-gems',
    name: 'Aztec Gems',
  },
  {
    id: 'wolf-gold',
    name: 'Wolf Gold',
  },
  {
    id: 'lightning-roulette',
    name: 'Lightning Roulette',
  },
  {
    id: 'fortune-tiger',
    name: 'Fortune Tiger',
  },
  {
    id: 'mega-ball',
    name: 'Mega Ball',
  },
  {
    id: 'starlight-princess',
    name: 'Starlight Princess',
  },
];

export const DUMMY_TEAMS: SportsCatalogTeam[] = [
  { id: 'slots', name: 'Slots', sport: 'cricket', tournament: 'oneday' },
  { id: 'slots', name: 'Slots', sport: 'cricket', tournament: 't20' },
  { id: 'slots', name: 'Slots', sport: 'cricket', tournament: 't20' },
  { id: 'slots', name: 'Slots', sport: 'cricket', tournament: 'test' },
  { id: 'slots', name: 'Slots', sport: 'cricket', tournament: 'oneday' },
];

export const DUMMY_TOURNAMENTS: SportsCatalogTournament[] = [
  { id: 'pragmatic-play', name: 'PragmaticPlay' },
  { id: 'red-tiger', name: 'RedTiger' },
  { id: 'ka-gaming', name: 'KAGaming' },
  { id: 'evolution', name: 'Evolution Gaming' },
  { id: 'netent', name: 'NetEnt' },
];
export const DUMMY_MARKETS: SportsCatalogMarket[] = [
  { id: 'pragmatic-play', name: 'PragmaticPlay' },
  { id: 'red-tiger', name: 'RedTiger' },
  { id: 'ka-gaming', name: 'KAGaming' },
  { id: 'evolution', name: 'Evolution Gaming' },
  { id: 'netent', name: 'NetEnt' },
];
