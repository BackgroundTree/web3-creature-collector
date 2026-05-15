import ITEMS_JSON from './items.json';
import type { InventoryItem, LootOption, ShopItem, ItemCategory, ElementType } from '../types';

type RawShopItem = {
  id: number; name: string; type: string; effect: number; price: number; unlockStage?: number;
};

type RawDropItem = {
  id: number; name: string; weight: number;
  target?: string; trigger?: string; effect?: number | string;
  boosts?: string; multiplier?: number;
  duration?: number; stat?: string; stages?: number;
  yield?: number;
};

const SHOP_DATA = (ITEMS_JSON as any).shop_items as Record<string, RawShopItem>;
const DROP_DATA = (ITEMS_JSON as any).drop_items as Record<string, Record<string, RawDropItem>>;

function buildShopItem(key: string, raw: RawShopItem): ShopItem {
  const typeMap: Record<string, ItemCategory> = {
    instant_heal: 'healing',
    instant_revive: 'revive',
    instant_pp: 'pp_restore',
    instant_level: 'level_up',
  };
  return {
    id: key,
    name: raw.name,
    price: raw.price,
    category: typeMap[raw.type] || 'healing',
    healAmount: raw.type === 'instant_heal' ? raw.effect : undefined,
    revivePercent: raw.type === 'instant_revive' ? raw.effect : undefined,
    ppRestore: raw.type === 'instant_pp' ? raw.effect : undefined,
  };
}

function shopItemToInventory(key: string, raw: RawShopItem): InventoryItem {
  return {
    id: key,
    name: raw.name,
    category: raw.type === 'instant_heal' ? 'healing' : raw.type === 'instant_revive' ? 'revive' : raw.type === 'instant_pp' ? 'pp_restore' : 'level_up',
    persistAfterRun: false,
    usableInBattle: true,
    count: 1,
    healAmount: raw.type === 'instant_heal' ? raw.effect : undefined,
    revivePercent: raw.type === 'instant_revive' ? raw.effect : undefined,
    ppRestore: raw.type === 'instant_pp' ? raw.effect : undefined,
  };
}

export function getShopItems(): ShopItem[] {
  return Object.entries(SHOP_DATA).map(([key, raw]) => buildShopItem(key, raw));
}

export function buyShopItem(key: string): InventoryItem | null {
  const raw = SHOP_DATA[key];
  if (!raw) return null;
  return shopItemToInventory(key, raw);
}

const FLAT_DROPS: Array<{ key: string; item: RawDropItem; category: string; persistAfterRun: boolean }> = [];

for (const [category, items] of Object.entries(DROP_DATA)) {
  const persist = category === 'evolution_stones' || category === 'berries' || category === 'type_boosters';
  for (const [key, item] of Object.entries(items)) {
    FLAT_DROPS.push({ key, item, category, persistAfterRun: persist });
  }
}

function weightedRandomSelect(count: number): typeof FLAT_DROPS {
  const totalWeight = FLAT_DROPS.reduce((s, d) => s + d.item.weight, 0);
  const picks: typeof FLAT_DROPS = [];
  const pool = [...FLAT_DROPS];

  for (let i = 0; i < count && pool.length > 0; i++) {
    let roll = Math.random() * totalWeight;
    let idx = 0;
    for (let j = 0; j < pool.length; j++) {
      roll -= pool[j].item.weight;
      if (roll <= 0) { idx = j; break; }
    }
    picks.push(pool[idx]);
    pool.splice(idx, 1);
  }

  return picks;
}

function categoryMap(rawCat: string): ItemCategory {
  const map: Record<string, ItemCategory> = {
    evolution_stones: 'evolution',
    berries: 'berry',
    type_boosters: 'type_booster',
    x_items: 'x_item',
  };
  return map[rawCat] || 'x_item';
}

export function generateLootOptions(count: number): LootOption[] {
  const picks = weightedRandomSelect(count);
  return picks.map(p => {
    const desc = descriptionForDrop(p.category, p.item);
    return {
      id: p.key,
      name: p.item.name,
      category: categoryMap(p.category),
      description: desc,
      persistAfterRun: p.persistAfterRun,
    };
  });
}

export function createInventoryItemFromLoot(lootId: string): InventoryItem | null {
  for (const [category, items] of Object.entries(DROP_DATA)) {
    for (const [key, raw] of Object.entries(items)) {
      if (key === lootId) {
        const persist = category === 'evolution_stones' || category === 'berries' || category === 'type_boosters';
        const item: InventoryItem = {
          id: key,
          name: raw.name,
          category: categoryMap(category),
          persistAfterRun: persist,
          usableInBattle: category === 'x_item' || category === 'berries',
          count: 1,
        };
        if (category === 'type_boosters' && raw.boosts && raw.multiplier) {
          item.typeBoost = { type: raw.boosts as ElementType, multiplier: raw.multiplier };
        }
        if (category === 'x_items' && raw.stat && raw.stages && raw.duration) {
          const statMap: Record<string, any> = {
            atk: 'atk', def: 'def', spd: 'spe', spAtk: 'spa', spDef: 'spd',
          };
          item.statBoost = { stat: statMap[raw.stat] || 'atk', stages: raw.stages, duration: raw.duration };
        }
        if (category === 'berries' && raw.trigger && raw.effect) {
          item.berryEffect = { trigger: raw.trigger, effect: raw.effect };
        }
        if (category === 'evolution_stones' && raw.target) {
          item.evolutionTarget = raw.target;
        }
        return item;
      }
    }
  }
  return null;
}

function descriptionForDrop(category: string, item: RawDropItem): string {
  if (category === 'currency') return `+${item.yield} gold`;
  if (category === 'type_boosters' && item.boosts) return `Boosts ${item.boosts}-type moves`;
  if (category === 'evolution_stones' && item.target) return `Evolves ${item.target}`;
  if (category === 'berries' && item.trigger) return `Auto-use when ${item.trigger}`;
  if (category === 'x_items' && item.stat) return `+${item.stat} for ${item.duration} turns`;
  return item.name;
}

export function coinDropAmount(): number {
  const roll = Math.random();
  if (roll < 0.6) return 50 + Math.floor(Math.random() * 50);
  if (roll < 0.85) return 150 + Math.floor(Math.random() * 100);
  return 300 + Math.floor(Math.random() * 200);
}

export function currencyLootOptions(): LootOption[] {
  return Object.entries(DROP_DATA.currency || {}).map(([key, item]) => ({
    id: key,
    name: item.name,
    category: 'x_item' as ItemCategory,
    description: `+${item.yield} gold`,
    persistAfterRun: false,
  }));
}
