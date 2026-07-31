export const versionNumbers = name => {
  const text = String(name ?? '');
  const match = text.match(/SV(\d+(?:\.\d+)*)/i) || text.match(/(\d+(?:\.\d+)+)/);
  return match ? match[1].split('.').map(Number) : null;
};

export const compareVersionNames = (leftName, rightName) => {
  const left = versionNumbers(leftName);
  const right = versionNumbers(rightName);
  if (!left || !right) return null;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    const difference = (left[index] ?? 0) - (right[index] ?? 0);
    if (difference !== 0) return difference > 0 ? 1 : -1;
  }
  return 0;
};
