// === 环境叙事模板片段 ===
// 用于在没有匹配场景库时，基于真实环境生成丰富叙事

// 确定性选择：基于 seed 从数组中选一个
function pickBySeed(arr: string[], seed: number): string {
  return arr[Math.abs(seed) % arr.length];
}

// 简单 hash（用于确定性选择）
export function stableHash(...vals: (number | string)[]): number {
  let h = 0;
  for (const v of vals) {
    const s = String(v);
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
  }
  return Math.abs(h);
}

// ══════════════════════════════════════════
// 天气叙事
// ══════════════════════════════════════════

const WEATHER_NARRATIVES: Record<string, string[]> = {
  '晴': [
    '阳光从云层间洒落，照得青石板路一片明亮。',
    '日头正好，街上行人脚步轻快。',
    '天高云淡，远处的山影清晰可辨。',
    '碧空如洗，暖风拂面。',
    '日光明媚，檐下的灯笼在微风中轻晃。',
  ],
  '多云': [
    '天空中飘着几朵云，时阴时晴。',
    '云层时聚时散，光影在街面上交替变幻。',
    '薄云遮日，倒也不算闷热。',
    '云影从头顶掠过，街上的光景忽明忽暗。',
  ],
  '雨': [
    '细雨如丝，街上行人撑起了油纸伞。',
    '雨水顺着屋檐滴落，在青石板上溅起细碎的水花。',
    '雨势不大不小，街边檐下挤满了避雨的人。',
    '淅淅沥沥的雨声中，远处的叫卖声也变得模糊了。',
  ],
  '暴雨': [
    '暴雨倾盆，街上几乎看不到行人。',
    '大雨如注，排水沟里的水哗哗地流。',
    '雷声隆隆，雨点砸在瓦片上噼啪作响。',
    '天地间一片水幕，只能看清眼前几步远。',
  ],
  '雪': [
    '雪花纷纷扬扬，给屋顶铺上了一层薄白。',
    '寒风裹着细雪，街上的行人都缩着脖子。',
    '大地银装素裹，脚踩在雪上咯吱作响。',
  ],
  '雾': [
    '晨雾弥漫，街巷中一片朦胧。',
    '浓雾遮蔽了远处的景象，只听得见人声却看不清人影。',
  ],
};

// ══════════════════════════════════════════
// 时辰叙事
// ══════════════════════════════════════════

const TIME_NARRATIVES: Record<string, string[]> = {
  '子': ['夜深人静，只有更夫的梆子声偶尔响起。', '万籁俱寂，月光洒在空无一人的街上。'],
  '丑': ['丑时三刻，城中一片漆黑，唯有更夫提着灯笼走过。', '夜色浓重，远处偶尔传来几声犬吠。'],
  '寅': ['天边微微泛白，早起的公鸡开始打鸣。', '黎明前的黑暗，空气清冷而潮湿。'],
  '卯': ['晨光熹微，街上开始有人走动。', '天刚蒙蒙亮，卖早食的摊贩已经支起了棚子。'],
  '辰': ['辰时已到，街上的店铺陆续开了门。', '日上三竿，街上渐渐热闹起来。'],
  '巳': ['巳时将近正午，街上人来人往。', '阳光渐暖，集市上的吆喝声此起彼伏。'],
  '午': ['午后阳光正好，街上行人脚步慵懒。', '日头正毒，路边的茶摊坐满了歇脚的人。'],
  '未': ['未时，日头西斜，影子拉得长长的。', '午后的风带着些许倦意，街上的喧嚣渐渐平息。'],
  '申': ['申时，夕阳西照，把街面染成一片金黄。', '日薄西山，收摊的小贩开始打包货物。'],
  '酉': ['酉时，暮色四合，街上的灯笼次第亮起。', '天色渐暗，归家的人脚步匆匆。'],
  '戌': ['华灯初上，夜市的摊贩开始摆摊。', '戌时，夜色渐浓，灯火映照在青石板路上。'],
  '亥': ['亥时已深，夜市渐渐散去。', '更漏声声，街上行人寥寥。'],
};

// ══════════════════════════════════════════
// 地点叙事
// ══════════════════════════════════════════

