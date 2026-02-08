import { detectInputType } from './detect_input';
import { simplifyPathDataCubic } from './pathData_simplify_cubic';
import { getPathDataVertices, pointAtT } from './svgii/geometry';
import { getPolyBBox } from './svgii/geometry_bbox';
import { analyzePathData } from './svgii/pathData_analyze';
import { combineArcs, combineCubicsToArcs, convertPathData, cubicCommandToArc, revertCubicQuadratic } from './svgii/pathData_convert';
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
import { refineAdjacentExtremes } from './svgii/pathData_simplify_refineExtremes';
import { cleanUpSVG, removeEmptySVGEls, stringifySVG } from './svgii/svg_cleanup';
import { renderPoint } from './svgii/visualize';
import { refineRoundedCorners } from './svgii/pathData_simplify_refineCorners';
import { refineRoundSegments } from './svgii/pathData_refine_round';
import { refineClosingCommand } from './svgii/pathData_remove_short';

//import { installDOMPolyfills } from './dom-polyfill';

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
    autoClose = true,
    removeZeroLength = true,
    refineClosing = true,
    removeColinear = true,
    flatBezierToLinetos = true,
    revertToQuadratics = true,

    refineExtremes = true,
    simplifyCorners = false,

    keepExtremes = true,
    keepCorners = true,
    extrapolateDominant = true,
    keepInflections = false,
    addExtremes = false,
    removeOrphanSubpaths = false,

    simplifyRound = false,


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
    //console.log(inputType);

    let paths = []

    /**
     * normalize input
     * switch mode
     */

    // original size
    //svgSize = new Blob([input]).size;
    svgSize = input.length;


    // mode:0 – single path
    if (!mode) {
        if (inputType === 'pathDataString') {
            d = input
        } else if (inputType === 'polyString') {
            d = 'M' + input
        }
        else if (inputType === 'pathData') {
            d = input;

            // stringify to compare lengths
            //let dStr = pathDataToD(d);
            let dStr = d.map(com => { return `${com.type} ${com.values.join(' ')}` }).join(' ');
            svgSize = dStr.length;

        }

        paths.push({ d, el: null })
    }
    // mode:1 – process complete svg DOM
    else {
        //sanitize
        let returnDom = true
        svg = cleanUpSVG(input, { returnDom, removeHidden, removeUnused }
        );

        if (shapesToPaths) {
            let shapes = svg.querySelectorAll('polygon, polyline, line, rect, circle, ellipse');
            shapes.forEach(shape => {
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



    /**
     * process all paths
     * try simplifications and removals
     */

    // SVG optimization options
    let pathOptions = {
        toRelative,
        toShorthands,
        decimals,
    }

    // combinded path data for SVGs with mergePaths enabled
    let pathData_merged = [];

    for (let i = 0, l = paths.length; l && i < l; i++) {

        let path = paths[i];
        let { d, el } = path;

        let pathData = parsePathDataNormalized(d, { quadraticToCubic, toAbsolute, arcToCubic });

        // count commands for evaluation
        let comCount = pathData.length

        if (removeOrphanSubpaths) pathData = removeOrphanedM(pathData);

        /**
         * get sub paths
         */
        let subPathArr = splitSubpaths(pathData);
        let lenSub = subPathArr.length;


        // cleaned up pathData
        //let pathDataArrN = new Array(lenSub);

        // reset array
        let pathDataPlusArr = []

        // loop sub paths
        for (let i = 0; i < lenSub; i++) {


            //let { pathData, bb } = subPathArr[i];
            let pathDataSub = subPathArr[i];


            // remove zero length linetos
            if (removeColinear || removeZeroLength) pathDataSub = removeZeroLengthLinetos(pathDataSub)
            //console.log(removeColinear, removeZeroLength);


            // add extremes
            //let tMin=0.2, tMax=0.8;
            let tMin = 0, tMax = 1;
            if (addExtremes) pathDataSub = addExtremePoints(pathDataSub, tMin, tMax)


            // sort to top left
            if (optimizeOrder) pathDataSub = pathDataToTopLeft(pathDataSub);


            // Preprocessing: remove colinear - ignore flat beziers (removed later)
            if (removeColinear) pathDataSub = pathDataRemoveColinear(pathDataSub, { tolerance, flatBezierToLinetos: false });


            // analyze pathdata to add info about signicant properties such as extremes, corners
            let pathDataPlus = analyzePathData(pathDataSub);

            //console.log('pathDataPlus', pathDataPlus);


            // simplify beziers
            let { pathData, bb, dimA } = pathDataPlus;


            if (refineClosing) pathData = refineClosingCommand(pathData, { threshold: dimA * 0.001 })


            pathData = simplifyBezier ? simplifyPathDataCubic(pathData, { simplifyBezier, keepInflections, keepExtremes, keepCorners, extrapolateDominant, revertToQuadratics, tolerance, reverse }) : pathData;

            // refine extremes
            if (refineExtremes) {
                let thresholdEx = (bb.width + bb.height) / 2 * 0.05
                pathData = refineAdjacentExtremes(pathData, { threshold: thresholdEx, tolerance })
            }


            // cubic to arcs
            if (cubicToArc) {

                let thresh = 1;

                //pathData = combineCubicsToArcs(pathData)


                for (let c = 0, l = pathData.length; c < l; c++) {
                    let com = pathData[c]
                    let { type, values, p0, cp1 = null, cp2 = null, p = null } = com;
                    if (type === 'C') {
                        //console.log(com);
                        let comA = cubicCommandToArc(p0, cp1, cp2, p, thresh)
                        if (comA.isArc) pathData[c] = comA.com;
                    }
                }

                // combine adjacent cubics
                pathData = combineArcs(pathData)

                /*
                */

            }


            // post processing: remove flat beziers
            if (removeColinear && flatBezierToLinetos) {
                pathData = pathDataRemoveColinear(pathData, { tolerance, flatBezierToLinetos });
            }


            // refine corners
            if (simplifyCorners) {
                //pathData = removeZeroLengthLinetos(pathData);

                let threshold = (bb.width + bb.height) / 2 * 0.1
                pathData = refineRoundedCorners(pathData, { threshold, tolerance })
            }

            // refine round segment sequences
            if (simplifyRound) pathData = refineRoundSegments(pathData);


            // simplify to quadratics
            if (revertToQuadratics) {
                for (let c = 0, l = pathData.length; c < l; c++) {
                    let com = pathData[c]
                    let { type, values, p0, cp1 = null, cp2 = null, p = null } = com;
                    if (type === 'C') {
                        //console.log(com);
                        let comQ = revertCubicQuadratic(p0, cp1, cp2, p)
                        if (comQ.type === 'Q') {
                            comQ.extreme = com.extreme
                            comQ.corner = com.corner
                            comQ.dimA = com.dimA

                            pathData[c] = comQ
                        }
                    }
                }
            }


            // optimize close path
            if (optimizeOrder) pathData = optimizeClosePath(pathData, { autoClose })

            // update
            //pathDataFlat.push(...pathData)
            //subPathArr[i]=pathData
            pathDataPlusArr.push({ pathData, bb })

        }

        // sort to top left
        if (optimizeOrder) pathDataPlusArr = pathDataPlusArr.sort((a, b) => a.bb.y - b.bb.y || a.bb.x - b.bb.x)

        // flatten compound paths 
        pathData = [];
        pathDataPlusArr.forEach(sub => {
            pathData.push(...sub.pathData)
        })

        //pathData = pathDataFlat;
        //pathData = subPathArr.flat();


        //console.log('pathData', pathData);

        if (autoAccuracy) {
            decimals = detectAccuracy(pathData)
            pathOptions.decimals = decimals
            //console.log('!decimals', decimals);
        }


        // collect for merged svg paths 
        if (el && mergePaths) {
            pathData_merged.push(...pathData)
        }
        // single output
        else {

            // optimize path data
            pathData = convertPathData(pathData, pathOptions)

            // remove zero-length segments introduced by rounding
            pathData = removeZeroLengthLinetos(pathData);

            // compare command count
            let comCountS = pathData.length

            let dOpt = pathDataToD(pathData, minifyD)
            //svgSizeOpt = new Blob([dOpt]).size;
            svgSizeOpt = dOpt.length

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
    };

    /**
     *  stringify new SVG
     */
    if (mode) {

        if (pathData_merged.length) {

            // optimize path data
            let pathData = convertPathData(pathData_merged, pathOptions)

            // remove zero-length segments introduced by rounding
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
        //svgSizeOpt = new Blob([svg]).size
        svgSizeOpt = svg.length;
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





