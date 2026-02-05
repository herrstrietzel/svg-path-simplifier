import { getCombinedByDominant } from "./pathData_simplify_cubic_extrapolate";
import { getDistance, getSquareDistance, checkLineIntersection, pointAtT, getDistAv, interpolate } from "./svgii/geometry";
import { getBezierArea, getPolygonArea } from "./svgii/geometry_area";
import { renderPoint } from "./svgii/visualize";



export function simplifyPathDataCubic(pathData, {
    keepExtremes = true,
    keepInflections = true,
    keepCorners = true,
    extrapolateDominant = true,
    tolerance = 1,
} = {}) {

    let pathDataN = [pathData[0]];
    let l = pathData.length;

    for (let i = 2; l && i <= l; i++) {
        let com = pathData[i - 1];
        let comN = i < l ? pathData[i] : null;
        let typeN = comN?.type || null;
        //let isCornerN = comN?.corner || null;
        //let isExtremeN = comN?.extreme || null;
        let isDirChange = com?.directionChange || null;
        let isDirChangeN = comN?.directionChange || null;

        let { type, values, p0, p, cp1 = null, cp2 = null, extreme = false, corner = false, dimA = 0 } = com;


        // next is also cubic
        if (type === 'C' && typeN === 'C') {

            // cannot be combined as crossing extremes or corners
            if (
                (keepInflections && isDirChangeN) ||
                (keepCorners && corner) ||
                (!isDirChange && keepExtremes && extreme)
            ) {
                //renderPoint(markers, p, 'red', '1%')
                pathDataN.push(com)
            }

            // try simplification
            else {
                //renderPoint(markers, p, 'magenta', '1%')
                let combined = combineCubicPairs(com, comN, {tolerance})
                let error = 0;

                // combining successful! try next segment
                if (combined.length === 1) {
                    com = combined[0]
                    let offset = 1;

                    // add cumulative error to prevent distortions
                    error += com.error;
                    //console.log('!error', error);

                    // find next candidates
                    //offset<2 &&
                    for (let n = i + 1; error < tolerance && n < l; n++) {
                        let comN = pathData[n]
                        if (comN.type !== 'C' ||
                            (
                                (keepInflections && comN.directionChange) ||
                                (keepCorners && com.corner) ||
                                (keepExtremes && com.extreme)
                            )
                        ) {
                            break
                        }

                        let combined = combineCubicPairs(com, comN, {tolerance})
                        if (combined.length === 1) {
                            // add cumulative error to prevent distortions
                            //console.log('combined', combined);
                            error += combined[0].error * 0.5;
                            //error += combined[0].error * 1;
                            offset++
                        }
                        com = combined[0]
                    }

                    //com.opt = true
                    pathDataN.push(com)

                    if (i < l) {
                        i += offset
                    }

                } else {
                    pathDataN.push(com)
                }
            }

        } // end of bezier command


        // other commands
        else {
            pathDataN.push(com)
        }

    } // end command loop

    return pathDataN
}




export function combineCubicPairs(com1, com2, {
    tolerance = 1
} = {}) {

    let commands = [com1, com2];

    // assume 2 segments are result of a segment split
    let t = findSplitT(com1, com2);

    let distAv1 = getDistAv(com1.p0, com1.p);
    let distAv2 = getDistAv(com2.p0, com2.p);
    let distMin = Math.max(0, Math.min(distAv1, distAv2))


    let distScale = 0.06
    let maxDist = distMin * distScale * tolerance

    // get hypothetical combined command
    let comS = getExtrapolatedCommand(com1, com2, t)

    // test new point-at-t against original mid segment starting point
    let pt = pointAtT([comS.p0, comS.cp1, comS.cp2, comS.p], t)


    let dist0 = getDistAv(com1.p, pt)
    let dist1 = 0, dist2 = 0;
    let close = dist0 < maxDist;
    let success = false;

    // collect error data
    let error = dist0;



    if (close) {

        /**
         * check additional points
         * to prevent distortions
         */

        // 2nd segment mid
        let pt_2 = pointAtT([com2.p0, com2.cp1, com2.cp2, com2.p], 0.5)

        // simplified path
        let t3 = (1 + t) * 0.5;
        let ptS_2 = pointAtT([comS.p0, comS.cp1, comS.cp2, comS.p], t3)
        dist1 = getDistAv(pt_2, ptS_2)

        error += dist1;


        // quit - paths not congruent
        //if (dist2 > tolerance) return commands;


        if (dist1 < maxDist) {

            //renderPoint(markers, pt_2, 'magenta')
            //renderPoint(markers, ptS_2, 'green', '0.5%')

            // 1st segment mid
            let pt_1 = pointAtT([com1.p0, com1.cp1, com1.cp2, com1.p], 0.5)

            let t2 = t * 0.5;
            let ptS_1 = pointAtT([comS.p0, comS.cp1, comS.cp2, comS.p], t2)
            dist2 = getDistAv(pt_1, ptS_1)

            /*
            if(dist1>tolerance){
                renderPoint(markers, pt_1, 'blue')
                renderPoint(markers, ptS_1, 'orange', '0.5%')
            }
            */

            // quit - paths not congruent
            if (dist1 + dist2 < maxDist) success = true;

            // collect error data
            error += dist2;

            //console.log('simpl1');

        }

    } // end 1st try



    // add meta
    if (success) {

        // correct to exact start and end points
        comS.p0 = com1.p0
        comS.p = com2.p

        comS.dimA = getDistAv(comS.p0, comS.p);
        comS.type = 'C';
        comS.extreme = com2.extreme;
        comS.directionChange = com2.directionChange;
        comS.corner = com2.corner;

        comS.values = [comS.cp1.x, comS.cp1.y, comS.cp2.x, comS.cp2.y, comS.p.x, comS.p.y]

        // relative error
        comS.error = error / maxDist;

        //comS.p0 = com1.p0;
        commands = [comS];

    }


    //renderPoint(markers, com1.p, 'green', '1%', '0.5')
    //renderPoint(markers, pt, 'red', '0.75%', '0.5')

    return commands;
}





export function getError(com, area = 0, threshold = 0) {
    let areaN = getBezierCommandArea([com])
    let areaDiff = Math.abs(area - areaN)
    let error = areaDiff / threshold

    return error
}


export function getExtrapolatedCommand(com1, com2, t = 0) {

    let { p0, cp1 } = com1;
    let { p, cp2 } = com2;

    // extrapolate control points
    cp1 = {
        x: (cp1.x - (1 - t) * p0.x) / t,
        y: (cp1.y - (1 - t) * p0.y) / t
    };

    cp2 = {
        x: (cp2.x - t * p.x) / (1 - t),
        y: (cp2.y - t * p.y) / (1 - t)
    };

    return { p0, cp1, cp2, p };
}


export function getBezierCommandArea(commands = [com1, com2], absolute = true) {

    let bezArea = 0;
    let polyArea = 0;
    let poly = [commands[0].p0];

    commands.forEach(com => {
        bezArea += getBezierArea([com.p0, com.cp1, com.cp2, com.p])
        poly.push(com.p)

    })
    polyArea += getPolygonArea(poly)
    return Math.abs(bezArea + polyArea);

}


export function findSplitT(com1, com2) {

    let len3 = getDistance(com1.cp2, com1.p)
    let len4 = getDistance(com1.cp2, com2.cp1)

    let t = Math.min(len3) / len4

    return t
}






