/**
* scale path data proportionaly
*/
export function scalePathData(pathData, scale = 1) {
  let pathDataScaled = [];

  for (let i = 0, l = pathData.length; i < l; i++) {
    let com = pathData[i];
    let { type, values } = com;
    let comT = {
      type: type,
      values: []
    };

    switch (type.toLowerCase()) {
      // lineto shorthands
      case "h":
        comT.values = [values[0] * scale]; 
        break;
      case "v":
        comT.values = [values[0] * scale];
        break;

      // arcto
      case "a":
        comT.values = [
          values[0] * scale, // rx: scale
          values[1] * scale, // ry: scale
          values[2], // x-axis-rotation: keep it 
          values[3], // largeArc: dito
          values[4], // sweep: dito
          values[5] * scale, // final x: scale
          values[6] * scale // final y: scale
        ];
        break;

      /**
      * Other point based commands: L, C, S, Q, T
      * scale all values
      */
      default:
        if (values.length) {
          comT.values = values.map((val, i) => {
            return val * scale;
          });
        }
    }
    pathDataScaled.push(comT);
  };
  return pathDataScaled;
}