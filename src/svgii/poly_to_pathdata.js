
/**
* Chord-Length Parameterization 
* based on
* https://francoisromain.medium.com/smooth-a-svg-path-with-cubic-bezier-curves-e37b49d46c74
*/

import { checkLineIntersection, interpolate, mirrorCpts } from "./geometry";
import { getPolyBBox } from "./geometry_bbox";
import { isClosedPolygon } from "./poly_analyze";


// Render the svg <path> element
export function getCurvePathData(pts, t = 0.666, closed = 'auto', keepCorners = true) {


    //auto detect closed polygon
    if(closed==='auto'){
        closed = isClosedPolygon(pts)
    }


    // append first 2 pts for closed paths
    if (closed) {
        pts = pts.concat(pts.slice(0, 2));
    }


    // Position of a control point
    const controlPoint = (pt1, pt0, pt2, reverse = false, t = 0.666) => {

        let p = pt0 || pt1;
        let n = pt2 || pt1;

        let dx = n.x - p.x
        let dy = n.y - p.y
        let sign = reverse ? -1 : 1;

        let cp0 = {
            x: pt1.x + dx * sign,
            y: pt1.y + dy * sign
        };


        let t2 = 0.1 / (1 - t * 0.5)
        let cp = interpolate(pt1, cp0, t2)

        return cp;
    };


    // collect smoothed pathData
    let pathData = [];
    pathData.push({ type: "M", values: [pts[0].x, pts[0].y], p0:{x:pts[0].x, y:pts[0].y} });

    let cp2_0 = pts[0];
    let l = pts.length;


    for (let i = 1; i < l; i++) {

        let drawLine = false;
        let ptPrev = i > 1 ? pts[i - 2] : pts[l - 1];
        let ptNext = i < l - 1 ? pts[i + 1] : pts[0];
        //console.log(ptPrev, ptNext);

        let pt0 = pts[i - 1];
        let pt1 = pts[i];
        let cp1 = controlPoint(pt0, ptPrev, pt1, false, t);
        let cp2 = controlPoint(pt1, pt0, ptNext, true, t);

        let {isExtreme, isCorner,directionChange} = pt1;

        // get cp vector intersections
        let cpI = checkLineIntersection(pt0, cp1, pt1, cp2, false);


        // harmonize cpts
        if (cpI) {
            let { left, top, right, bottom, width, height } = getPolyBBox([pt0, pt1]);
            let outside = cpI ? (cpI.x < left || cpI.x > right || cpI.y < top || cpI.y > bottom) : false;

            // adjust/harmonize control points
            if (!outside) {
                cp1 = interpolate(pt0, cpI, t)
                cp2 = interpolate(pt1, cpI, t)
            } else {

                // check exact cp self intersections
                let cpI2 = checkLineIntersection(pt0, cp1, pt1, cp2, true);

                // control points are diverging - connction between cps and start/end point
                let interH = checkLineIntersection(pt0, pt1, cp1, cp2, true);

                cpI = !interH ? cpI : (cpI2 ? cpI2 : null)

                //&& i < l - 3
                if (cpI ) {
                    cp1 = interpolate(pt0, cpI, t)
                    cp2 = interpolate(pt1, cpI, t)
                    //renderPoint(svg, cpI, 'magenta')
                }
            }

        }


        if (keepCorners) {

            // mirror cpts
            if ((pt1.isCorner && !pt0.isCorner) || (!pt1.isCorner && pt0.isCorner)) {
                let outgoing = !pt1.isCorner && pt0.isCorner;

                let cps = mirrorCpts(cp2_0, pt0, cp2, pt1, outgoing, t);
                let cp1_2 = cps.cp1
                let cp2_2 = cps.cp2

                cp1 = cp1_2;
                cp2 = cp2_2;

            }

            // withdraw cpts for sharp corners - tag as lineto
            else if ((pt1.isCorner && pt0.isCorner)) {

                cp1 = { x: pt0.x, y: pt0.y };
                cp2 = { x: pt1.x, y: pt1.y };
                drawLine = true
            }

        }


        // update last cp2
        cp2_0 = cp2;

        let com = { type: "C", values: [cp1.x, cp1.y, cp2.x, cp2.y, pt1.x, pt1.y], 
        drawLine, 
        // add properties for chunk based simplification
        isExtreme, isCorner,directionChange
     };


        let values = com.values
        com.p0 = pt0
        com.cp1 = {x:values[0], y:values[1]}
        com.cp2 = {x:values[2], y:values[3]}
        com.p = {x:values[4], y:values[5]}


        pathData.push(com);
    }

    // copy last commands 1st controlpoint to first curveto
    if (closed) {
        let comLast = pathData[pathData.length - 1];
        let valuesLastC = comLast.values;
        let valuesFirstC = pathData[1].values;

        pathData[1].type = 'C'
        pathData[1].values = [valuesLastC[0], valuesLastC[1], ...valuesFirstC.slice(2)]
        let values0 = pathData[0].values
        let values = pathData[1].values
        pathData[1].p0 = {x:values0[0], y:values0[1]}
        pathData[1].cp1 = {x:values[0], y:values[1]}
        pathData[1].cp2 = {x:values[2], y:values[3]}
        pathData[1].p = {x:values[4], y:values[5]}

        // delete last curveto
        pathData = pathData.slice(0, pathData.length - 1);
        pathData.push({ type: 'z', values: [] })

    }

    // convert flat curves to linetos
    pathData.forEach((com, i) => {
        if (com.drawLine) {
            pathData[i].type = 'L'
            pathData[i].values = com.values.slice(-2);
        }
    })

    //console.log(pathData);
    return pathData;
};