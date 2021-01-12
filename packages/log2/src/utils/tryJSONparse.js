export default (str, defaultValue = str) => {
  try {
    if (typeof str !== 'string') return str;
    return JSON.parse(str);
  } catch (err) {
    return defaultValue;
  }
};
