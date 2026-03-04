const ADJECTIVES = [
  'Swift', 'Bold', 'Calm', 'Daring', 'Epic', 'Fierce', 'Gentle', 'Happy',
  'Iron', 'Jolly', 'Keen', 'Lucky', 'Mystic', 'Noble', 'Plucky', 'Quick',
  'Royal', 'Sharp', 'Tidy', 'Ultra', 'Vivid', 'Witty', 'Zesty', 'Bright',
  'Cool', 'Deft', 'Elite', 'Fast', 'Grand', 'Hot',
]

const NOUNS = [
  'Panda', 'Eagle', 'Fox', 'Tiger', 'Hawk', 'Wolf', 'Bear', 'Lion',
  'Otter', 'Raven', 'Falcon', 'Shark', 'Cobra', 'Lynx', 'Moose', 'Owl',
  'Phoenix', 'Dragon', 'Badger', 'Crane', 'Dolphin', 'Elk', 'Gecko',
  'Husky', 'Jaguar', 'Koala', 'Lemur', 'Manta', 'Newt', 'Osprey',
]

const COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4',
  '#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#14b8a6',
  '#6366f1', '#a855f7', '#d946ef', '#0ea5e9', '#10b981',
]

const STORAGE_KEY = 'nexus-guest-name'
const COLOR_KEY = 'nexus-guest-color'

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function getGuestName(): string {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) return stored
  const name = `${randomPick(ADJECTIVES)} ${randomPick(NOUNS)}`
  localStorage.setItem(STORAGE_KEY, name)
  return name
}

export function getGuestColor(): string {
  const stored = localStorage.getItem(COLOR_KEY)
  if (stored) return stored
  const color = randomPick(COLORS)
  localStorage.setItem(COLOR_KEY, color)
  return color
}
