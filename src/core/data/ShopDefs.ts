/**
 * 店铺定义系统
 * 定义游戏中所有可交易的店铺及其属性
 */
import type { ItemCategory } from './ItemDefs';

export interface ShopDef {
  id: string;
  name: string;           // 店铺名
  locationId: string;     // 所在地点
  sellItems: string[];    // 出售的物品ID列表
  buyCategories: ItemCategory[];  // 收购的物品类别
  buyPriceMultiplier: number;  // 收购价倍率（0.4-0.7）
  sellPriceMultiplier: number; // 出售价倍率（0.8-1.2，受季节影响）
  shopkeeperNpcProfession: string; // 对应掌柜的职业
  description: string;    // 店铺描述
}

/**
 * 店铺定义表
 */
export const SHOPS: Record<string, ShopDef> = {
  liu_jia_mian_guan: {
    id: 'liu_jia_mian_guan',
    name: '刘家面馆',
    locationId: 'street',
    sellItems: ['miantiao', 'mian_tang', 'baozi', 'shaobing'],
    buyCategories: ['food'],
    buyPriceMultiplier: 0.5,
    sellPriceMultiplier: 1.0,
    shopkeeperNpcProfession: '面馆老板',
    description: '街角的老字号面馆，汤头浓郁，生意红火。',
  },
  zhao_ji_cha_lou: {
    id: 'zhao_ji_cha_lou',
    name: '赵记茶楼',
    locationId: 'teahouse',
    sellItems: ['cu_cha', 'hao_cha', 'gaodian', 'mi_jiu'],
    buyCategories: ['drink', 'food'],
    buyPriceMultiplier: 0.6,
    sellPriceMultiplier: 1.1,
    shopkeeperNpcProfession: '茶馆老板',
    description: '茶香袅袅，是城中文人雅士聚集之地。',
  },
  hui_chun_tang: {
    id: 'hui_chun_tang',
    name: '回春堂',
    locationId: 'clinic',
    sellItems: ['herb_medicine', 'jin_chuang_yao', 'an_shen_tang', 'ren_shen'],
    buyCategories: ['material', 'medicine'],
    buyPriceMultiplier: 0.5,
    sellPriceMultiplier: 1.2,
    shopkeeperNpcProfession: '郎中',
    description: '药铺里陈列着各色药材，药香扑鼻。',
  },
  wang_ji_za_huo: {
    id: 'wang_ji_za_huo',
    name: '王记杂货',
    locationId: 'market',
    sellItems: ['chutou', 'yugan', 'maobi', 'suanpan', 'ma_bu', 'mian_xian'],
    buyCategories: ['tool', 'material'],
    buyPriceMultiplier: 0.55,
    sellPriceMultiplier: 1.0,
    shopkeeperNpcProfession: '掌柜',
    description: '杂货铺里琳琅满目，生活用品一应俱全。',
  },
  jin_xiu_fang: {
    id: 'jin_xiu_fang',
    name: '锦绣坊',
    locationId: 'market',
    sellItems: ['cu_ma_yi', 'mian_bu_shan', 'chou_duan_pao', 'jiu_mian_ao', 'su_xiu_shou_pa'],
    buyCategories: ['clothing', 'luxury'],
    buyPriceMultiplier: 0.6,
    sellPriceMultiplier: 1.15,
    shopkeeperNpcProfession: '裁缝',
    description: '绸缎庄里挂着各式华服，绫罗绸缎应有尽有。',
  },
  wen_cui_xuan: {
    id: 'wen_cui_xuan',
    name: '文萃轩',
    locationId: 'bookshop',
    sellItems: ['san_zi_jing', 'lun_yu', 'suan_jing', 'yi_shu', 'hua_shu', 'dian_xin_he'],
    buyCategories: ['book'],
    buyPriceMultiplier: 0.65,
    sellPriceMultiplier: 1.1,
    shopkeeperNpcProfession: '书生',
    description: '书香满屋，是读书人淘书的好去处。',
  },
};

/**
 * 根据ID获取店铺定义
 */
export function getShop(id: string): ShopDef | undefined {
  return SHOPS[id];
}

/**
 * 获取所有店铺ID列表
 */
export function getAllShopIds(): string[] {
  return Object.keys(SHOPS);
}

/**
 * 获取指定地点的店铺列表
 */
export function getShopsAtLocation(locationId: string): ShopDef[] {
  return Object.values(SHOPS).filter(shop => shop.locationId === locationId);
}
