import {
  parseTextVariables,
  computeTextNodeWidth,
} from './nodes/textVariables';

describe('parseTextVariables', () => {
  test('extracts a single variable', () => {
    expect(parseTextVariables('Hello {{name}}')).toEqual(['name']);
  });

  test('tolerates surrounding whitespace', () => {
    expect(parseTextVariables('{{  name  }}')).toEqual(['name']);
  });

  test('deduplicates repeated variables, preserving first-seen order', () => {
    expect(parseTextVariables('{{a}} {{b}} {{a}}')).toEqual(['a', 'b']);
  });

  test('supports underscores and digits but not leading digits', () => {
    expect(parseTextVariables('{{user_1}} {{1bad}}')).toEqual(['user_1']);
  });

  test('returns an empty array when there are no variables', () => {
    expect(parseTextVariables('plain text')).toEqual([]);
    expect(parseTextVariables('')).toEqual([]);
  });

  test('ignores malformed braces', () => {
    expect(parseTextVariables('{not a var} {{ }}')).toEqual([]);
  });
});

describe('computeTextNodeWidth', () => {
  test('never goes below the minimum', () => {
    expect(computeTextNodeWidth('hi')).toBe(220);
  });

  test('never exceeds the maximum', () => {
    expect(computeTextNodeWidth('x'.repeat(500))).toBe(520);
  });

  test('grows with the longest line', () => {
    const short = computeTextNodeWidth('short');
    const long = computeTextNodeWidth('a much much much longer single line here');
    expect(long).toBeGreaterThan(short);
  });

  test('measures the longest line in multi-line text', () => {
    const text = 'short\n' + 'y'.repeat(40);
    expect(computeTextNodeWidth(text)).toBe(computeTextNodeWidth('y'.repeat(40)));
  });
});
