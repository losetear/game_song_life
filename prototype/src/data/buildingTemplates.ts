// === 建筑模板 ===

export interface RoomObject {
  name: string;
  icon: string;
  description: string;
  interactable: boolean;
  itemType?: string;
}

export interface Room {
  id: string;
  name: string;
  icon: string;
  description: string;
  objects: RoomObject[];
  capacity: number;
}

export interface RoomTemplate {
  id: string;
  name: string;
  icon: string;
  description: string;
  objects: RoomObject[];
  capacity: number;
}

export interface BuildingTemplate {
  namePool: string[];
  rooms: RoomTemplate[];
  descriptionPool: string[];
}

export const BUILDING_TEMPLATES: Record<string, BuildingTemplate> = {
  house: {
    namePool: ['张家宅', '李家院', '赵家小院', '孙家旧宅', '周家新居', '吴家老宅', '郑家大院', '王家小楼', '陈家院落', '刘家茅舍', '杨家瓦房', '黄家老屋'],
    rooms: [
      {
        id: 'main_room', name: '正房', icon: '🏠', description: '宽敞的正房，陈设简单整洁。',
        objects: [
          { name: '八仙桌', icon: '🪑', description: '一张结实的八仙桌，桌面上有使用痕迹。', interactable: true },
          { name: '太师椅', icon: '💺', description: '一把太师椅，扶手磨得发亮。', interactable: false },
          { name: '衣柜', icon: '🗄', description: '老式衣柜，里面有几件衣裳。', interactable: true, itemType: 'cloth' },
        ],
        capacity: 6,
      },
      {
        id: 'kitchen', name: '灶房', icon: '🔥', description: '灶房里弥漫着柴火的气味。',
        objects: [
          { name: '灶台', icon: '🔥', description: '一口大灶，火已经熄了。', interactable: true },
          { name: '水缸', icon: '💧', description: '一口大水缸，里面蓄满了水。', interactable: false },
          { name: '米缸', icon: '🍚', description: '米缸里还有些存粮。', interactable: true, itemType: 'food' },
        ],
        capacity: 3,
      },
      {
        id: 'courtyard', name: '院子', icon: '🌳', description: '一个不大不小的院子，种着几棵树。',
        objects: [
          { name: '水井', icon: '💧', description: '院中的老井，井水清冽。', interactable: true },
          { name: '晾衣架', icon: '👕', description: '竹竿搭的晾衣架，上面晾着几件衣裳。', interactable: false },
        ],
        capacity: 8,
      },
    ],
    descriptionPool: [
      '一座青砖灰瓦的老宅，门楣上刻着模糊的字迹。',
      '不大的院子，围墙有些斑驳，门前种着一棵老槐树。',
      '一处朴素的民居，木门半掩，屋檐下挂着几串干辣椒。',
    ],
  },
  shop: {
    namePool: ['锦绣布庄', '聚宝斋', '福来杂货', '丰盛粮铺', '百味酱园', '同福商号', '德兴杂货'],
    rooms: [
      {
        id: 'shop_floor', name: '店面', icon: '🏪', description: '店面不大但货物齐全，柜台后面站着掌柜。',
        objects: [
          { name: '柜台', icon: '🗃', description: '老旧的木柜台，上面放着算盘。', interactable: true },
          { name: '算盘', icon: '🧮', description: '一把老算盘，珠子已经被磨得发亮。', interactable: false },
          { name: '货架', icon: '🗄', description: '靠墙的货架上摆满了各种货物。', interactable: true, itemType: 'goods' },
        ],
        capacity: 10,
      },
      {
        id: 'back_room', name: '库房', icon: '📦', description: '库房里堆满了箱笼，空间逼仄。',
        objects: [
          { name: '大木箱', icon: '📦', description: '几个大木箱摞在一起。', interactable: true, itemType: 'goods' },
          { name: '账本', icon: '📒', description: '一本厚厚的账本，记录着进出货明细。', interactable: true },
        ],
        capacity: 4,
      },
    ],
    descriptionPool: [
      '一间门面宽敞的铺子，幌子在风中招展。',
      '店铺门脸不大，但门口进进出出的人不少。',
    ],
  },
  teahouse: {
    namePool: ['清风茶楼', '望月茶馆', '醉仙楼', '碧云轩', '听雨轩'],
    rooms: [
      {
        id: 'main_hall', name: '大堂', icon: '🍵', description: '茶楼大堂热闹非凡，说书先生正讲到精彩处。',
        objects: [
          { name: '方桌', icon: '🪑', description: '几张方桌散落在大堂中，坐着三两茶客。', interactable: false },
          { name: '茶具', icon: '🍵', description: '一套精致的茶具，茶香袅袅。', interactable: true, itemType: 'food' },
          { name: '说书台', icon: '🎤', description: '高台上的说书先生正口若悬河。', interactable: false },
        ],
        capacity: 20,
      },
      {
        id: 'private_room', name: '雅间', icon: '🚪', description: '清静的雅间，适合私密交谈。',
        objects: [
          { name: '屏风', icon: '🪧', description: '精致的木雕屏风，将雅间隔开。', interactable: false },
          { name: '茶几', icon: '🍵', description: '小巧的茶几上摆着一套茶具。', interactable: true },
        ],
        capacity: 4,
      },
    ],
    descriptionPool: [
      '两层小楼，门口挂着茶旗，茶香飘出半条街。',
      '一座热闹的茶楼，门口人来人往，楼上隐约传来笑声。',
    ],
  },
  clinic: {
    namePool: ['济世堂', '回春堂', '仁心堂', '保和堂', '同仁堂'],
    rooms: [
      {
        id: 'consultation', name: '诊室', icon: '🏥', description: '诊室里弥漫着药草的气味，墙上挂着几幅经络图。',
        objects: [
          { name: '药柜', icon: '🗄', description: '一整面墙的药柜，每个小抽屉上写着药名。', interactable: true, itemType: 'herbs' },
          { name: '诊桌', icon: '🪑', description: '诊桌上放着脉枕和处方笺。', interactable: false },
          { name: '脉枕', icon: '🛏', description: '一个布面脉枕，用得已经发黑了。', interactable: false },
        ],
        capacity: 8,
      },
      {
        id: 'herb_room', name: '药房', icon: '🌿', description: '药房里药味浓郁，药架上瓶瓶罐罐排列整齐。',
        objects: [
          { name: '药架', icon: '🗄', description: '药架上分门别类放着各种药材。', interactable: true, itemType: 'herbs' },
          { name: '药碾', icon: '⚗', description: '一个铁药碾，旁边放着碾好的药粉。', interactable: false },
          { name: '药炉', icon: '🔥', description: '小药炉上正煎着药，咕嘟咕嘟冒着热气。', interactable: true },
        ],
        capacity: 4,
      },
    ],
    descriptionPool: [
      '一间药铺，门口挂着"妙手回春"的牌匾。',
      '药堂门口飘出浓浓的草药味，不时有人进进出出。',
    ],
  },
  tavern: {
    namePool: ['杏花村酒肆', '太白酒楼', '醉翁亭', '杜康坊', '春风酒馆'],
    rooms: [
      {
        id: 'bar', name: '酒堂', icon: '🍺', description: '酒堂里酒香四溢，几条长凳上坐着推杯换盏的酒客。',
        objects: [
          { name: '酒柜', icon: '🍶', description: '柜台后面的酒柜上摆满了各式酒坛。', interactable: true, itemType: 'food' },
          { name: '长条凳', icon: '🪑', description: '几条长条凳，坐着不少酒客。', interactable: false },
        ],
        capacity: 15,
      },
      {
        id: 'kitchen', name: '后厨', icon: '🔥', description: '后厨里热气腾腾，灶火噼啪作响。',
        objects: [
          { name: '大灶', icon: '🔥', description: '一口大灶，火舌舔着锅底。', interactable: true },
          { name: '食材架', icon: '🍖', description: '架子上挂着各种食材。', interactable: true, itemType: 'food' },
        ],
        capacity: 3,
      },
    ],
    descriptionPool: [
      '一间酒肆，门口挂着酒旗，远远就能闻到酒香。',
      '热闹的酒楼，门口几个醉汉正勾肩搭背地聊天。',
    ],
  },
  warehouse: {
    namePool: ['东市货栈', '码头仓库', '粮仓', '兵器库', '杂货栈'],
    rooms: [
      {
        id: 'storage', name: '仓房', icon: '📦', description: '空旷的仓房里堆满了货物，空气中弥漫着麻袋的气味。',
        objects: [
          { name: '大木箱', icon: '📦', description: '几个大木箱，上面贴着封条。', interactable: true, itemType: 'goods' },
          { name: '麻袋堆', icon: '袋子', description: '高高摞起的麻袋堆，不知装着什么。', interactable: true, itemType: 'food' },
        ],
        capacity: 6,
      },
    ],
    descriptionPool: [
      '一座大型货栈，门口停着几辆运货的板车。',
      '仓库大门紧闭，只有一个小门供人进出。',
    ],
  },
  temple: {
    namePool: ['护国寺', '观音阁', '城隍庙', '关帝庙', '白衣庵'],
    rooms: [
      {
        id: 'main_hall', name: '大殿', icon: '⛩', description: '大殿内金碧辉煌，佛像前香烟缭绕。',
        objects: [
          { name: '香案', icon: '🕯', description: '香案上摆满了供品和香烛。', interactable: true },
          { name: '蒲团', icon: '🧎', description: '几个蒲团整齐地摆在地上。', interactable: false },
        ],
        capacity: 20,
      },
      {
        id: 'courtyard', name: '寺院', icon: '🌳', description: '寺院里古柏参天，石板路旁种着几丛翠竹。',
        objects: [
          { name: '石碑', icon: '🪨', description: '一块古旧的石碑，上面的字迹已模糊不清。', interactable: false },
          { name: '功德箱', icon: '📦', description: '功德箱上写着"随缘乐助"。', interactable: true, itemType: 'copper' },
        ],
        capacity: 15,
      },
    ],
    descriptionPool: [
      '一座古刹，殿宇巍峨，钟声悠悠。',
      '寺庙门前香客络绎不绝，袅袅青烟直上云霄。',
    ],
  },
  government: {
    namePool: ['开封府', '府衙', '县衙'],
    rooms: [
      {
        id: 'court', name: '公堂', icon: '🏛', description: '公堂之上，"明镜高悬"的匾额挂在正中。',
        objects: [
          { name: '公案', icon: '🪑', description: '知府的公案上摆着签筒和惊堂木。', interactable: false },
          { name: '惊堂木', icon: '🪵', description: '一块乌黑的惊堂木。', interactable: false },
        ],
        capacity: 15,
      },
      {
        id: 'archive', name: '文书房', icon: '📜', description: '文书房里堆满了卷宗和公文。',
        objects: [
          { name: '书架', icon: '🗄', description: '书架上整齐地排列着卷宗。', interactable: false },
          { name: '印台', icon: '🔴', description: '官印端放在印台上。', interactable: false },
        ],
        capacity: 5,
      },
    ],
    descriptionPool: [
      '威严的府衙，门前两尊石狮，气派非凡。',
    ],
  },
};

