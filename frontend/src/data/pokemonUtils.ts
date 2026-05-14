import type { Pokemon as BattlePokemon, ElementType, BaseStats, Move, StatName } from '../types';
import POKEMON_DATA from './pokemon.json';
import MOVES_DATA from './moves.json';

type PokemonData = {
  id: number;
  name: string;
  types: string[];
  baseStats: {
    hp: number;
    atk: number;
    def: number;
    spAtk: number;
    spDef: number;
    spd: number;
  };
  moves: Record<string, string[]>;
};

type MoveData = {
  name: string;
  type: ElementType;
  category: "Physical" | "Special" | "Status";
  power: number;
  accuracy: number;
  effect: unknown;
};

const NATURE_MODS: [StatName, StatName, number][] = [
  ["atk", "def", 1.1],
  ["spa", "spd", 1.1],
  ["spe", "hp", 1.1],
  ["atk", "spa", 0.9],
  ["def", "spd", 0.9],
  ["spa", "atk", 0.9],
  ["spd", "def", 0.9],
];

function applyNature(stats: BaseStats, seed: number): BaseStats {
  const [up, down, mult] = NATURE_MODS[seed % NATURE_MODS.length];
  const result = { ...stats };
  result[up] = Math.floor(result[up] * mult);
  result[down] = Math.floor(result[down] * 0.9);
  return result;
}

function mapBaseStats(data: PokemonData["baseStats"]): BaseStats {
  return {
    hp:  data.hp,
    atk: data.atk,
    def: data.def,
    spa: data.spAtk,
    spd: data.spDef,
    spe: data.spd,
  };
}

function calcStats(base: BaseStats, level: number, seed: number): BaseStats {
  return applyNature({
    hp:  Math.floor((2 * base.hp  + 31) * level / 100) + level + 10,
    atk: Math.floor((2 * base.atk + 31) * level / 100) + 5,
    def: Math.floor((2 * base.def + 31) * level / 100) + 5,
    spa: Math.floor((2 * base.spa + 31) * level / 100) + 5,
    spd: Math.floor((2 * base.spd + 31) * level / 100) + 5,
    spe: Math.floor((2 * base.spe + 31) * level / 100) + 5,
  }, seed);
}

function getMovesForLevel(moves: Record<string, string[]>, level: number): Move[] {
  const learned: Move[] = [];
  const levelKeys = Object.keys(moves).map(Number).sort((a, b) => a - b);
  const moveKeys = Object.keys(MOVES_DATA as Record<string, MoveData>);

  for (const lvl of levelKeys) {
    if (lvl > level) break;
    for (const moveId of moves[lvl]) {
      const moveData = (MOVES_DATA as Record<string, MoveData>)[moveId];
      if (!moveData) continue;
      if (learned.some(m => m.name === moveData.name)) continue;
      learned.push({
        id: moveKeys.indexOf(moveId) + 1,
        name: moveData.name,
        type: moveData.type,
        category: moveData.category,
        power: moveData.power,
        accuracy: moveData.accuracy,
        pp: 15,
        ppMax: 15,
        effect: moveData.effect ? String(moveData.effect) : undefined,
      });
    }
  }

  return learned.slice(0, 4);
}

function getPokemonData(key: string): PokemonData | undefined {
  return (POKEMON_DATA as Record<string, PokemonData>)[key];
}

export function buildPokemon(
  speciesKey: string,
  level: number,
  _isShiny = false,
  ivSeed?: number
): BattlePokemon {
  const data = getPokemonData(speciesKey);
  if (!data) {
    return buildPokemon("bulbasaur", level, _isShiny, ivSeed);
  }

  const seed = ivSeed ?? Math.floor(Math.random() * NATURE_MODS.length);
  const mapped = mapBaseStats(data.baseStats);
  const stats = calcStats(mapped, level, seed);

  return {
    id: data.id,
    name: data.name,
    types: data.types as [ElementType] | [ElementType, ElementType],
    baseStats: mapped,
    level,
    stats,
    currentHp: stats.hp,
    moves: getMovesForLevel(data.moves, level),
    tokenId: undefined,
  };
}

export function buildRandomEnemy(floor: number): BattlePokemon {
  const keys = Object.keys(POKEMON_DATA as Record<string, PokemonData>);
  const randomKey = keys[Math.floor(Math.random() * keys.length)];
  const data = (POKEMON_DATA as Record<string, PokemonData>)[randomKey];
  const level = Math.min(100, Math.floor(5 + floor * 2.5 + Math.random() * 5));
  const mapped = mapBaseStats(data.baseStats);
  const stats = calcStats(mapped, level, Math.floor(Math.random() * NATURE_MODS.length));

  return {
    id: data.id,
    name: data.name,
    types: data.types as [ElementType] | [ElementType, ElementType],
    baseStats: mapped,
    level,
    stats,
    currentHp: stats.hp,
    moves: getMovesForLevel(data.moves, level),
    tokenId: undefined,
  };
}

export function buildStarterParty(): BattlePokemon[] {
  return [
    buildPokemon("bulbasaur", 5),
    buildPokemon("charmander", 5),
    buildPokemon("squirtle", 5),
  ];
}

export const POKEMON_KEYS = Object.keys(POKEMON_DATA as Record<string, PokemonData>);
