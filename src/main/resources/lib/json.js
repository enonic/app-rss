
exports.findValueInJson = function(json, paths) {
  var value = null;
  var pathLength = paths.length;
  var jsonPath = "";

  for (var i = 0; i < pathLength; i++) {
    if ( paths[i] ) {
      jsonPath = 'json.' + paths[i] + '';
      try {
        if ( eval(jsonPath) ) {
          value = eval(jsonPath);
          //log.info(jsonPath);
          //log.info(value);
          if (typeof value === "string") {
            if (value.trim() === "")
              value = null; // Reset value if empty string (skip empties)
            else
              return value; // Expect the first property in the string is the most important one to use
          } else if(Array.isArray(value)){
            return value;
          } else {
            return null;
          }
        }
      } catch (e) {
        log.error((e.cause ? e.cause.message : e.message));
      }
    }
  }
  return value;
}
