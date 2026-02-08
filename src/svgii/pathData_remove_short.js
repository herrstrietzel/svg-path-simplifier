import { getDistAv } from "./geometry";
import { renderPoint } from "./visualize";

export function refineClosingCommand(pathData = [], {
    threshold = 0,
} = {}) {

    let l = pathData.length;
    let comLast = pathData[l - 1]
    let isClosed = comLast.type.toLowerCase() === 'z';
    let idxPenultimate = isClosed ? l - 2 : l - 1
    let comPenultimate = isClosed ? pathData[idxPenultimate] : pathData[idxPenultimate]
    let valsPen = comPenultimate.values.slice(-2)


    let M = { x: pathData[0].values[0], y: pathData[0].values[1] }
    let pPen = { x: valsPen[0], y: valsPen[1] }
    let dist = getDistAv(M, pPen)

    // adjust last coordinates for better reordering
    if (dist && dist < threshold) {
        //console.log('dist', dist, 'threshold', threshold, comPenultimate);
        //renderPoint(markers, pPen)

        let valsLast = pathData[idxPenultimate].values
        let valsLastLen = valsLast.length;
        pathData[idxPenultimate].values[valsLastLen - 2] = M.x
        pathData[idxPenultimate].values[valsLastLen - 1] = M.y

        // adjust cpts
        let comFirst = pathData[1]
        //console.log(comFirst, comPenultimate);

        if (comFirst.type === 'C' && comPenultimate.type === 'C') {
            let dx1 = Math.abs(comFirst.values[0] - comPenultimate.values[2])
            let dy1 = Math.abs(comFirst.values[1] - comPenultimate.values[3])

            let dx2 = Math.abs(pathData[1].values[0] - comFirst.values[0])
            let dy2 = Math.abs(pathData[1].values[1] - comFirst.values[1])

            let dx3 = Math.abs(pathData[1].values[0] - comPenultimate.values[2])
            let dy3 = Math.abs(pathData[1].values[1] - comPenultimate.values[3])

            let ver = dx2 < threshold && dx3 < threshold && dy1;
            let hor = (dy2 < threshold && dy3 < threshold) && dx1;

            //console.log(dy1);
            if (dx1 && dx1 < threshold && ver) {
                //console.log('adjust v');
                pathData[1].values[0] = M.x
                pathData[idxPenultimate].values[2] = M.x
            }

            if (dy1 && dy1 < threshold && hor) {
                //console.log('should be y extreme');
                pathData[1].values[1] = M.y
                pathData[idxPenultimate].values[3] = M.y
            }

        }
    }

    return pathData;


}