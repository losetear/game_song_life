// === 动物模板 ===

export const ANIMAL_TYPES = [
  { type: 'chicken', name: '鸡', speed: 1 },
  { type: 'pig', name: '猪', speed: 1 },
  { type: 'cow', name: '牛', speed: 1 },
  { type: 'deer', name: '鹿', speed: 3 },
  { type: 'rabbit', name: '兔', speed: 4 },
  { type: 'fox', name: '狐', speed: 3 },
  { type: 'boar', name: '野猪', speed: 2 },
  { type: 'wolf', name: '狼', speed: 3 },
  { type: 'bird', name: '鸟', speed: 5 },
  { type: 'fish', name: '鱼', speed: 2 },
];

export function getAnimalType(isWild: boolean): typeof ANIMAL_TYPES[number] {
  const pool = isWild
    ? ANIMAL_TYPES.filter(a => ['deer', 'rabbit', 'fox', 'boar', 'wolf', 'bird'].includes(a.type))
    : ANIMAL_TYPES.filter(a => ['chicken', 'pig', 'cow'].includes(a.type));
  return pool[Math.floor(Math.random() * pool.length)];
}