/** 所有建筑类型列表（按权重排序，民居最多） */
export const BUILDING_TYPE_LIST = ['house', 'house', 'house', 'house', 'house', 'house', 'house', 'house', 'house', 'house',
  'shop', 'teahouse', 'clinic', 'tavern', 'warehouse'];

/** 特殊建筑类型（非民居） */
export const SPECIAL_BUILDING_TYPES = ['shop', 'teahouse', 'clinic', 'tavern', 'warehouse', 'temple', 'government'];

/** 根据建筑类型和索引生成建筑名 */
export function getBuildingName(type: string, index: number): string {
  const template = BUILDING_TEMPLATES[type];
  if (!template) return '房屋';
  return template.namePool[index % template.namePool.length];
}

/** 根据建筑类型和索引生成建筑描述 */
export function getBuildingDescription(type: string, index: number): string {
  const template = BUILDING_TEMPLATES[type];
  if (!template) return '一座普通的建筑。';
  return template.descriptionPool[index % template.descriptionPool.length];
}

/** 根据建筑类型生成房间列表 */
export function getBuildingRooms(type: string): Room[] {
  const template = BUILDING_TEMPLATES[type];
  if (!template) return [];
  return template.rooms.map(r => ({
    id: r.id,
    name: r.name,
    icon: r.icon,
    description: r.description,
    objects: [...r.objects],
    capacity: r.capacity,
  }));
}

/** 获取建筑类型的图标 */
export function getBuildingTypeIcon(type: string): string {
  const iconMap: Record<string, string> = {
    house: '🏠',
    shop: '🏪',
    teahouse: '🍵',
    clinic: '🏥',
    tavern: '🍺',
    warehouse: '📦',
    temple: '⛩',
    government: '🏛',
  };
  return iconMap[type] || '🏠';
}

/** 获取建筑类型的默认营业时间 */
export function getBuildingOpenHours(type: string): string {
  const hoursMap: Record<string, string> = {
    shop: '辰-酉',
    teahouse: '巳-亥',
    clinic: '辰-申',
    tavern: '午-子',
    warehouse: '辰-酉',
    temple: '卯-酉',
    government: '辰-午',
    house: '',
  };
  return hoursMap[type] || '';
}
