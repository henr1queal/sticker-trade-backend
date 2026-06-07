import { customAlphabet } from 'nanoid';

/** Letras sem I, O, L (confundem com 1, 0, 1) */
const LETTER_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ';
const AMBIGUOUS_LETTERS = new Set(['I', 'O', 'L']);

export const SHORT_ID_LETTER_COUNT = 2;
export const SHORT_ID_DIGIT_COUNT = 7;
export const SHORT_ID_LENGTH = SHORT_ID_LETTER_COUNT + SHORT_ID_DIGIT_COUNT;

export const SHORT_ID_PATTERN = /^[A-HJ-NP-Z]{2}[0-9]{7}$/;

const generateDigits = customAlphabet('0123456789', SHORT_ID_DIGIT_COUNT);

export function deriveLetterPrefix(name: string): string {
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[^A-Z\s]/g, '')
    .trim();

  const words = normalized.split(/\s+/).filter((word) => word.length > 0);
  let letters = '';

  if (words.length >= 2) {
    letters = `${words[0]![0]!}${words[1]![0]!}`;
  } else if (words.length === 1 && words[0]!.length >= 2) {
    letters = words[0]!.slice(0, 2);
  } else if (words.length === 1) {
    letters = `${words[0]![0]!}X`;
  } else {
    letters = 'XX';
  }

  return letters
    .split('')
    .map((char) => {
      if (AMBIGUOUS_LETTERS.has(char) || !LETTER_ALPHABET.includes(char)) {
        return 'X';
      }

      return char;
    })
    .join('')
    .padEnd(SHORT_ID_LETTER_COUNT, 'X')
    .slice(0, SHORT_ID_LETTER_COUNT);
}

export function generateShortId(name: string): string {
  const prefix = deriveLetterPrefix(name);
  return `${prefix}${generateDigits()}`;
}

export function normalizeShortId(value: string): string {
  return value.trim().toUpperCase();
}

export function isValidShortId(value: string): boolean {
  return SHORT_ID_PATTERN.test(normalizeShortId(value));
}
