const ADJECTIVES = [
  'Silent', 'Brave', 'Clever', 'Swift', 'Gentle', 'Bold', 'Quiet', 'Curious', 'Bright', 'Calm',
  'Eager', 'Fierce', 'Jolly', 'Kind', 'Lively', 'Mighty', 'Noble', 'Proud', 'Quick', 'Rapid',
  'Sharp', 'Tidy', 'Vivid', 'Witty', 'Zesty', 'Amber', 'Coral', 'Golden', 'Iron', 'Jade',
  'Lunar', 'Misty', 'Nimble', 'Polar', 'Rustic', 'Solar', 'Urban', 'Velvet', 'Wild', 'Arctic',
  'Breezy', 'Cosmic', 'Dusty', 'Electric', 'Frosty', 'Hollow', 'Icy', 'Jazzy', 'Keen', 'Lucky',
  'Merry', 'Neon', 'Odd', 'Plucky', 'Quirky', 'Rusty', 'Sneaky', 'Tiny', 'Upbeat', 'Vintage'
]

const NOUNS = [
  'Falcon', 'Otter', 'Panda', 'Tiger', 'Wolf', 'Fox', 'Hawk', 'Bear', 'Eagle', 'Lynx',
  'Raven', 'Shark', 'Whale', 'Owl', 'Deer', 'Rabbit', 'Badger', 'Moose', 'Heron', 'Crane',
  'Robin', 'Sparrow', 'Comet', 'Meteor', 'Nebula', 'Galaxy', 'Planet', 'Rocket', 'Compass', 'Anchor',
  'Lantern', 'Beacon', 'Harbor', 'Canyon', 'Summit', 'Valley', 'Meadow', 'Forest', 'River', 'Boulder',
  'Pixel', 'Cipher', 'Circuit', 'Vector', 'Signal', 'Engine', 'Gadget', 'Widget', 'Toaster', 'Kettle',
  'Biscuit', 'Pretzel', 'Noodle', 'Pancake', 'Muffin', 'Walnut', 'Pepper', 'Ginger', 'Maple', 'Cactus'
]

export function generateRandomUsername(): string {
  const adjective = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const number = Math.floor(Math.random() * 9999) + 1
  return `${adjective}_${noun}${number}`
}
