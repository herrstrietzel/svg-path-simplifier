export function removeZeroLengthLinetos(pathData) {

    let M = { x: pathData[0].values[0], y: pathData[0].values[1] }
    let p0 = M
    let p = p0

    let pathDataN = [pathData[0]]

    for (let c = 1, l = pathData.length; c < l; c++) {
        let com = pathData[c];
        let { type, values } = com;

        let valsL = values.slice(-2);
        p = { x: valsL[0], y: valsL[1] };

        // skip lineto
        if (type === 'L' && p.x === p0.x && p.y === p0.y) {
            continue
        }

        pathDataN.push(com)
        p0 = p;
    }


    return pathDataN

}