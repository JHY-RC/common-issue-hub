export const csvValue = value => {
  const text = String(value ?? '');
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
};

export const createCsv = rows => '\ufeff' + rows.map(line => line.map(csvValue).join(',')).join('\r\n');
