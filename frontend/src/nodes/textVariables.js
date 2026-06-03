const VARIABLE_REGEX = /\{\{\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\}\}/g;

export const parseTextVariables = (text) => {
  const matches = [...text.matchAll(VARIABLE_REGEX)];
  return [...new Set(matches.map((match) => match[1]))];
};

export const computeTextNodeWidth = (text, min = 220, max = 520) => {
  const longestLine = text
    .split('\n')
    .reduce((maxLen, line) => Math.max(maxLen, line.length), 0);
  return Math.min(Math.max(min, longestLine * 7.5 + 56), max);
};
