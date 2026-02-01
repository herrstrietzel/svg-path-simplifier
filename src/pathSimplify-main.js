import { detectInputType } from './detect_input';
import { combineCubicPairs } from './pathData_simplify_cubic';
import { getPathDataVertices, pointAtT } from './svgii/geometry';
import { getPolyBBox } from './svgii/geometry_bbox';
import { analyzePathData } from './svgii/pathData_analyze';
import { combineArcs, convertPathData, cubicCommandToArc, revertCubicQuadratic } from './svgii/pathData_convert';
import { parsePathDataNormalized } from './svgii/pathData_parse';
import { shapeElToPath } from './svgii/pathData_parse_els';
import { pathDataRemoveColinear } from './svgii/pathData_remove_collinear';
import { removeOrphanedM } from './svgii/pathData_remove_orphaned';
import { removeZeroLengthLinetos } from './svgii/pathData_remove_zerolength';
import { optimizeClosePath, pathDataToTopLeft } from './svgii/pathData_reorder';
import { reversePathData } from './svgii/pathData_reverse';
import { addExtremePoints, splitSubpaths } from './svgii/pathData_split';
import { pathDataToD } from './svgii/pathData_stringify';
//import { pathDataToPolyPlus, pathDataToPolySingle } from './svgii/pathData_toPolygon';
import { analyzePoly } from './svgii/poly_analyze';
import { getCurvePathData } from './svgii/poly_to_pathdata';
import { detectAccuracy } from './svgii/rounding';
import { refineAdjacentExtremes } from './svgii/simplify_refineExtremes';
import { cleanUpSVG, removeEmptySVGEls, stringifySVG } from './svgii/svg_cleanup';
import { renderPoint } from './svgii/visualize';

