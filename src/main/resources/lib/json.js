exports.findValueInJson = function(json, paths) {

  const res = paths.reduce((acc, cur) => {
    const jpBits = cur.split(',').filter((bit) => bit !== "" && bit !== undefined)
    const valuesFromJson = jpBits.map((bit) => {
      const sanitizedBit = bit.trim()
      const jsonBit = `json.${sanitizedBit}`;
      if(eval(jsonBit)){
        const value = eval(jsonBit);
        if (typeof value === "string") {
          return value
        } else if(Array.isArray(value)){
          return value.join(" ");
        }
      }
    }).filter((bit) => bit !== "" && bit !== null && bit !== "null")

    if(valuesFromJson.length > 0) {
      const ccc = valuesFromJson.join(" ")
      if(ccc !== "") acc.push(ccc)
    }

    return acc
  }, [])

  return res.length > 0 ? res.join(" ") : undefined
}
