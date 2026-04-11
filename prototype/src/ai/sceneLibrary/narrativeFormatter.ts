// === 叙事模板格式化 ===
//
// 将模板字符串中的占位符替换为实际值
// 支持 L0/L1/L2 三层的所有模板变量

export function formatNarrative(template: string, vars: Record<string, string>): string {
  let result = template;
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
