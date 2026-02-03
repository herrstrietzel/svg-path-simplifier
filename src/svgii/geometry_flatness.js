import { getSquareDistance } from "./geometry";
import { getPolygonArea } from "./geometry_area";

export function commandIsFlat(points, {
    tolerance = 1,
    debug=false
} = {}) {

    let isFlat=false;
    let report = {
        flat:true,
        steepness:0
    }

    let p0 = points[0];
    let p = points[points.length - 1];

    let xSet = new Set([...points.map(pt => +pt.x.toFixed(8))])
    let ySet = new Set([...points.map(pt => +pt.y.toFixed(8))])


    // must be flat
    if(xSet.size===1 || ySet.size===1) return !debug ? true : report;

    let squareDist = getSquareDistance(p0, p)
    let threshold = squareDist / 1000 * tolerance
    let area = getPolygonArea(points, true)

    // flat enough
    if(area < threshold) isFlat = true;

    if(debug){
        report.flat = isFlat;
        report.steepness = area/threshold
    }

    return !debug ? isFlat : report;
}



// deprecated
export function checkBezierFlatness(p0, cpts, p) {

    let isFlat = false;

    let isCubic = cpts.length === 2;

    let cp1 = cpts[0]
    let cp2 = isCubic ? cpts[1] : cp1;

    if (p0.x === cp1.x && p0.y === cp1.y && p.x === cp2.x && p.y === cp2.y) return true;

    let dx1 = cp1.x - p0.x;
    let dy1 = cp1.y - p0.y;

    let dx2 = p.x - cp2.x;
    let dy2 = p.y - cp2.y;

    let cross1 = Math.abs(dx1 * dy2 - dy1 * dx2);

    if (!cross1) return true

    let dx0 = p.x - p0.x;
    let dy0 = p.y - p0.y;
    let cross0 = Math.abs(dx0 * dy1 - dy0 * dx1);

    if (!cross0) return true

    let area = getPolygonArea([p0, ...cpts, p], true)
    let dist1 = getSquareDistance(p0, p)
    let thresh = dist1 / 200;


    // if(area<thresh) return true;
    isFlat = area < thresh;
    //console.log('area', area, thresh, isFlat);


    /*
    //let diff = Math.abs(cross0 - cross1)
    //let rat0 = 1/cross0 * diff;
    let rat = (cross0 / cross1)

    if (rat < 1.1) {
        console.log('cross', cross0, cross1, 'rat', rat );
        isFlat = true;
    }
    */

    return isFlat;

}