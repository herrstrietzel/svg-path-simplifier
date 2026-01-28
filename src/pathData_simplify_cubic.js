import { getCombinedByDominant } from "./pathData_simplify_cubic_extrapolate";
import { getDistance, getSquareDistance, checkLineIntersection, pointAtT, getDistAv, interpolate } from "./svgii/geometry";
import { getBezierArea, getPolygonArea } from "./svgii/geometry_area";
import { renderPoint } from "./svgii/visualize";



function findSplitParameter(com1, com2) {

    let chordLength1 = getDistance(com1.p0, com1.p);
    let totalChord = getDistance(com1.p0, com2.p);

    let t = chordLength1 / totalChord;

    return refineParameter(com1, com2, t);

    return t
}

function refineParameter(com1, com2, tEstimate, maxIterations = 10) {
    let t = tEstimate;

    for (let i = 0; i < maxIterations; i++) {
        // Calculate error based on Q2 and R1 relationships
        const P0 = com1.p0;
        const P3 = com2.p;

        // Reconstruct P1 and P2 at current t
        const P1 = {
            x: (com1.cp1.x - (1 - t) * P0.x) / t,
            y: (com1.cp1.y - (1 - t) * P0.y) / t
        };

        const P2 = {
            x: (com2.cp2.x - t * P3.x) / (1 - t),
            y: (com2.cp2.y - t * P3.y) / (1 - t)
        };

        // Calculate what Q2 and R1 should be
        const Q1 = interpolate(P0, P1, t);
        const P1P2_mid = interpolate(P1, P2, t);
        const Q2_calc = interpolate(Q1, P1P2_mid, t);

        const P2P3_mid = interpolate(P2, P3, t);
        const R1_calc = interpolate(P1P2_mid, P2P3_mid, t);

        // Calculate errors
        const errorQ2 = getDistance(Q2_calc, com1.cp2);
        const errorR1 = getDistance(R1_calc, com2.cp1);
        const totalError = errorQ2 + errorR1;

        if (totalError < 1e-9) {
            break;
        }

        // Simple adjustment - in practice you'd use proper Newton step
        t = t * 0.5 + 0.5 * (errorQ2 < errorR1 ? t + 0.01 : t - 0.01);
        t = Math.max(0.001, Math.min(0.999, t));
    }

    return t;
}



export function combineCubicPairs(com1, com2, extrapolateDominant = false, tolerance = 1) {

    let commands = [com1, com2];
    let t = findSplitT(com1, com2);

    //threshold = 0.01

    let distAv1 = getDistAv(com1.p0, com1.p);
    let distAv2 = getDistAv(com2.p0, com2.p);
    let distMin = Math.min(distAv1, distAv2)
    //let distMax = Math.max(distAv1, distAv2)

    let distScale = 0.05
    let maxDist = distMin * distScale * tolerance
    //tolerance = distMax * threshold

    let comS = getExtrapolatedCommand(com1, com2, t, t)

    // test on path point against original
    let pt = pointAtT([comS.p0, comS.cp1, comS.cp2, comS.p], t)


    //let tolerance = Math.min(Math.max(com1.dimA, com2.dimA), Math.min(com1.dimA, com2.dimA)) * 0.05

    let dist0 = getDistAv(com1.p, pt)
    let dist1 = 0, dist2 = 0;
    let close = dist0 < maxDist;
    let success = false;

    // collect error data
    let error = dist0;



    /*
    if (com2.directionChange) {
        //renderPoint(markers, com2.p0)
    }
    */

    //console.log('tolerance', tolerance, close, dist0);

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


    
    /*
    if (extrapolateDominant && com2.extreme) {
        renderPoint(markers, com2.p)
        //renderPoint(markers, com1.p, 'cyan')
        //extrapolateDominant = false;
    }
    */


    

    // try extrapolated dominant curve
    //&& !com2.extreme
    //  && !com1.extreme
    if (extrapolateDominant && !success  ) {

        let combinedEx = getCombinedByDominant(com1, com2, maxDist, tolerance);

        //console.log('???combinedEx', combinedEx);

        if(combinedEx.length===1){
            success = true
            comS = combinedEx[0]
            error = comS.error

            //console.log('!!!combinedEx', combinedEx);
        }

    
    }

    // add meta
    if (success) {

        //comS.dimA = (Math.abs(comS.p0.x - comS.p.x) + Math.abs(comS.p0.y - comS.p.y)) / 2

        
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

        //console.log('commands combined', commands);

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


export function getExtrapolatedCommand(com1, com2, t1 = 0, t2 = 0) {

    let { p0, cp1 } = com1;
    let { p, cp2 } = com2;

    // extrapolate control points
    let cp1_S = {
        x: (cp1.x - (1 - t1) * p0.x) / t1,
        y: (cp1.y - (1 - t1) * p0.y) / t1
    };


    let cp2_S = {
        x: (cp2.x - t2 * p.x) / (1 - t2),
        y: (cp2.y - t2 * p.y) / (1 - t2)
    };

    let comS = { p0, cp1: cp1_S, cp2: cp2_S, p };
    //let pt = pointAtT([p0, cp1_S, cp2_S, p], (t1 + t2) / 2);

    return comS

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


function findSplitT(com1, com2) {

    //let selfIntersecting = false

    // control tangent intersection
    let pt1 = checkLineIntersection(com1.p0, com1.cp1, com2.cp2, com2.p, false)

    // intersection 2nd cp1 tangent and global tangent intersection
    let ptI = checkLineIntersection(pt1, com2.p, com2.p0, com2.cp1, false)


    let len1 = getDistance(pt1, com2.p)
    let len2 = getDistance(ptI, com2.p)

    //let t = !t3 ? 1-len2/len1 : (t3+len2/len1)*0.5
    let t = 1 - len2 / len1


    // check self intersections
    //let ptI2 = checkLineIntersection(com1.cp1, com2.cp2, com1.p0, com2.p, true)
    //let hasInfliction = ptI2!==null


    let len3 = getDistance(com1.cp2, com1.p)
    let len4 = getDistance(com1.cp2, com2.cp1)

    //let t5 = 1-Math.min(len7, len8)/len9
    t = Math.min(len3) / len4

    //console.log('???selfIntersecting:', t, hasInfliction, ptI2)

    return t


}






