export interface NpcTemplate {
  name: string;
  profession: string;
  age: number;
  personality: string[];
  defaultLocation: string;  // 默认所在地点（日程用）
  dayLocation: string;      // 白天工作地点
  hunger: number;
  fatigue: number;
  health: number;
  mood: number;
  copper: number;
}

const NAMES_MALE = [
  '张铁柱', '李大壮', '王文远', '赵秀才', '孙福来',
  '周德胜', '吴守义', '郑老三', '钱大有', '陈世安',
  '刘铁匠', '杨木匠', '马千里', '黄药师', '何老实',
  '林石匠', '高掌柜', '许屠户', '韩书生', '朱老六',
];

const NAMES_FEMALE = [
  '王婆子', '李秀娘', '张翠花', '赵小妹', '孙大婶',
  '周巧儿', '吴三娘', '钱娘子', '陈寡妇', '刘婆婆',
];

const NAMES_COMMON = [
  '慧明', '法空', '宋捕头', '秦班头', '柳掌柜',
  '方老板', '白掌柜', '曹大官', '贾秀才', '范老汉',
];

const PROFESSIONS: { profession: string; dayLocation: string; defaultLocation: string }[] = [
  { profession: '农夫', dayLocation: 'farmland', defaultLocation: 'residential' },
  { profession: '商贩', dayLocation: 'market', defaultLocation: 'residential' },
  { profession: '郎中', dayLocation: 'clinic', defaultLocation: 'residential' },
  { profession: '铁匠', dayLocation: 'workshop', defaultLocation: 'workshop' },
  { profession: '木匠', dayLocation: 'workshop', defaultLocation: 'residential' },
  { profession: '书生', dayLocation: 'street', defaultLocation: 'residential' },
  { profession: '渔民', dayLocation: 'dock', defaultLocation: 'residential' },
  { profession: '屠户', dayLocation: 'market', defaultLocation: 'residential' },
  { profession: '茶馆老板', dayLocation: 'teahouse', defaultLocation: 'teahouse' },
  { profession: '僧人', dayLocation: 'street', defaultLocation: 'street' },
  { profession: '捕快', dayLocation: 'street', defaultLocation: 'residential' },
  { profession: '猎户', dayLocation: 'mountain', defaultLocation: 'residential' },
  { profession: '掌柜', dayLocation: 'market', defaultLocation: 'residential' },
  { profession: '农夫', dayLocation: 'farmland', defaultLocation: 'residential' },
  { profession: '绣娘', dayLocation: 'residential', defaultLocation: 'residential' },
];

const PERSONALITY_POOL = [
  ['勤劳', '质朴'],
  ['精明', '健谈'],
  ['善良', '温和'],
  ['正直', '严肃'],
  ['豪爽', '义气'],
  ['胆小', '谨慎'],
  ['贪婪', '狡猾'],
  ['乐观', '开朗'],
  ['沉默', '内敛'],
  ['暴躁', '直率'],
  ['清高', '孤傲'],
  ['机灵', '活泼'],
  ['坚韧', '忍耐'],
  ['慈祥', '耐心'],
  ['阴沉', '多疑'],
];

function makeNpc(
  name: string,
  prof: { profession: string; dayLocation: string; defaultLocation: string },
  personality: string[],
  rng: { next: () => number },
): NpcTemplate {
  return {
    name,
    profession: prof.profession,
    age: 20 + Math.floor(rng.next() * 40),
    personality,
    defaultLocation: prof.defaultLocation,
    dayLocation: prof.dayLocation,
    hunger: 60 + Math.floor(rng.next() * 30),
    fatigue: 50 + Math.floor(rng.next() * 30),
    health: 70 + Math.floor(rng.next() * 30),
    mood: 50 + Math.floor(rng.next() * 30),
    copper: Math.floor(rng.next() * 150) + 20,
  };
}

/** 生成50个NPC模板（确定性，基于种子） */
export function generateNpcTemplates(rng: { next: () => number }): NpcTemplate[] {
  const allNames = [...NAMES_MALE, ...NAMES_FEMALE, ...NAMES_COMMON];
  const npcs: NpcTemplate[] = [];

  for (let i = 0; i < 50; i++) {
    const name = allNames[i % allNames.length]!;
    const prof = PROFESSIONS[i % PROFESSIONS.length]!;
    const personality = PERSONALITY_POOL[i % PERSONALITY_POOL.length]!;
    npcs.push(makeNpc(name, prof, personality, rng));
  }

  return npcs;
}
