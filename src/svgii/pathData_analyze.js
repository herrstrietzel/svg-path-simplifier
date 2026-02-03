import { splitSubpaths } from './pathData_split.js';
import { getAngle, bezierhasExtreme, getPathDataVertices, svgArcToCenterParam, getSquareDistance, getDistAv } from "./geometry.js";
import { getPolygonArea, getPathArea } from './geometry_area.js';
import { getPolyBBox } from './geometry_bbox.js';
import { renderPoint, renderPath } from "./visualize.js";
import { commandIsFlat } from './geometry_flatness.js';



/**
 * analyze path data for
 * decimal detection
 * sub paths 
 * directions
 * crucial geometry properties
 */


export function addDimensionData(pathData) {

    let M = { x: pathData[0].values[0], y: pathData[0].values[1] };
    let p0 = { x: pathData[0].values[0], y: pathData[0].values[1] };
    let p;

    pathData[0].dimA = 0;
    let len = pathData.length

    for (let c = 2; len && c <= len; c++) {

        let com = pathData[c - 1];
        let { type, values } = com;
        let valsL = values.slice(-2);

        p = valsL.length ? { x: valsL[0], y: valsL[1] } : M;

        // update M for Z starting points
        if (type === 'M') {
            M = p;
        }
        else if (type.toLowerCase() === 'z') {
            p = M;
        }

        let dimA = getDistAv(p0, p);
        com.dimA = dimA;
        com.p0 = p0
        com.p = p


        if(type==='C' || type==='Q') com.cp1 = {x:values[0], y:values[1]}
        if(type==='C' ) com.cp2 = {x:values[2], y:values[3]}

        p0=p
    }


    console.log('!!!pathData', pathData);
    return pathData
}


