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
  '沈万三', '傅红雪', '萧峰', '段誉', '令狐冲',
  '郭靖', '杨过', '张无忌', '乔峰', '虚竹',
];

const NAMES_FEMALE = [
  '王婆子', '李秀娘', '张翠花', '赵小妹', '孙大婶',
  '周巧儿', '吴三娘', '钱娘子', '陈寡妇', '刘婆婆',
  '林黛玉', '薛宝钗', '王熙凤', '史湘云', '贾元春',
  '秦可卿', '妙玉', '李纨', '巧姐', '小青',
  '白素贞', '穆念慈', '黄蓉', '小龙女', '赵敏',
];

const NAMES_COMMON = [
  '慧明', '法空', '宋捕头', '秦班头', '柳掌柜',
  '方老板', '白掌柜', '曹大官', '贾秀才', '范老汉',
  '柳如是', '顾横波', '陈圆圆', '董小宛', '李香君',
  '鱼玄机', '薛涛', '李师师', '梁红玉', '花木兰',
];

const PROFESSIONS: { profession: string; dayLocation: string; defaultLocation: string }[] = [
  // === 原有职业 ===
  { profession: '农夫', dayLocation: 'farmland', defaultLocation: 'residential' },
  { profession: '商贩', dayLocation: 'market', defaultLocation: 'residential' },
  { profession: '郎中', dayLocation: 'clinic', defaultLocation: 'residential' },
  { profession: '铁匠', dayLocation: 'workshop', defaultLocation: 'workshop' },
  { profession: '木匠', dayLocation: 'workshop', defaultLocation: 'residential' },
  { profession: '书生', dayLocation: 'academy', defaultLocation: 'residential' },
  { profession: '渔民', dayLocation: 'dock', defaultLocation: 'residential' },
  { profession: '屠户', dayLocation: 'market', defaultLocation: 'residential' },
  { profession: '茶馆老板', dayLocation: 'teahouse', defaultLocation: 'teahouse' },
  { profession: '僧人', dayLocation: 'temple', defaultLocation: 'temple' },
  { profession: '捕快', dayLocation: 'street', defaultLocation: 'residential' },
  { profession: '猎户', dayLocation: 'mountain', defaultLocation: 'residential' },
  { profession: '掌柜', dayLocation: 'market', defaultLocation: 'residential' },
  { profession: '绣娘', dayLocation: 'residential', defaultLocation: 'residential' },

  // === 新增职业 ===
  { profession: '武师', dayLocation: 'temple', defaultLocation: 'residential' },
  { profession: '镖师', dayLocation: 'street', defaultLocation: 'residential' },
  { profession: '优伶', dayLocation: 'brothel', defaultLocation: 'residential' },
  { profession: '画师', dayLocation: 'academy', defaultLocation: 'residential' },
  { profession: '乞丐', dayLocation: 'street', defaultLocation: 'street' },
  { profession: '赌徒', dayLocation: 'gambling_den', defaultLocation: 'gambling_den' },
  { profession: '琴师', dayLocation: 'brothel', defaultLocation: 'residential' },
  { profession: '诗人', dayLocation: 'riverside', defaultLocation: 'academy' },
  { profession: '船夫', dayLocation: 'dock', defaultLocation: 'dock' },
  { profession: '更夫', dayLocation: 'street', defaultLocation: 'residential' },
  { profession: '媒婆', dayLocation: 'residential', defaultLocation: 'residential' },
  { profession: '道士', dayLocation: 'temple', defaultLocation: 'mountain' },
  { profession: '酒保', dayLocation: 'brothel', defaultLocation: 'residential' },
  { profession: '裁缝', dayLocation: 'market', defaultLocation: 'residential' },
  { profession: '私塾先生', dayLocation: 'academy', defaultLocation: 'academy' },
  { profession: '牙婆', dayLocation: 'brothel', defaultLocation: 'residential' },
  { profession: '仵作', dayLocation: 'government_office', defaultLocation: 'residential' },
  { profession: '游医', dayLocation: 'street', defaultLocation: 'residential' },
  { profession: '镖头', dayLocation: 'street', defaultLocation: 'residential' },
  { profession: '歌女', dayLocation: 'brothel', defaultLocation: 'brothel' },
];

