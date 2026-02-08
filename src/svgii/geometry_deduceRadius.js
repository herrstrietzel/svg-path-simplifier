import { getDeltaAngle, getDistance } from "./geometry";

export function getArcFromPoly(pts) {
    if (pts.length < 3) return false

    // Pick 3 well-spaced points
    let  p1 = pts[0];
    let  p2 = pts[Math.floor(pts.length / 2)];
    let  p3 = pts[pts.length - 1];

    let  x1 = p1.x, y1 = p1.y;
    let  x2 = p2.x, y2 = p2.y;
    let  x3 = p3.x, y3 = p3.y;

    let  a = x1 - x2;
    let  b = y1 - y2;
    let  c = x1 - x3;
    let  d = y1 - y3;

    let  e = ((x1 * x1 - x2 * x2) + (y1 * y1 - y2 * y2)) / 2;
    let  f = ((x1 * x1 - x3 * x3) + (y1 * y1 - y3 * y3)) / 2;

    let  det = a * d - b * c;

    if (Math.abs(det) < 1e-10) {
        console.warn("Points are collinear or numerically unstable");
        return false;
    }

    // find center of arc
    let  cx = (d * e - b * f) / det;
    let  cy = (-c * e + a * f) / det;
    let  centroid = { x: cx, y: cy };

    // Radius (use start point)
    let  r = getDistance(centroid, p1);

    let angleData = getDeltaAngle(centroid, p1, p3)
    let {deltaAngle, startAngle, endAngle} = angleData;

    return {
        centroid,
        r,
        startAngle,
        endAngle,
        deltaAngle
    };
}


