// === NPC 模板 ===

export const NPC_NAMES = [
  '张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十',
  '郑大', '冯二', '陈老三', '褚小四', '卫五', '蒋六', '沈七', '韩八',
];

export const PROFESSIONS = ['merchant', 'farmer', 'guard', 'doctor', 'hunter', 'rogue'];

export const PROFESSION_NAMES: Record<string, string> = {
  merchant: '商贩',
  farmer: '农夫',
  guard: '衙役',
  doctor: '大夫',
  hunter: '猎人',
  rogue: '混混',
};

export const PERSONALITY_TRAITS = ['勤劳', '懒散', '善良', '狡猾', '勇敢', '胆小', '大方', '吝啬', '健谈', '沉默'];

export interface NPCTemplate {
  name: string;
  profession: string;
  age: number;
  personality: string[];
}

export function generateNPC(index: number): NPCTemplate {
  const name = NPC_NAMES[index % NPC_NAMES.length] + (index >= NPC_NAMES.length ? `${Math.floor(index / NPC_NAMES.length) + 1}` : '');
  const profession = PROFESSIONS[index % PROFESSIONS.length];
  const age = 18 + Math.floor(Math.random() * 50);
  const personality = [
    PERSONALITY_TRAITS[Math.floor(Math.random() * PERSONALITY_TRAITS.length)],
    PERSONALITY_TRAITS[Math.floor(Math.random() * PERSONALITY_TRAITS.length)],
  ];
  return { name, profession, age, personality };
}
