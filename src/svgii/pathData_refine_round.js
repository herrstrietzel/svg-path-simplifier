import { checkLineIntersection, getAngle, getDistAv, getDistance, getPointOnEllipse, getSquareDistance, pointAtT, rotatePoint } from "./geometry";
import { getPolygonArea } from "./geometry_area";
import { getArcFromPoly } from "./geometry_deduceRadius";
import { arcToBezierResolved, revertCubicQuadratic } from "./pathData_convert";
import { pathDataToD } from "./pathData_stringify";
import { renderPath, renderPoint, renderPoly } from "./visualize";

export function refineRoundSegments(pathData, {
    threshold = 0,
    tolerance = 1,
    // take arcs or cubic beziers
    toCubic = false,
    debug = false
} = {}) {


    // min size threshold for corners
    threshold *= tolerance;

    let l = pathData.length;

    // add fist command
    let pathDataN = [pathData[0]]

    // just for debugging
    let pathDataTest = []

    for (let i = 1; i < l; i++) {
        let com = pathData[i];
        let { type } = com;
        let comP = pathData[i - 1];
        let comN = pathData[i + 1] ? pathData[i + 1] : null;
        let comN2 = pathData[i + 2] ? pathData[i + 2] : null;
        let comN3 = pathData[i + 3] ? pathData[i + 3] : null;
        let comBez = null;

        if ((com.type === 'C' || com.type === 'Q')) comBez = com;
        else if (comN && (comN.type === 'C' || comN.type === 'Q')) comBez = comN;


        let cpts = comBez ? (comBez.type === 'C' ? [comBez.p0, comBez.cp1, comBez.cp2, comBez.p] : [comBez.p0, comBez.cp1, comBez.p]) : []

        let areaBez = 0;
        let areaLines = 0;
        let signChange = false;
        let L1, L2;
        let combine = false

        let p0_S, p_S;
        let poly = []
        let pMid;


        // 2. line-line-bezier-line-line
        if (
            comP.type === 'L' &&
            type === 'L' &&
            comBez &&
            comN2.type === 'L' &&
            comN3 && (comN3.type === 'L' || comN3.type === 'Z')
        ) {

            L1 = [com.p0, com.p];
            L2 = [comN2.p0, comN2.p];
            p0_S = com.p0
            p_S = comN2.p

            // don't allow sign changes
            areaBez = getPolygonArea(cpts, false)
            areaLines = getPolygonArea([...L1, ...L2], false)
            signChange = (areaBez < 0 && areaLines > 0) || (areaBez > 0 && areaLines < 0)

            if (!signChange) {

                // mid point of mid bezier
                pMid = pointAtT(cpts, 0.5)

                // add to poly
                poly = [p0_S, pMid, p_S]

                combine = true
            }

        }

        // 1. line-bezier-bezier-line
        else if ((type === 'C' || type === 'Q') && comP.type === 'L') {

            // 1.2 next is cubic next is lineto
            if ((comN.type === 'C' || comN.type === 'Q') && comN2.type === 'L') {

                combine = true

                L1 = [comP.p0, comP.p];
                L2 = [comN2.p0, comN2.p];
                p0_S = comP.p
                p_S = comN2.p0

                // mid point of mid bezier
                pMid = comBez.p

                // add to poly
                poly = [p0_S, comBez.p, p_S]


            }
        }


        /**
         * calculate either combined
         * cubic or arc commands
         */
        if (combine) {


            // try to find center of arc
            let arcProps = getArcFromPoly(poly)
            if (arcProps) {

                let { centroid, r, deltaAngle, startAngle, endAngle } = arcProps;

                let xAxisRotation = 0;
                let sweep = deltaAngle > 0 ? 1 : 0;
                let largeArc = Math.abs(deltaAngle) > Math.PI ? 1 : 0;

                let pCM = rotatePoint(p0_S, centroid.x, centroid.y, deltaAngle * 0.5)


                let dist2 = getDistAv(pCM, pMid)
                let thresh = getDistAv(p0_S, p_S) * 0.05
                let bezierCommands;

                // point is close enough
                if (dist2 < thresh) {

                    //toCubic = false;

                    bezierCommands = arcToBezierResolved(
                        {
                            p0: p0_S,
                            p: p_S,
                            centroid,
                            rx: r,
                            ry: r,
                            xAxisRotation,
                            sweep,
                            largeArc,
                            deltaAngle,
                            startAngle,
                            endAngle
                        }
                    );

                    if(bezierCommands.length === 1){

                        // prefer more compact quadratic - otherwise arcs
                        let comBezier = revertCubicQuadratic(p0_S, bezierCommands[0].cp1, bezierCommands[0].cp2, p_S)

                        if (comBezier.type === 'Q') {
                            toCubic = true
                        }

                        com = comBezier
                    }


                    // prefer arcs if 2 cubics are required
                    if (bezierCommands.length > 1) toCubic = false;


                    //toCubic = false

                    // return elliptic arc commands
                    if (!toCubic) {
                        // rewrite simplified command
                        com.type = 'A'
                        com.values = [r, r, xAxisRotation, largeArc, sweep, p_S.x, p_S.y];
                    }

                    com.p0 = p0_S;
                    com.p = p_S;
                    com.extreme = false;
                    com.corner = false;

                    // test rendering
                    //debug=true

                    if (debug) {
                        // arcs
                        if (!toCubic) {
                            pathDataTest = [
                                { type: 'M', values: [p0_S.x, p0_S.y] },
                                { type: 'A', values: [r, r, xAxisRotation, largeArc, sweep, p_S.x, p_S.y] },
                            ]
                        }
                        // cubics
                        else {
                            pathDataTest = [
                                { type: 'M', values: [p0_S.x, p0_S.y] },
                                ...bezierCommands
                            ]
                        }

                        let d = pathDataToD(pathDataTest);
                        renderPath(markers, d, 'orange', '0.5%', '0.5')
                    }

                    pathDataN.push(com);
                    i++
                    continue

                }
            }
        }

        // pass through
        pathDataN.push(com)
    }

    return pathDataN;
}
