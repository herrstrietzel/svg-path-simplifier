import { checkLineIntersection, getDistAv, interpolate, pointAtT } from "./geometry";
import { getPolygonArea } from "./geometry_area";
import { commandIsFlat } from "./geometry_flatness";
import { renderPoint } from "./visualize";

export function refineRoundedCorners(pathData, {
    threshold = 0,
    tolerance = 1
} = {}) {

    let l = pathData.length;

    // add fist command
    let pathDataN = [pathData[0]]

    let isClosed = pathData[l - 1].type.toLowerCase() === 'z';
    let lastOff = isClosed ? 2 : 1;

    let comLast = pathData[l - lastOff];
    let lastIsLine = comLast.type === 'L'
    let lastIsBez = comLast.type === 'C'
    let firstIsLine = pathData[1].type === 'L';
    let firstIsBez = pathData[1].type === 'C';

    //console.log('lastIsLine', lastIsLine, 'firstIsLine', firstIsLine, 'lastIsBez', lastIsBez, 'firstIsBez', firstIsBez, 'isClosed', isClosed, 'comLast1', comLast1);

    let normalizeClose = isClosed && firstIsBez;
    //console.log('normalizeClose', normalizeClose);

    // normalize closepath to lineto
    if (normalizeClose) {
        pathData[l - 1].values = pathData[0].values
        pathData[l - 1].type = 'L'
        lastIsLine = true
    }

    for (let i = 1; i < l; i++) {
        let com = pathData[i];
        let { type } = com;
        let comN = pathData[i + 1] ? pathData[i + 1] : null;

        // search small cubic segments enclosed by linetos
        if ((type === 'L' && comN && comN.type === 'C') ||
            (type === 'C' && comN && comN.type === 'L')

        ) {
            let comL0 = com;
            let comL1 = null;
            let comBez = [];
            let offset = 0;

            // start to end
            if (i === 1 && firstIsBez && lastIsLine) {
                comBez = [pathData[1]]
                comL0 = pathData[l - 1]
                comL1 = comN
                //renderPoint(markers, com.p, 'orange')
            }

            // closing corner to start
            if (isClosed && lastIsBez && firstIsLine && i === l - lastOff - 1) {
                comL1 = pathData[1]
                comBez = [pathData[l - lastOff]]
                //renderPoint(markers, com.p)
            }

            for (let j = i + 1; j < l; j++) {
                let comN = pathData[j] ? pathData[j] : null;
                let comPrev = pathData[j - 1];

                if (comPrev.type === 'C') {
                    comBez.push(comPrev)
                }

                if (comN.type === 'L' && comPrev.type === 'C') {
                    comL1 = comN
                    break;
                }
                offset++
            }

            if (comL1) {

                // linetos
                let len1 = getDistAv(comL0.p0, comL0.p)
                let len2 = getDistAv(comL1.p0, comL1.p)

                // bezier
                //comBez = comBez[0];
                let comBezLen = comBez.length;
                let len3 = getDistAv(comBez[0].p0, comBez[comBezLen - 1].p)

                // check concaveness by area sign change
                let area1 = getPolygonArea([comL0.p0, comL0.p, comL1.p0, comL1.p], false)
                let area2 = getPolygonArea([comBez[0].p0, comBez[0].cp1, comBez[0].cp2, comBez[0].p], false)

                let signChange = (area1 < 0 && area2 > 0) || (area1 > 0 && area2 < 0)

                if (comBez && !signChange && len3 < threshold && len1 > len3 && len2 > len3) {

                    let ptQ = checkLineIntersection(comL0.p0, comL0.p, comL1.p0, comL1.p, false)
                    if (ptQ) {

                        /*
                        let dist1 = getDistAv(ptQ, comL0.p)
                        let dist2 = getDistAv(ptQ, comL1.p0)
                        let diff = Math.abs(dist1-dist2)
                        let rat =  diff/Math.max(dist1, dist2)
                        console.log('rat', rat);
                        */

                        /*
                        // adjust curve start and end to meet original
                        let t = 1

                        let p0_2 = pointAtT([ptQ, comL0.p], t)
                        //renderPoint(markers, p0_2, 'cyan', '1%', '0.5')
                        comL0.p = p0_2
                        comL0.values = [p0_2.x, p0_2.y]

                        let p_2 = pointAtT([ptQ, comL1.p0], t)
                        //renderPoint(markers, p_2, 'orange', '1%', '0.5')
                        comL1.p0 = p_2

                        //renderPoint(markers, comL0.p, 'red', '1%', '0.5')
                        //renderPoint(markers, ptQ, 'magenta')
                        */


                        let comQ = { type: 'Q', values: [ptQ.x, ptQ.y, comL1.p0.x, comL1.p0.y] }
                        comQ.p0 = comL0.p;
                        comQ.cp1 = ptQ;
                        comQ.p = comL1.p0;

                        // add quadratic command
                        pathDataN.push(comL0, comQ);
                        i += offset;
                        continue;
                    }
                }
            }
        }

        // skip last lineto
        if (normalizeClose && i === l - 1 && type === 'L') {
            continue
        }

        pathDataN.push(com)

    }

    // revert close path normalization
    if (normalizeClose) {
        pathDataN.push({ type: 'Z', values: [] })
    }

    return pathDataN;

}