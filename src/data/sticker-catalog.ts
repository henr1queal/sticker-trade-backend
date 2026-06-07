import { teamPlayerName, teamSlotDisplayLabel } from './team-players.js';

export type StickerType = 'fwc' | 'team' | 'cc';

export type StickerEntry = {
  code: string;
  type: StickerType;
  number: number;
  label: string;
  playerName?: string;
  teamCode?: string;
  teamName?: string;
};

export const TEAMS = [
  { code: 'MEX', name: 'México' },
  { code: 'RSA', name: 'África do Sul' },
  { code: 'KOR', name: 'Coreia do Sul' },
  { code: 'CZE', name: 'Rep. Tcheca' },
  { code: 'CAN', name: 'Canadá' },
  { code: 'BIH', name: 'Bósnia' },
  { code: 'QAT', name: 'Catar' },
  { code: 'SUI', name: 'Suíça' },
  { code: 'BRA', name: 'Brasil' },
  { code: 'MAR', name: 'Marrocos' },
  { code: 'HAI', name: 'Haiti' },
  { code: 'SCO', name: 'Escócia' },
  { code: 'USA', name: 'Estados Unidos' },
  { code: 'PAR', name: 'Paraguai' },
  { code: 'AUS', name: 'Austrália' },
  { code: 'TUR', name: 'Turquia' },
  { code: 'GER', name: 'Alemanha' },
  { code: 'CUW', name: 'Curaçao' },
  { code: 'CIV', name: 'Costa do Marfim' },
  { code: 'ECU', name: 'Equador' },
  { code: 'NED', name: 'Holanda' },
  { code: 'JPN', name: 'Japão' },
  { code: 'SWE', name: 'Suécia' },
  { code: 'TUN', name: 'Tunísia' },
  { code: 'BEL', name: 'Bélgica' },
  { code: 'EGY', name: 'Egito' },
  { code: 'IRN', name: 'Irã' },
  { code: 'NZL', name: 'Nova Zelândia' },
  { code: 'ESP', name: 'Espanha' },
  { code: 'CPV', name: 'Cabo Verde' },
  { code: 'KSA', name: 'Arábia Saudita' },
  { code: 'URU', name: 'Uruguai' },
  { code: 'FRA', name: 'França' },
  { code: 'SEN', name: 'Senegal' },
  { code: 'IRQ', name: 'Iraque' },
  { code: 'NOR', name: 'Noruega' },
  { code: 'ARG', name: 'Argentina' },
  { code: 'ALG', name: 'Argélia' },
  { code: 'AUT', name: 'Áustria' },
  { code: 'JOR', name: 'Jordânia' },
  { code: 'POR', name: 'Portugal' },
  { code: 'COD', name: 'Congo' },
  { code: 'UZB', name: 'Uzbequistão' },
  { code: 'COL', name: 'Colômbia' },
  { code: 'ENG', name: 'Inglaterra' },
  { code: 'CRO', name: 'Croácia' },
  { code: 'GHA', name: 'Gana' },
  { code: 'PAN', name: 'Panamá' },
] as const;

export const FWC_STICKER_COUNT = 19;
export const TEAM_STICKER_COUNT = 20;
export const CC_STICKER_COUNT = 14;

function buildCatalog(): StickerEntry[] {
  const stickers: StickerEntry[] = [];

  for (let number = 1; number <= FWC_STICKER_COUNT; number += 1) {
    stickers.push({
      code: `FWC${number}`,
      type: 'fwc',
      number,
      label: `Cromo FWC ${number}`,
    });
  }

  for (const team of TEAMS) {
    for (let number = 1; number <= TEAM_STICKER_COUNT; number += 1) {
      const playerName = teamPlayerName(team.code, number);
      const label = teamSlotDisplayLabel(team.code, number, team.name);
      stickers.push({
        code: `${team.code}${number}`,
        type: 'team',
        number,
        label,
        playerName,
        teamCode: team.code,
        teamName: team.name,
      });
    }
  }

  for (let number = 1; number <= CC_STICKER_COUNT; number += 1) {
    stickers.push({
      code: `CC${number}`,
      type: 'cc',
      number,
      label: `Coca-Cola #${number}`,
    });
  }

  return stickers;
}

export const STICKER_CATALOG = buildCatalog();

export const STICKER_BY_CODE = new Map(STICKER_CATALOG.map((sticker) => [sticker.code, sticker]));

export const VALID_STICKER_CODES = new Set(STICKER_BY_CODE.keys());

export function getSticker(code: string): StickerEntry | undefined {
  return STICKER_BY_CODE.get(code.toUpperCase());
}

export function normalizeStickerCode(code: string): string {
  return code.trim().toUpperCase();
}

export function isValidStickerCode(code: string): boolean {
  return VALID_STICKER_CODES.has(normalizeStickerCode(code));
}

export function findInvalidStickerCodes(codes: string[]): string[] {
  return codes.filter((code) => !isValidStickerCode(code));
}

export function enrichStickerCode(code: string): StickerEntry {
  const normalized = normalizeStickerCode(code);
  const sticker = getSticker(normalized);

  if (!sticker) {
    throw new Error(`Figurinha inválida: ${code}`);
  }

  return sticker;
}

export function enrichStickerCodes(codes: string[]): StickerEntry[] {
  return codes.map(enrichStickerCode);
}

export type CatalogFilter = {
  type?: StickerType;
  teamCode?: string;
};

export function listCatalog(filter: CatalogFilter = {}): StickerEntry[] {
  return STICKER_CATALOG.filter((sticker) => {
    if (filter.type && sticker.type !== filter.type) {
      return false;
    }

    if (filter.teamCode && sticker.teamCode !== filter.teamCode.toUpperCase()) {
      return false;
    }

    return true;
  });
}
