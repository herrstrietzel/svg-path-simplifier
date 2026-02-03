export function interpolatedPathData(pathData1, pathData2, t = 0.5) {

  /**
   * linear interpolation helper (LERP)
   * respecting non-interpolatable 
   * Boolean values – required by arc commands
   */
  const interpolateValues = (values1 = [], values2 = [], t = 0) => {

    // return start or end for t=0 or 1
    if (t === 0) return values1;
    if (t === 1) return values2;

    let len = values1.length;
    let isArc = len === 7;

    // interpolated values: copy values1
    let valuesI = values1.slice();

    for (let i = 0; i < len; i++) {
      let valI

      // skip Boolean arc command values (largeArc and sweep)
      if (isArc && (i === 3 || i === 4)) {
        continue
      }

      // interpolate
      valuesI[i] = (values2[i] - values1[i]) * t + values1[i];
    }
    return valuesI;
  }


  // interpolation impossible
  if (pathData1.length !== pathData2.length) {
    throw new Error("Paths are not compatible");
  }


  // interpolate command coordinates
  let pathDataI = [];
  pathData1.forEach((com, c) => {
    let {
      type,
      values
    } = com;
    let [type2, values2] = [pathData2[c].type, pathData2[c].values];

    // interpolate command values
    let valuesInter = interpolateValues(values, values2, t);

    pathDataI.push({
      type: type,
      values: valuesInter, 
    });
  });

  // serialize to "d" attribute string 
  let dInter = pathDataI.map(com => `${com.type} ${com.values.join(' ')}`).join(' ');
  return {
    pathData: pathDataI,
    d: dInter
  };
}
