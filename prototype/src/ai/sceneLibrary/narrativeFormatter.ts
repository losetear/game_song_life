// === 叙事模板格式化 ===
//
// 将模板字符串中的占位符替换为实际值
// 支持 L0/L1/L2 三层的所有模板变量
// 漫野奇谭化：支持条件性叙事块 {if hasTag:xxx}...{/if}

export function formatNarrative(template: string, vars: Record<string, string>, narrativeTags?: string[]): string {
  let result = template;

  // 处理条件性叙事块 {if hasTag:xxx}content{/if}
  result = result.replace(/\{if\s+hasTag:(\w+)\}([\s\S]*?)\{\/if\}/g, (_match, tag: string, content: string) => {
    if (narrativeTags && narrativeTags.includes(tag)) {
      return content;
    }
    return '';
  });

  // 处理条件性叙事块 {if notTag:xxx}content{/if}
  result = result.replace(/\{if\s+notTag:(\w+)\}([\s\S]*?)\{\/if\}/g, (_match, tag: string, content: string) => {
    if (!narrativeTags || !narrativeTags.includes(tag)) {
      return content;
    }
    return '';
  });

  for (const [key, val] of Object.entries(vars)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
  }
  return result;
}

/** 职业中文名映射 */
export const PROFESSION_DISPLAY: Record<string, string> = {
  merchant: '商贩',
  farmer: '农夫',
  guard: '衙役',
  doctor: '大夫',
  hunter: '猎人',
  rogue: '混混',
  chef: '厨子',
  blacksmith: '铁匠',
  teacher: '先生',
  laborer: '苦力',
};

/** 时辰描述 */
export function shichenDesc(shichen: string): string {
  const map: Record<string, string> = {
    '寅': '凌晨', '卯': '清晨', '辰': '上午', '巳': '上午',
    '午': '正午', '未': '午后', '申': '下午', '酉': '傍晚',
    '戌': '入夜', '亥': '深夜', '子': '半夜', '丑': '凌晨',
  };
  return map[shichen] || shichen;
}

/** 地点显示名（简化版，完整版在 mapData.ts） */
export function gridDisplayName(gridId: string): string {
  const map: Record<string, string> = {
    center_street: '御街', east_market: '东市', west_market: '西市',
    tea_house: '茶楼', dock: '码头', temple: '大相国寺',
    government: '开封府', east_farm: '东郊农田', south_farm: '南郊农田',
    shallow_mountain: '浅山', deep_mountain: '深山',
    upstream: '汴河上游', downstream: '汴河下游',
    mountain_village: '山村', residential: '居民区',
    irrigation: '灌渠', riverbank: '河岸', stream: '小溪',
    wilderness: '荒野', forest_deep: '密林',
    mountain_path: '山道', forest_edge: '林缘',
  };
  return map[gridId] || gridId;
}

/** 数值描述（用于L2叙事） */
export function statValueDesc(value: number): string {
  if (value < 0.2) return '极低';
  if (value < 0.4) return '偏低';
  if (value < 0.6) return '一般';
  if (value < 0.8) return '良好';
  return '极好';
}

/** 叙事标签描述（用于UI展示） */
export function narrativeTagDesc(tag: string): string {
  const map: Record<string, string> = {
    '被攻击': '曾遭殴打',
    '被打': '曾被打败',
    '惨败街头': '曾惨败于街头',
    '被缴械': '曾被缴械',
    '被侮辱': '曾受辱',
    '被羞辱': '曾被当众羞辱',
    '刀伤': '有刀伤',
    '刀伤惨胜': '曾以刀伤取胜',
    '互刃': '曾互以兵刃相向',
    '互殴': '曾参与互殴',
    '完胜街头打架': '曾在街头完胜',
    '酒馆斗殴': '曾参与酒馆斗殴',
    '荣誉挑战': '曾发起荣誉挑战',
    '决斗胜利': '曾在决斗中获胜',
    '决斗失败': '曾在决斗中落败',
    '复仇': '曾实施复仇',
    'scarred': '有伤疤',
    'trusted_by_guard': '受衙门信任',
    'reformed': '已改过自新',
    '受恩': '曾受人恩惠',
    '施恩': '曾施恩于人',
    '偷窃': '曾犯偷窃',
  };
  return map[tag] || tag;
}
