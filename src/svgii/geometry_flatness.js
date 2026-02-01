import { getSquareDistance } from "./geometry";
import { getPolygonArea } from "./geometry_area";

export function commandIsFlat(points, tolerance = 0.025) {

    let p0 = points[0];
    let p = points[points.length - 1];

    let xArr = points.map(pt => { return pt.x })
    let yArr = points.map(pt => { return pt.y })

    let xMin = Math.min(...xArr)
    let xMax = Math.max(...xArr)
    let yMin = Math.min(...yArr)
    let yMax = Math.max(...yArr)
    let w = xMax - xMin
    let h = yMax - yMin


    if (points.length < 3 || (w === 0 || h === 0)) {
        return { area: 0, flat: true, thresh: 0.0001, ratio: 0 };
    }

    let squareDist = getSquareDistance(p0, p)
    let squareDist1 = getSquareDistance(p0, points[0])
    let squareDist2 = points.length > 3 ? getSquareDistance(p, points[1]) : squareDist1;
    let squareDistAvg = (squareDist1 + squareDist2) / 2

    tolerance = 0.5;
    let thresh = (w + h) * 0.5 * tolerance;

    //let thresh = tolerance;
    let area = getPolygonArea(points, true)


    let diff = Math.abs(area - squareDist);
    let areaDiff = Math.abs(100 - (100 / area * (area + diff)))
    let areaThresh = 1000

    //let ratio = area / (squareDistAvg/areaThresh);
    let ratio = area / (squareDistAvg);


    let isFlat = area === 0 ? true : area < squareDistAvg / areaThresh;


    return { area: area, flat: isFlat, thresh: thresh, ratio: ratio, squareDist: squareDist, areaThresh: squareDist / areaThresh };
}


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

    let area = getPolygonArea([p0,...cpts, p], true)
    let dist1 = getSquareDistance(p0, p)
    let thresh = dist1/200;


   // if(area<thresh) return true;
    isFlat = area<thresh;
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