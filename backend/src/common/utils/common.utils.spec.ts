import { generateSlug } from './common.utils';

describe('generateSlug', () => {
  it('lowercases and joins words with hyphens', () => {
    expect(generateSlug('Hello World')).toBe('hello-world');
  });

  it('trims surrounding whitespace and strips leading/trailing hyphens', () => {
    expect(generateSlug('  --Hello World!--  ')).toBe('hello-world');
  });

  it('removes diacritics', () => {
    expect(generateSlug('Crème Brûlée')).toBe('creme-brulee');
  });

  it('collapses runs of non-alphanumeric characters into one hyphen', () => {
    expect(generateSlug('a  &&  b__c')).toBe('a-b-c');
  });

  it('returns an empty string when nothing alphanumeric remains', () => {
    expect(generateSlug('!!!')).toBe('');
  });
});
