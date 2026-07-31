export const required = (value, label) => {
  const result = String(value ?? '').trim();
  if (!result) throw new Error(`${label}不能为空`);
  return result;
};

export const toId = value => {
  const result = Number(value);
  if (!Number.isInteger(result) || result < 1) throw new Error('无效的编号');
  return result;
};