const LOCATION_NARRATIVES: Record<string, string[]> = {
  'center_street': [
    '大街上人来人往，叫卖声不绝于耳。',
    '中心大街宽敞整洁，两旁店铺林立。',
    '街上行人如织，马蹄声和脚步声交织在一起。',
  ],
  'east_market': [
    '东市商贾云集，货物琳琅满目。',
    '集市上吆喝声此起彼伏，讨价还价声不断。',
    '东市的铺面一间挨着一间，招牌幌子随风飘动。',
  ],
  'dock': [
    '码头上船只往来，搬运工扛着麻包上下跳板。',
    '江风吹来咸腥的气息，码头上堆满了货物。',
    '水手们忙着系缆绳，船老大在船头吆喝指挥。',
  ],
  'temple': [
    '大相国寺香烟缭绕，诵经声隐隐传来。',
    '寺庙门前香客络绎不绝，铜炉里青烟袅袅。',
    '钟声悠悠，信众虔诚跪拜。',
  ],
  'residential_north': [
    '北城住宅区巷道幽静，偶尔传来几声犬吠。',
    '巷子深处传来孩童的嬉笑声。',
    '北城的宅院门扉紧闭，只露出檐角的一抹青灰。',
  ],
  'residential_south': [
    '南城居民区烟火气十足，家家户户飘出饭香。',
    '巷口的老槐树下，几个老人正在下棋。',
    '南城的胡同弯弯绕绕，晾晒的衣衫在风中摇摆。',
  ],
  'government': [
    '官衙门前肃穆庄严，差役持棍分立两侧。',
    '衙门内文书往来，官员们正忙于公务。',
    '衙门外的告示栏前围了不少人。',
  ],
  'west_farm': [
    '西边农田阡陌纵横，绿油油的庄稼随风起伏。',
    '田间地头，农夫们弯腰劳作。',
  ],
  'south_farm': [
    '南边田地里水渠潺潺，稻苗青青。',
    '农人在田埂上歇脚，擦着额头的汗。',
  ],
  'east_farm': [
    '东边田亩整齐，地里的庄稼长势喜人。',
    '远处传来牛叫声，农夫赶着水牛耕田。',
  ],
  'mountain_path': [
    '山间小径蜿蜒曲折，两旁古木参天。',
    '林中鸟鸣清脆，山风带着松脂的清香。',
  ],
  'mountain_peak': [
    '山巅之上，视野开阔，可俯瞰全城。',
    '山顶风大，吹得衣袂猎猎作响。',
  ],
  'riverbank': [
    '河岸边柳树成荫，水面波光粼粼。',
    '河水静静流淌，偶有渔船划过。',
  ],
  'upstream': [
    '上游水清见底，河边洗衣的妇人说说笑笑。',
    '水流湍急，溅起白花花的浪花。',
  ],
  'downstream': [
    '下游水面宽阔，几艘货船正缓缓驶过。',
    '河水在这里变得平缓，岸边芦苇丛生。',
  ],
};

// 默认地点叙事
const DEFAULT_LOCATION = [
  '街上行人来来往往。',
  '四周一片寻常景象。',
  '眼前是熟悉的街景。',
];

// ══════════════════════════════════════════
// NPC交互叙事
// ══════════════════════════════════════════

const ENCOUNTER_NARRATIVES = [
  '{nearby}挑着担子从旁经过，两人互相点了点头。',
  '{nearby}恰好路过，打了个照面，寒暄了几句。',
  '旁边{nearby}正在忙自己的事，抬头瞥了一眼。',
  '远处{nearby}的身影一闪而过。',
  '{nearby}在不远处停下脚步，似乎在等什么人。',
  '与{nearby}擦肩而过，各自低头赶路。',
  '{nearby}靠在墙边歇脚，看见这边，微微颔首。',
  '路过{nearby}身旁，闻到一股饭菜的香气。',
];

const TWO_NPC_ENCOUNTER = [
  '{nearby1}和{nearby2}正站在路边说话，见有人经过便住了口。',
  '{nearby1}正跟{nearby2}讨价还价，吵得面红耳赤。',
  '{nearby1}和{nearby2}并肩走在前面，有说有笑。',
];

// ══════════════════════════════════════════
// 性格叙事修饰
// ══════════════════════════════════════════

const PERSONALITY_NARRATIVES: Record<string, string[]> = {
  '勇敢': ['目光坚定，行事果断。', '神色自若，毫不怯场。'],
  '精明': ['眼里闪着精光，在心中默默盘算。', '不动声色地把四周打量了一遍。'],
  '温和': ['脸上始终挂着淡淡的微笑。', '说话轻声细语，不疾不徐。'],
  '暴躁': ['眉头一皱，语气不善。', '性子急，三步并作两步地走。'],
  '善良': ['看人的眼神温和而关切。', '遇到需要帮忙的人总会停下脚步。'],
  '健谈': ['话匣子一打开就收不住。', '三言两语就跟人混熟了。'],
  '沉默': ['话不多，但句句在点子上。', '闷声做事，不爱多说。'],
  '机灵': ['眼珠一转便有了主意。', '脑子转得快，手脚也麻利。'],
  '正直': ['行事光明磊落，从不拐弯抹角。', '一脸正气，说话掷地有声。'],
  '胆小': ['左右张望了一下，似乎有些紧张。', '缩了缩脖子，尽量不引人注目。'],
  '勤劳': ['手脚不停，一刻也不闲着。', '干活卖力，额头沁出了汗珠。'],
  '懒散': ['打了个哈欠，慢吞吞地挪着步子。', '百无聊赖地靠在墙边发呆。'],
  '吝啬': ['掏钱的时候犹豫了半天。', '把铜钱在手里掂了又掂。'],
  '贪吃': ['鼻子不自觉地朝饭馆的方向嗅了嗅。', '眼睛总往吃食摊子上瞟。'],
};

