import deepAssign from './deepAssign';

export default (grid) => {
  let cols;
  let headers;
  let index;
  let j;
  let k;
  let key;
  let len;
  let len1;
  let object;
  let objects;
  let rows;
  let value;
  headers = grid[0];
  rows = grid.slice(1);
  objects = [];
  for (j = 0, len = rows.length; j < len; j++) {
    cols = rows[j];
    object = {};
    for (index = k = 0, len1 = cols.length; k < len1; index = ++k) {
      value = cols[index];
      key = headers[index];
      if (typeof key !== 'string') {
        console.log('WARNING! No "key" on row=', j + 2, ' col=', index + 1, ' (start with 1)');
        key = '';
      }
      deepAssign(object, key, value);
    }
    objects.push(object);
  }
  return objects;
};