export function svgPathSimplify(input = '', {

    // return svg markup or object
    getObject = false,

    toAbsolute = true,
    toRelative = true,
    toShorthands = true,
    //optimize = 0,

    // not necessary unless you need cubics only
    quadraticToCubic = true,

    // mostly a fallback if arc calculations fail      
    arcToCubic = false,
    cubicToArc = false,


    simplifyBezier = true,
    optimizeOrder = true,
    removeColinear = true,
    flatBezierToLinetos = true,
    revertToQuadratics = true,

    refineExtremes = true,
    keepExtremes = true,
    keepCorners = true,
    extrapolateDominant = true,
    keepInflections = false,
    addExtremes = false,
    removeOrphanSubpaths = false,


    // svg path optimizations
    decimals = 3,
    autoAccuracy = true,

    minifyD = 0,
    tolerance = 1,
    reverse = false,

    // svg cleanup options
    mergePaths = false,
    removeHidden = true,
    removeUnused = true,
    shapesToPaths = true,


} = {}) {

    // clamp tolerance 
    tolerance = Math.max(0.1, tolerance);

    let inputType = detectInputType(input);

    let svg = '';
    let svgSize = 0;
    let svgSizeOpt = 0;
    let compression = 0;
    let report = {};
    let d = '';
    let mode = inputType === 'svgMarkup' ? 1 : 0;

    let paths = []


    /**
     * normalize input
     * switch mode
     */

    // original size
    svgSize = new Blob([input]).size;

    // single path
    if (!mode) {
        if (inputType === 'pathDataString') {
            d = input
        } else if (inputType === 'polyString') {
            d = 'M' + input
        }
        paths.push({ d, el: null })
    }
    // process svg
    else {
        //sanitize
        let returnDom = true
        svg = cleanUpSVG(input, { returnDom, removeHidden, removeUnused }
        );

        if(shapesToPaths){
            let shapes = svg.querySelectorAll('polygon, polyline, line, rect, circle, ellipse');
            shapes.forEach(shape=>{
                let path = shapeElToPath(shape);
                shape.replaceWith(path)
            })
        }

        // collect paths
        let pathEls = svg.querySelectorAll('path')
        pathEls.forEach(path => {
            paths.push({ d: path.getAttribute('d'), el: path })
        })
    }

    //console.log(paths);
    //console.log('inputType', inputType, 'mode',  mode);

    /**
     * process all paths
     */

    // SVG optimization options
    let pathOptions = {
        toRelative,
        toShorthands,
        decimals,
    }

    // combinded path data for SVGs with mergePaths enabled
    let pathData_merged = [];

    paths.forEach(path => {
        let { d, el } = path;

        ///let t0 = performance.now()
        let pathDataO = parsePathDataNormalized(d, { quadraticToCubic, toAbsolute, arcToCubic });
        //console.log('pathDataO', pathDataO);

        // count commands for evaluation
        let comCount = pathDataO.length


        // create clone for fallback
        //let pathData = JSON.parse(JSON.stringify(pathDataO));
        let pathData = pathDataO;
        //let t1 = performance.now() - t0;
        //console.log('t1', t1);


        if(removeOrphanSubpaths) pathData = removeOrphanedM(pathData);

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

            //let pathDataN = pathData;

            //console.log(pathDataPlus);
            //let t0=performance.now()
            pathData = simplifyBezier ? simplifyPathDataCubic(pathData, { simplifyBezier, keepInflections, keepExtremes, keepCorners, extrapolateDominant, revertToQuadratics, tolerance, reverse }) : pathData;
            //let t1=performance.now() - t0;
            //console.log('t1', t1);


            // refine extremes
            if(refineExtremes){
                let thresholdEx = (bb.width + bb.height) / 2 * 0.05
                pathData = refineAdjacentExtremes(pathData, {threshold:thresholdEx, tolerance})
            }


            // cubic to arcs
            if (cubicToArc) {

                let thresh = 3;

                pathData.forEach((com, c) => {
                    let { type, values, p0, cp1 = null, cp2 = null, p = null } = com;
                    if (type === 'C') {
                        //console.log(com);
                        let comA = cubicCommandToArc(p0, cp1, cp2, p, thresh)
                        if (comA.isArc) pathData[c] = comA.com;
                        //if (comQ.type === 'Q') pathDataN[c] = comQ
                    }
                })

                // combine adjacent cubics
                pathData = combineArcs(pathData)

            }





            // simplify to quadratics
            if (revertToQuadratics) {
                pathData.forEach((com, c) => {
                    let { type, values, p0, cp1 = null, cp2 = null, p = null } = com;
                    if (type === 'C') {
                        //console.log(com);
                        let comQ = revertCubicQuadratic(p0, cp1, cp2, p)
                        if (comQ.type === 'Q') {
                            /*
                            comQ.p0 = com.p0
                            comQ.cp1 = {x:comQ.values[0], y:comQ.values[1]}
                            comQ.p = com.p
                            */
                            comQ.extreme = com.extreme
                            comQ.corner = com.corner
                            comQ.dimA = com.dimA

                            pathData[c] = comQ
                        }
                    }
                })
            }

            //if (removeColinear) pathDataSub = pathDataRemoveColinear(pathDataSub, tolerance, flatBezierToLinetos);


            // optimize close path
            if (optimizeOrder) pathData = optimizeClosePath(pathData)

            // poly
            //let poly = pathDataToPolySingle(pathData, true)
            //console.log('poly', poly);


            // update
            pathDataArrN.push(pathData)
        }

        // flatten compound paths 
        pathData = pathDataArrN.flat();


        // collect for merged svg paths 
        if (el && mergePaths) {
            pathData_merged.push(...pathData)
        }
        // single output
        else {

            /**
             * detect accuracy
             */
            if (autoAccuracy) {
                decimals = detectAccuracy(pathData)
                pathOptions.decimals = decimals
                //console.log('!decimals', decimals);
            }

            //console.log('autoAccuracy', autoAccuracy, decimals);

            // optimize path data
            pathData = convertPathData(pathData, pathOptions)

            // remove zero-length segments introduced by rounding
            pathData = removeZeroLengthLinetos(pathData);

            // compare command count
            let comCountS = pathData.length

            let dOpt = pathDataToD(pathData, minifyD)
            svgSizeOpt = new Blob([dOpt]).size;
            compression = +(100 / svgSize * (svgSizeOpt)).toFixed(2)


            path.d = dOpt
            path.report = {
                original: comCount,
                new: comCountS,
                saved: comCount - comCountS,
                compression,
                decimals,
                //success: comCountS < comCount
            }

            // apply new path for svgs
            if (el) el.setAttribute('d', dOpt)
        }
    });

    /**
     *  stringify new SVG
     */
    if (mode) {

        if (pathData_merged.length) {
            // optimize path data
            let pathData = convertPathData(pathData_merged, pathOptions)

            // remove zero-length segments introduced by rounding
            //pathData = removeZeroLengthLinetos_post(pathData);
            pathData = removeZeroLengthLinetos(pathData);


            let dOpt = pathDataToD(pathData, minifyD)


            // apply new path for svgs
            paths[0].el.setAttribute('d', dOpt)


            // remove other paths
            for (let i = 1; i < paths.length; i++) {
                let pathEl = paths[i].el
                if (pathEl) pathEl.remove()
            }

            // remove empty groups e.g groups
            removeEmptySVGEls(svg);
        }



        svg = stringifySVG(svg);
        svgSizeOpt = new Blob([svg]).size
        //compression = +(100/svgSize * (svgSize-svgSizeOpt)).toFixed(2)
        compression = +(100 / svgSize * (svgSizeOpt)).toFixed(2)

        svgSize = +(svgSize / 1024).toFixed(3)
        svgSizeOpt = +(svgSizeOpt / 1024).toFixed(3)

        report = {
            svgSize,
            svgSizeOpt,
            compression
        }

    } else {
        ({ d, report } = paths[0]);
    }


    return !getObject ? (d ? d : svg) : { svg, d, report, inputType, mode };

}



function simplifyPathDataCubic(pathData, {
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

                    // add cumulative error to prevent distortions
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

    // reverse back
    if (reverse) pathDataN = reversePathData(pathDataN)

    return pathDataN
}