const PERSONALITY_POOL = [
  // === 原有性格组合 ===
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

  // === 新增性格组合 ===
  ['害羞', '温柔'],
  ['风流', '多情'],
  ['冷峻', '寡言'],
  ['狂放', '不羁'],
  ['圆滑', '世故'],
  ['刚烈', '倔强'],
  ['聪慧', '冷静'],
  ['忠厚', '老实'],
  ['妩媚', '妖娆'],
  ['儒雅', '温润'],
  ['阴险', '毒辣'],
  ['侠义', '热血'],
  ['淡泊', '超脱'],
  ['敏感', '细腻'],
  ['傲慢', '自负'],
  ['神秘', '莫测'],
  ['热情', '奔放'],
  ['忧郁', '多愁'],
  ['顽皮', '淘气'],
  ['威严', '霸气'],
];

/** 背景故事池 — 为NPC增加叙事深度，可供场景/交互系统引用 */
export const BACKGROUND_POOL: string[] = [
  '祖上三代都是种地的，到了这一辈才进城谋生。',
  '年轻时走南闯北，见过不少世面，如今只想安稳度日。',
  '曾读过几年书，科举落榜后便断了念想，做起了小买卖。',
  '家乡遭了灾，一个人逃到汴京，举目无亲。',
  '父母早亡，跟着师父学了一门手艺，如今独自闯荡。',
  '年轻时貌美如花，追求者无数，如今韶华不再，开了间小店。',
  '曾在边关当过几年兵，退伍后回到故乡，不想再提往事。',
  '据说和城里的某位大人物沾亲带故，但从不主动提起。',
  '外乡人，操着一口难懂的方言，在汴京已住了五六年。',
  '以前是富家子弟，家道中落后不得不自食其力。',
  '有个远嫁的姐姐在京城大户人家做妾，偶尔能帮衬一二。',
  '年轻时被人骗过一大笔钱，从此对谁都留了个心眼。',
  '据传会些拳脚功夫，但从不轻易出手露馅。',
  '膝下无子，把徒弟当亲生儿子一般看待。',
  '丧偶多年，一直未再娶/嫁，街坊都说是个痴情种。',
  '年轻时在樊楼唱过曲儿，后来从了良，嫁给了老实人。',
  '据说认识几个江湖上的朋友，来路不明。',
  '每逢月圆之夜便关起门来不知在做些什么。',
  '对医药颇有研究，闲时也给人看看病，分文不取。',
  '曾是宫中的乐师，因得罪权贵被逐出京城，隐姓埋名来到汴京。',
  '家里养了几十只鸽子，说是用来传递消息的，没人信。',
  '每到傍晚就坐在门口发呆，不知在想什么人。',
  '据说在南方还有一处宅子和几亩良田，只是不愿回去。',
  '年轻时救过一位大人物的命，对方送了一块玉佩做信物。',
  '逢人便说自己见过龙，没人信，但他信誓旦旦。',
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
    age: 18 + Math.floor(rng.next() * 50),
    personality,
    defaultLocation: prof.defaultLocation,
    dayLocation: prof.dayLocation,
    hunger: 50 + Math.floor(rng.next() * 40),
    fatigue: 40 + Math.floor(rng.next() * 40),
    health: 60 + Math.floor(rng.next() * 35),
    mood: 45 + Math.floor(rng.next() * 35),
    copper: Math.floor(rng.next() * 200) + 10,
  };
}

/** 生成80个NPC模板（确定性，基于种子） */
export function generateNpcTemplates(rng: { next: () => number }): NpcTemplate[] {
  const allNames = [...NAMES_MALE, ...NAMES_FEMALE, ...NAMES_COMMON];
  const npcs: NpcTemplate[] = [];

  for (let i = 0; i < 80; i++) {
    const name = allNames[i % allNames.length]!;
    const prof = PROFESSIONS[i % PROFESSIONS.length]!;
    const personality = PERSONALITY_POOL[i % PERSONALITY_POOL.length]!;
    npcs.push(makeNpc(name, prof, personality, rng));
  }

  return npcs;
}
