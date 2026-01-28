import { combineCubicPairs } from './pathData_simplify_cubic';
import { getPathDataVertices, pointAtT } from './svgii/geometry';
import { getPolyBBox } from './svgii/geometry_bbox';
import { analyzePathData, analyzePathData2 } from './svgii/pathData_analyze';
import { combineArcs, convertPathData, cubicCommandToArc, revertCubicQuadratic } from './svgii/pathData_convert';
import { parsePathDataNormalized } from './svgii/pathData_parse';
import { pathDataRemoveColinear } from './svgii/pathData_remove_collinear';
import { removeZeroLengthLinetos } from './svgii/pathData_remove_zerolength';
import { pathDataToTopLeft } from './svgii/pathData_reorder';
import { reversePathData } from './svgii/pathData_reverse';
import { addExtremePoints, splitSubpaths } from './svgii/pathData_split';
import { pathDataToD } from './svgii/pathData_stringify';
import { pathDataToPolyPlus } from './svgii/pathData_toPolygon';
import { analyzePoly } from './svgii/poly_analyze';
import { getCurvePathData } from './svgii/poly_to_pathdata';
import { detectAccuracy } from './svgii/rounding';
import { renderPoint } from './svgii/visualize';

export function svgPathSimplify(d = '', {
    toAbsolute = true,
    toRelative = true,
    toShorthands = true,
    decimals = 3,
    //optimize = 0,

    // not necessary unless you need cubics only
    quadraticToCubic = true,

    // mostly a fallback if arc calculations fail      
    arcToCubic = false,
    cubicToArc = false,

    // arc to cubic precision - adds more segments for better precision     
    arcAccuracy = 4,
    keepExtremes = true,
    keepCorners = true,
    keepInflections = true,
    extrapolateDominant = false,
    addExtremes = false,
    optimizeOrder = true,
    removeColinear = true,
    simplifyBezier = true,
    autoAccuracy = true,
    flatBezierToLinetos = true,
    revertToQuadratics = true,
    minifyD = 0,
    tolerance = 1,
    reverse = false
} = {}) {


    let pathDataO = parsePathDataNormalized(d, { quadraticToCubic, toAbsolute, arcToCubic });

    // create clone for fallback
    let pathData = JSON.parse(JSON.stringify(pathDataO));

    // count commands for evaluation
    let comCount = pathDataO.length

    /**
     * get sub paths
     */
    let subPathArr = splitSubpaths(pathData);

    // cleaned up pathData
    let pathDataArrN = [];

    for (let i = 0, l = subPathArr.length; i < l; i++) {

        //let { pathData, bb } = subPathArr[i];
        let pathDataSub = subPathArr[i];

        // try simplification in reversed order
        if (reverse) pathDataSub = reversePathData(pathDataSub);

        // remove zero length linetos
        if (removeColinear) pathDataSub = removeZeroLengthLinetos(pathDataSub)

        // add extremes
        //let tMin=0.2, tMax=0.8;
        let tMin = 0, tMax = 1;
        if (addExtremes) pathDataSub = addExtremePoints(pathDataSub, tMin, tMax)


        // sort to top left
        if (optimizeOrder) pathDataSub = pathDataToTopLeft(pathDataSub);

        // remove colinear/flat
        if (removeColinear) pathDataSub = pathDataRemoveColinear(pathDataSub, tolerance, flatBezierToLinetos);

        // analyze pathdata to add info about signicant properties such as extremes, corners
        let pathDataPlus = analyzePathData(pathDataSub);


        // simplify beziers
        let { pathData, bb, dimA } = pathDataPlus;





        let pathDataN = pathData;



        
        pathDataN = simplifyBezier ? simplifyPathData(pathDataN, { simplifyBezier, keepInflections, keepExtremes, keepCorners, extrapolateDominant, revertToQuadratics, tolerance, reverse }) : pathDataN;



        // cubic to arcs
        if(cubicToArc){

            let thresh = 3;

            pathDataN.forEach((com, c) => {
                let { type, values, p0, cp1 = null, cp2 = null, p = null } = com;
                if (type === 'C') {
                    //console.log(com);
                    let comA = cubicCommandToArc(p0, cp1, cp2, p, thresh)
                    if(comA.isArc) pathDataN[c] = comA.com;
                    //if (comQ.type === 'Q') pathDataN[c] = comQ
                }
            })

            // combine adjacent cubics
            pathDataN = combineArcs(pathDataN)

        }


        // simplify to quadratics
        if (revertToQuadratics) {
            pathDataN.forEach((com, c) => {
                let { type, values, p0, cp1 = null, cp2 = null, p = null } = com;
                if (type === 'C') {
                    //console.log(com);
                    let comQ = revertCubicQuadratic(p0, cp1, cp2, p)
                    if (comQ.type === 'Q') pathDataN[c] = comQ
                }
            })
        }




        // update
        pathDataArrN.push(pathDataN)
    }


    // merge pathdata
    let pathDataFlat = pathDataArrN.flat();

    /**
     * detect accuracy
     */
    if (autoAccuracy) {
        decimals = detectAccuracy(pathDataFlat)
    }



    // compare command count
    let comCountS = pathDataFlat.length

    // optimize
    let pathOptions = {
        toRelative,
        toShorthands,
        decimals,
    }


    // optimize path data
    pathData = convertPathData(pathDataFlat, pathOptions)
    let dOpt = pathDataToD(pathData, minifyD)

    let report = {
        original: comCount,
        new: comCountS,
        saved: comCount - comCountS,
        decimals,
        success: comCountS < comCount
    }

    return { pathData, d: dOpt, report };


}



function simplifyPathData(pathData, {
    keepExtremes = true,
    keepInflections = true,
    keepCorners = true,
    extrapolateDominant = true,
    tolerance = 1,
    reverse = false
} = {}) {

    let pathDataN = [pathData[0]];

    for (let i = 2, l = pathData.length; l && i <= l; i++) {
        let com = pathData[i - 1];
        let comN = i < l ? pathData[i] : null;
        let typeN = comN?.type || null;
        //let isCornerN = comN?.corner || null;
        //let isExtremeN = comN?.extreme || null;
        let isDirChange = com?.directionChange || null;
        let isDirChangeN = comN?.directionChange || null;

        let { type, values, p0, p, cp1 = null, cp2 = null, extreme = false, corner = false, dimA = 0 } = com;

        // count simplifications
        let success = 0;

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
                let combined = combineCubicPairs(com, comN, extrapolateDominant, tolerance)
                let error = 0;

                // combining successful! try next segment
                if (combined.length === 1) {
                    com = combined[0]
                    let offset = 1;
                    error += com.error;
                    //console.log('!error', error);

                    // find next candidates
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

                        let combined = combineCubicPairs(com, comN, extrapolateDominant, tolerance)
                        if (combined.length === 1) {
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

    // reverse back
    if (reverse) pathDataN = reversePathData(pathDataN)

    return pathDataN
}



