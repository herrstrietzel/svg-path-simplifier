import { getCombinedByDominant } from "../pathData_simplify_cubic_extrapolate";
import { getDistAv, interpolate } from "./geometry";
import { getPathArea } from "./geometry_area";
import { getPathDataBBox } from "./geometry_bbox";
import { renderPoint } from "./visualize";

export function refineAdjacentExtremes(pathData, {
    threshold = null, tolerance = 1
} = {}) {

    //dimA = dimA ? dimA : 
    if (!threshold) {
        let bb = getPathDataBBox(pathData);
        threshold = (bb.width + bb.height) / 2 * 0.05
        //console.log('new threshold', threshold);
    }

    //let bb = getPathDataBBox(pathData);
    //threshold = (bb.width + bb.height) / 2 * 0.1


    let l = pathData.length

    for (let i = 0; i < l; i++) {
        let com = pathData[i];
        let { type, values, extreme, corner = false, dimA, p0, p } = com;
        let comN = pathData[i + 1] ? pathData[i + 1] : null;
        let comN2 = pathData[i + 2] ? pathData[i + 2] : null;


        // check dist
        let diff = comN ? getDistAv(p, comN.p) : Infinity;
        let isCose = diff < threshold;

        let diff2 = comN2 ? getDistAv(comN2.p, comN.p) : Infinity
        let isCose2 = diff2 < threshold;


        if (comN && type === 'C' && comN.type === 'C' && extreme && comN2 && comN2.extreme) {


            if (isCose2 || isCose) {
                //renderPoint(markers, com.p, 'green', '1%', '0.5')
                //renderPoint(markers, comN.p, 'cyan', '1%', '0.5')
                //renderPoint(markers, comN2.p, 'magenta', '1%', '0.5')

                // extrapolate
                let comEx = getCombinedByDominant(comN, comN2, threshold, tolerance, false)
                //console.log('comEx', comEx);

                if (comEx.length === 1) {
                    pathData[i + 1] = null;

                    comEx = comEx[0]

                    pathData[i + 2].values = [comEx.cp1.x, comEx.cp1.y, comEx.cp2.x, comEx.cp2.y, comEx.p.x, comEx.p.y]
                    pathData[i + 2].cp1 = comEx.cp1
                    pathData[i + 2].cp2 = comEx.cp2
                    pathData[i + 2].p0 = comEx.p0
                    pathData[i + 2].p = comEx.p
                    pathData[i + 2].extreme = comEx.extreme

                    i++
                    continue
                }
            }

        }


        // adjacent 
        //&& comN.extreme 
        // && !corner
        if (comN && type === 'C' && comN.type === 'C' && extreme) {

            if (isCose) {


                //renderPoint(markers, com.p, 'cyan', '1%', '0.5')
                //renderPoint(markers, comN.p, 'cyan', '1%', '0.5')
                //console.log(comN);
                //console.log(diff, threshold);

                let dx1 = (com.cp1.x - comN.p0.x)
                let dy1 = (com.cp1.y - comN.p0.y)

                let horizontal = Math.abs(dy1) < Math.abs(dx1);

                let pN = comN.p;
                let ptI;
                let t = 1;

                //renderPoint(markers, comN.p, 'orange', '1%', '0.5')

                if (comN.extreme) {

                    // extend cp2
                    if (horizontal) {
                        t = Math.abs(Math.abs(comN.cp2.x - comN.p.x) / Math.abs(com.cp2.x - com.p.x))
                        //console.log('t', t);
                        ptI = interpolate(comN.p, com.cp2, 1 + t)
                        com.cp2.x = ptI.x
                        //renderPoint(markers, com.cp2, 'cyan', '1%', '0.5')
                        //renderPoint(markers, ptI, 'orange', '1%', '0.5')
                    }
                    else {
                        //renderPoint(markers, comN.p0, 'cyan', '1%', '0.5')
                        t = Math.abs(Math.abs(comN.cp2.y - comN.p.y) / Math.abs(com.cp2.y - com.p.y))
                        ptI = interpolate(comN.p, com.cp2, 1 + t)
                        com.cp2.y = ptI.y
                    }

                    //merge commands
                    pathData[i + 1].values = [com.cp1.x, com.cp1.y, com.cp2.x, com.cp2.y, pN.x, pN.y]
                    pathData[i + 1].cp1 = com.cp1
                    pathData[i + 1].cp2 = com.cp2
                    pathData[i + 1].p0 = com.p0
                    pathData[i + 1].p = pN
                    pathData[i + 1].extreme = true

                    // nullify 1st
                    pathData[i] = null;
                    continue

                }

            }
        }

        /*
        */



    }

    // remove commands
    pathData = pathData.filter(Boolean)
    l = pathData.length



    /**
     * refine closing commands
     */

    let closed = pathData[l - 1].type.toLowerCase() === 'z';
    let lastIdx = closed ? l - 2 : l - 1;
    let lastCom = pathData[lastIdx];
    let penultimateCom = pathData[lastIdx - 1] || null;
    let M = { x: pathData[0].values[0], y: pathData[0].values[1] }

    let dec = 8
    let lastVals = lastCom.values.slice(-2);
    let isClosingTo = +lastVals[0].toFixed(dec) === +M.x.toFixed(dec) && +lastVals[1].toFixed(dec) === +M.y.toFixed(dec)
    let fistExt = pathData[1].type === 'C' && pathData[1].extreme ? pathData[1] : null;


    //renderPoint(markers, M, 'blue')
    //renderPoint(markers, fistExt.cp1, 'blue')
    //renderPoint(markers, fistExt.p0, 'blue')



    let diff = getDistAv(lastCom.p0, lastCom.p)
    let isCose = diff < threshold;


    if (penultimateCom && penultimateCom.type === 'C' && isCose && isClosingTo && fistExt) {

        //let dx1 = Math.abs(fistExt.cp1.x - M.x)
        //let dy1 = Math.abs(fistExt.cp1.y - M.y)

        //let horizontal = dy1 < dx1;
        //console.log(dx1, dx2);
        //console.log('isCose', isCose, diff, dimA);

        let comEx = getCombinedByDominant(penultimateCom, lastCom, threshold, tolerance, false)
        //console.log('comEx', comEx);

        if (comEx.length === 1) {
            pathData[lastIdx - 1] = comEx[0];
            pathData[lastIdx] = null;
            pathData = pathData.filter(Boolean)
        }


    }


    //console.log('pathData ex', pathData);

    return pathData

}