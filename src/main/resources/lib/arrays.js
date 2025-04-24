const util = require('/lib/util');

exports.commaStringToArray = function(str) {
  if ( !str || str == '' || str == null) return null;
  const arr = util.data.forceArray(str);
  if (arr) {
    arr.map(function(s) { return s.trim() });
  }
  return arr;
}
