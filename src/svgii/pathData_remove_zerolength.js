
/*
// remove zero-length segments introduced by rounding
export function removeZeroLengthLinetos_post(pathData) {
    let pathDataOpt = []
    pathData.forEach((com, i) => {
        let { type, values } = com;
        if (type === 'l' || type === 'v' || type === 'h') {
            let hasLength = type === 'l' ? (values.join('') !== '00') : values[0] !== 0
            if (hasLength) pathDataOpt.push(com)
        } else {
            pathDataOpt.push(com)
        }
    })
    return pathDataOpt
}
*/

export function removeZeroLengthLinetos(pathData) {

    let M = { x: pathData[0].values[0], y: pathData[0].values[1] }
    let p0 = M
    let p = p0

    let pathDataN = [pathData[0]]

    for (let c = 1, l = pathData.length; c < l; c++) {
        let com = pathData[c];
        let { type, values } = com;

        let valsLen = values.length;
        //let valsL = values.slice(-2);
        //p = { x: valsL[0], y: valsL[1] };
        p = { x: values[valsLen-2], y: values[valsLen-1] };

        // skip lineto
        if (type === 'L' && p.x === p0.x && p.y === p0.y) {
            continue
        }

        // skip minified zero length
        if (type === 'l' || type === 'v' || type === 'h') {
            let noLength = type === 'l' ? (values.join('') === '00') : values[0] === 0;
            if(noLength) continue
        } 

        pathDataN.push(com)
        p0 = p;
    }


    return pathDataN

}