export function analyzePathData(pathData = []) {

    let pathDataPlus = [];

    let pathPoly = getPathDataVertices(pathData);
    let bb = getPolyBBox(pathPoly)
    let { left, right, top, bottom, width, height } = bb;

    // initial starting point coordinates
    let M0 = { x: pathData[0].values[0], y: pathData[0].values[1] };
    let M = { x: pathData[0].values[0], y: pathData[0].values[1] };
    let p0 = { x: pathData[0].values[0], y: pathData[0].values[1] };
    let p;

    // init starting point data
    pathData[0].idx = 0;
    pathData[0].p0 = M;
    pathData[0].p = M;
    pathData[0].lineto = false;
    pathData[0].corner = false;
    pathData[0].extreme = false;
    pathData[0].directionChange = false;
    pathData[0].closePath = false;
    pathData[0].dimA = 0;


    // add first M command
    let pathDataProps = [pathData[0]];
    let area0 = 0;
    let len = pathData.length;

    for (let c = 2; len && c <= len; c++) {

        let com = pathData[c - 1];
        let { type, values } = com;
        let valsL = values.slice(-2);

        /**
         * get command points for 
         * flatness checks:
         * this way we can skip certain tests
         */
        let commandPts = [p0];
        let isFlat = false;

        // init properties
        com.idx = c - 1;
        com.lineto = false;
        com.corner = false;
        com.extreme = false;
        com.directionChange = false;
        com.closePath = false;
        com.dimA = 0;
        //com.flat = false;


        /**
         * define angle threshold for 
         * corner detection
         */
        let angleThreshold = 0.05
        p = valsL.length ? { x: valsL[0], y: valsL[1] } : M;


        // update M for Z starting points
        if (type === 'M') {
            M = p;
            p0 = p
        }
        else if (type.toLowerCase() === 'z') {
            p = M;
        }

        // add on-path points
        com.p0 = p0;
        com.p = p;

        let cp1, cp2, cp1N, cp2N, pN, typeN, area1;

        //let dimA = (width + height) / 2;
        let dimA = getDistAv(p0, p);
        com.dimA = dimA;
        //com.a = dimA;



        /**
         * explicit and implicit linetos 
         * - introduced by Z
         */
        if (type === 'L') com.lineto = true;

        if (type === 'Z') {
            com.closePath = true;
            // if Z introduces an implicit lineto with a length
            if (M.x !== M0.x && M.y !== M0.y) {
                com.lineto = true;
            }
        }

        // if bezier
        if (type === 'Q' || type === 'C') {
            cp1 = { x: values[0], y: values[1] }
            cp2 = type === 'C' ? { x: values[2], y: values[3] } : null;
            com.cp1 = cp1;
            if (cp2) com.cp2 = cp2;
        }


        /**
         * check command flatness
         * we leave it to the bezier simplifier
         * to convert flat beziers to linetos
         * otherwise we may strip rather flat starting segments
         * preventing a better simplification
         */

        if (values.length > 2) {
            if (type === 'Q' || type === 'C') commandPts.push(cp1);
            if (type === 'C') commandPts.push(cp2);
            commandPts.push(p);

            /*
            //let commandFlatness = commandIsFlat(commandPts);
            let commandFlatness = commandIsFlat(commandPts);
            isFlat = commandFlatness.flat;
            com.flat = isFlat;

            if (isFlat) {
                com.extreme = false;
                //renderPoint(markers, p, 'red', '1%', '0.5')
            }
            */

        }

        /**
         * is extreme relative to bounding box 
         * in case elements are rotated we can't rely on 90degree angles
         * so we interpret maximum x/y on-path points as well as extremes
         * but we ignore linetos to allow chunk compilation
         */
        if (!isFlat && type !== 'L' && (p.x === left || p.y === top || p.x === right || p.y === bottom)) {
            com.extreme = true;
        }


        //next command
        let comN = pathData[c] ? pathData[c] : null;
        let comNValsL = comN ? comN.values.slice(-2) : null;
        typeN = comN ? comN.type : null;


        // get bezier control points
        if (comN && (comN.type === 'Q' || comN.type === 'C')) {
            pN = comN ? { x: comNValsL[0], y: comNValsL[1] } : null;

            cp1N = { x: comN.values[0], y: comN.values[1] }
            cp2N = comN.type === 'C' ? { x: comN.values[2], y: comN.values[3] } : null;
        }


        /**
         * Detect direction change points
         * this will prevent distortions when simplifying
         * e.g in the "spine" of an "S" glyph
         */
        area1 = getPolygonArea(commandPts)
        let signChange = (area0 < 0 && area1 > 0) || (area0 > 0 && area1 < 0) ? true : false;
        // update area
        area0 = area1

        if (signChange) {
            //renderPoint(svg1, p0, 'orange', '1%', '0.75')
            com.directionChange = true;
        }


        /**
         * check extremes or corners 
         * for adjacent curves by 
         * control point angles
         */
        if ((type === 'Q' || type === 'C')) {

            if ((type === 'Q' && typeN === 'Q') || (type === 'C' && typeN === 'C')) {

                // check extremes
                let cpts = commandPts.slice(1);

                let w = pN ? Math.abs(pN.x - p0.x) : 0
                let h = pN ? Math.abs(pN.y - p0.y) : 0
                let thresh = (w + h) / 2 * 0.1;
                let pts1 = type === 'C' ? [p, cp1N, cp2N, pN] : [p, cp1N, pN];

                //let flatness2 = commandIsFlat(pts1, thresh)
                //let isFlat2 = flatness2.flat;

                /**
                 * if current and next cubic are flat
                 * we don't flag them as extremes to allow simplification
                 */
                //let hasExtremes = (isFlat && isFlat2) ? false : (!com.extreme ? bezierhasExtreme(p0, cpts, angleThreshold) : true);

                let hasExtremes = (isFlat) ? false : (!com.extreme ? bezierhasExtreme(p0, cpts, angleThreshold) : true);


                //let bezierExtreme = bezierhasExtreme(p0, cpts, angleThreshold);

                //console.log(isFlat, isFlat2, cpts, hasExtremes, 'com.extreme', com.extreme, 'commandPts', commandPts);

                if (hasExtremes) {
                    com.extreme = true
                }

                // check corners
                else {

                    let cpts1 = cp2 ? [cp2, p] : [cp1, p];
                    let cpts2 = cp2 ? [p, cp1N] : [p, cp1N];

                    let angCom1 = getAngle(...cpts1, true)
                    let angCom2 = getAngle(...cpts2, true)
                    let angDiff = Math.abs(angCom1 - angCom2) * 180 / Math.PI


                    let cpDist1 = getSquareDistance(...cpts1)
                    let cpDist2 = getSquareDistance(...cpts2)

                    let cornerThreshold = 10
                    let isCorner = angDiff > cornerThreshold && cpDist1 && cpDist2

                    if (isCorner) {
                        com.corner = true;
                    }
                }
            }
        }


        pathDataProps.push(com)
        p0 = p;

    }


    let dimA = (width + height) / 2
    //pathDataPlus.push({ pathData: pathDataProps, bb: bb, dimA: dimA })
    pathDataPlus = { pathData: pathDataProps, bb: bb, dimA: dimA }

    //console.log('pathDataPlus', pathDataPlus);
    return pathDataPlus

}