// ══════════════════════════════════════════
// 动作后缀叙事（按动作类别）
// ══════════════════════════════════════════

const ACTION_AFTERMATH: Record<string, string[]> = {
  'survival': ['吃完了抹抹嘴，精神好多了。', '填饱了肚子，身上又有了力气。'],
  'work': ['忙活了一阵，额头上渗出细密的汗珠。', '手脚不停，活干得利索漂亮。'],
  'social': ['说了会儿话，心情舒畅了不少。', '聊得投机，不知不觉就过了好一阵。'],
  'leisure': ['歇了一会儿，倦意消退了许多。', '难得清闲，享受了片刻的安宁。'],
  'move': ['脚步不停，朝目的地走去。', '左拐右拐，在街巷中穿行。'],
  'faction': ['办完了公事，心中踏实了几分。', '差事办妥，回去复命。'],
};

// ══════════════════════════════════════════
// 组装函数
// ══════════════════════════════════════════

export function getWeatherNarrative(weather: string, seed: number): string {
  const key = Object.keys(WEATHER_NARRATIVES).find(k => weather.includes(k)) || '晴';
  const arr = WEATHER_NARRATIVES[key] || WEATHER_NARRATIVES['晴'];
  return pickBySeed(arr, seed);
}

export function getTimeNarrative(shichen: string, seed: number): string {
  const arr = TIME_NARRATIVES[shichen] || TIME_NARRATIVES['辰'] || ['时辰不早不晚。'];
  return pickBySeed(arr, seed);
}

export function getLocationNarrative(gridId: string, seed: number): string {
  const arr = LOCATION_NARRATIVES[gridId] || DEFAULT_LOCATION;
  return pickBySeed(arr, seed);
}

export function getEncounterNarrative(nearbyNames: string[], seed: number): string {
  if (nearbyNames.length === 0) return '';
  if (nearbyNames.length >= 2) {
    const tpl = pickBySeed(TWO_NPC_ENCOUNTER, seed);
    return tpl.replace('{nearby1}', nearbyNames[0]).replace('{nearby2}', nearbyNames[1]);
  }
  const tpl = pickBySeed(ENCOUNTER_NARRATIVES, seed);
  return tpl.replace('{nearby}', nearbyNames[0]);
}

export function getPersonalityNarrative(personality: string[], seed: number): string {
  const traits = personality.filter(p => PERSONALITY_NARRATIVES[p]);
  if (traits.length === 0) return '';
  const trait = pickBySeed(traits, seed);
  const arr = PERSONALITY_NARRATIVES[trait];
  return pickBySeed(arr, seed + 1);
}

export function getActionAftermath(category: string, seed: number): string {
  const arr = ACTION_AFTERMATH[category];
  if (!arr) return '';
  return pickBySeed(arr, seed);
}

/**
 * 组装完整的环境丰富叙事
 * @param baseNarrative 基础动作叙事（一句话）
 * @param context 环境/NPC上下文
 * @returns 多句丰富叙事
 */
export function buildRichNarrative(context: {
  baseNarrative: string;
  weather: string;
  shichen: string;
  gridId: string;
  nearbyNames: string[];
  personality: string[];
  actionCategory: string;
  npcId: number;
  tick: number;
}): string {
  const seed = stableHash(context.npcId, context.tick);
  const parts: string[] = [];

  // 1. 环境句（天气 + 地点）
  parts.push(getWeatherNarrative(context.weather, seed));
  parts.push(getLocationNarrative(context.gridId, seed + 1));

  // 2. 时辰
  parts.push(getTimeNarrative(context.shichen, seed + 2));

  // 3. 动作句（核心）
  parts.push(context.baseNarrative);

  // 4. 交互句（附近NPC）
  const encounter = getEncounterNarrative(context.nearbyNames, seed + 3);
  if (encounter) parts.push(encounter);

  // 5. 性格反映
  const personalityNarr = getPersonalityNarrative(context.personality, seed + 4);
  if (personalityNarr) parts.push(personalityNarr);

  // 6. 动作后续
  const aftermath = getActionAftermath(context.actionCategory, seed + 5);
  if (aftermath) parts.push(aftermath);

  return parts.filter(Boolean).join('');
}
