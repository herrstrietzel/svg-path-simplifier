function renderPoint(
    svg,
    coords,
    fill = "red",
    r = "1%",
    opacity = "1",
    title = '',
    render = true,
    id = "",
    className = ""
) {
    if (Array.isArray(coords)) {
        coords = {
            x: coords[0],
            y: coords[1]
        };
    }
    let marker = `<circle class="${className}" opacity="${opacity}" id="${id}" cx="${coords.x}" cy="${coords.y}" r="${r}" fill="${fill}">
  <title>${title}</title></circle>`;

    if (render) {
        svg.insertAdjacentHTML("beforeend", marker);
    } else {
        return marker;
    }
}

function renderPath(svg, d = '', stroke = 'green', strokeWidth = '1%', render = true) {

    let path = `<path d="${d}" fill="none" stroke="${stroke}"  stroke-width="${strokeWidth}" /> `;

    if (render) {
        svg.insertAdjacentHTML("beforeend", path);
    } else {
        return path;
    }

}

function detectInputType(input) {
    let type = 'string';
    /*
    if (input instanceof HTMLImageElement) return "img";
    if (input instanceof SVGElement) return "svg";
    if (input instanceof HTMLCanvasElement) return "canvas";
    if (input instanceof File) return "file";
    if (input instanceof ArrayBuffer) return "buffer";
    if (input instanceof Blob) return "blob";
    */
    if (Array.isArray(input)) return "array";

    if (typeof input === "string") {
        input = input.trim();
        let isSVG = input.includes('<svg') && input.includes('</svg');
        let isPathData = input.startsWith('M') || input.startsWith('m');
        let isPolyString = !isNaN(input.substring(0, 1)) && !isNaN(input.substring(input.length-1, input.length));

        
        if(isSVG) {
            type='svgMarkup';
        }
        else if(isPathData) {
            type='pathDataString';
        }
        else if(isPolyString) {
            type='polyString';
        }

        else {
            let url = /^(file:|https?:\/\/|\/|\.\/|\.\.\/)/.test(input);
            let dataUrl = input.startsWith('data:image');
            type = url || dataUrl ? "url" : "string";
        }

        return type
    }

    type = typeof input;
    let constructor = input.constructor.name;

    return (constructor || type).toLowerCase();
}

/*
import {abs, acos, asin, atan, atan2, ceil, cos, exp, floor,
    log, max, min, pow, random, round, sin, sqrt, tan, PI} from '/.constants.js';
    */

const {
    abs: abs$1, acos: acos$1, asin: asin$1, atan: atan$1, atan2: atan2$1, ceil: ceil$1, cos: cos$1, exp: exp$1, floor: floor$1,
    log: log$1, max: max$1, min: min$1, pow: pow$1, random: random$1, round: round$1, sin: sin$1, sqrt: sqrt$1, tan: tan$1, PI: PI$1
} = Math;

// get angle helper
function getAngle(p1, p2, normalize = false) {
    let angle = atan2$1(p2.y - p1.y, p2.x - p1.x);
    // normalize negative angles
    if (normalize && angle < 0) angle += Math.PI * 2;
    return angle
}

/**
 * based on:  Justin C. Round's 
 * http://jsfiddle.net/justin_c_rounds/Gd2S2/light/
 */

function checkLineIntersection(p1=null, p2=null, p3=null, p4=null, exact = true, debug=false) {
    // if the lines intersect, the result contains the x and y of the intersection (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
    let denominator, a, b, numerator1, numerator2;
    let intersectionPoint = {};

    if(!p1 || !p2 || !p3 || !p4){
        if(debug) console.warn('points missing');
        return false
    }

    try {
        denominator = ((p4.y - p3.y) * (p2.x - p1.x)) - ((p4.x - p3.x) * (p2.y - p1.y));
        if (denominator == 0) {
            return false;
        }
    } catch {
        if(debug) console.warn('!catch', p1, p2, 'p3:', p3, 'p4:', p4);
        return false
    }

    a = p1.y - p3.y;
    b = p1.x - p3.x;
    numerator1 = ((p4.x - p3.x) * a) - ((p4.y - p3.y) * b);
    numerator2 = ((p2.x - p1.x) * a) - ((p2.y - p1.y) * b);

    a = numerator1 / denominator;
    b = numerator2 / denominator;

    // if we cast these lines infinitely in both directions, they intersect here:
    intersectionPoint = {
        x: p1.x + (a * (p2.x - p1.x)),
        y: p1.y + (a * (p2.y - p1.y))
    };

    let intersection = false;
    // if line1 is a segment and line2 is infinite, they intersect if:
    if ((a > 0 && a < 1) && (b > 0 && b < 1)) {
        intersection = true;

    }

    if (exact && !intersection) {

        return false;
    }

    // if line1 and line2 are segments, they intersect if both of the above are true

    return intersectionPoint;
}

/**
 * get distance between 2 points
 * pythagorean theorem
 */
function getDistance(p1, p2) {
    return sqrt$1(
        (p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y)
    );
}

function getSquareDistance(p1, p2) {
    return (p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2
}

/**
* Linear  interpolation (LERP) helper
*/
function interpolate(p1, p2, t, getTangent = false) {

    let pt = {
        x: (p2.x - p1.x) * t + p1.x,
        y: (p2.y - p1.y) * t + p1.y,
    };

    if (getTangent) {
        pt.angle = getAngle(p1, p2);

        // normalize negative angles
        if (pt.angle < 0) pt.angle += PI$1 * 2;
    }

    return pt
}

function pointAtT(pts, t = 0.5, getTangent = false, getCpts = false) {

    const getPointAtBezierT = (pts, t, getTangent = false) => {

        let isCubic = pts.length === 4;
        let p0 = pts[0];
        let cp1 = pts[1];
        let cp2 = isCubic ? pts[2] : pts[1];
        let p = pts[pts.length - 1];
        let pt = { x: 0, y: 0 };

        if (getTangent || getCpts) {
            let m0, m1, m2, m3, m4;
            let shortCp1 = p0.x === cp1.x && p0.y === cp1.y;
            let shortCp2 = p.x === cp2.x && p.y === cp2.y;

            if (t === 0 && !shortCp1) {
                pt.x = p0.x;
                pt.y = p0.y;
                pt.angle = getAngle(p0, cp1);
            }

            else if (t === 1 && !shortCp2) {
                pt.x = p.x;
                pt.y = p.y;
                pt.angle = getAngle(cp2, p);
            }

            else {
                // adjust if cps are on start or end point
                if (shortCp1) t += 0.0000001;
                if (shortCp2) t -= 0.0000001;

                m0 = interpolate(p0, cp1, t);
                if (isCubic) {
                    m1 = interpolate(cp1, cp2, t);
                    m2 = interpolate(cp2, p, t);
                    m3 = interpolate(m0, m1, t);
                    m4 = interpolate(m1, m2, t);
                    pt = interpolate(m3, m4, t);

                    // add angles
                    pt.angle = getAngle(m3, m4);

                    // add control points
                    if (getCpts) pt.cpts = [m1, m2, m3, m4];
                } else {
                    m1 = interpolate(p0, cp1, t);
                    m2 = interpolate(cp1, p, t);
                    pt = interpolate(m1, m2, t);
                    pt.angle = getAngle(m1, m2);

                    // add control points
                    if (getCpts) pt.cpts = [m1, m2];
                }
            }

        }
        // take simplified calculations without tangent angles
        else {
            let t1 = 1 - t;

            // cubic beziers
            if (isCubic) {
                pt = {
                    x:
                        t1 ** 3 * p0.x +
                        3 * t1 ** 2 * t * cp1.x +
                        3 * t1 * t ** 2 * cp2.x +
                        t ** 3 * p.x,
                    y:
                        t1 ** 3 * p0.y +
                        3 * t1 ** 2 * t * cp1.y +
                        3 * t1 * t ** 2 * cp2.y +
                        t ** 3 * p.y,
                };

            }
            // quadratic beziers
            else {
                pt = {
                    x: t1 * t1 * p0.x + 2 * t1 * t * cp1.x + t ** 2 * p.x,
                    y: t1 * t1 * p0.y + 2 * t1 * t * cp1.y + t ** 2 * p.y,
                };
            }

        }

        return pt

    };

    let pt;
    if (pts.length > 2) {
        pt = getPointAtBezierT(pts, t, getTangent);
    }

    else {
        pt = interpolate(pts[0], pts[1], t, getTangent);
    }

    // normalize negative angles
    if (getTangent && pt.angle < 0) pt.angle += PI$1 * 2;

    return pt
}

/**
 * get vertices from path command final on-path points
 */
function getPathDataVertices(pathData) {
    let polyPoints = [];
    let p0 = { x: pathData[0].values[0], y: pathData[0].values[1] };

    pathData.forEach((com) => {
        let { type, values } = com;
        // get final on path point from last 2 values
        if (values.length) {
            let pt = values.length > 1 ? { x: values[values.length - 2], y: values[values.length - 1] }
                : (type === 'V' ? { x: p0.x, y: values[0] } : { x: values[0], y: p0.y });
            polyPoints.push(pt);
            p0 = pt;
        }
    });
    return polyPoints;
}

/**
 *  based on @cuixiping;
 *  https://stackoverflow.com/questions/9017100/calculate-center-of-svg-arc/12329083#12329083
 */
function svgArcToCenterParam(x1, y1, rx, ry, xAxisRotation, largeArc, sweep, x2, y2) {

    // helper for angle calculation
    const getAngle = (cx, cy, x, y) => {
        return atan2$1(y - cy, x - cx);
    };

    // make sure rx, ry are positive
    rx = abs$1(rx);
    ry = abs$1(ry);

    // create data object
    let arcData = {
        cx: 0,
        cy: 0,
        // rx/ry values may be deceptive in arc commands
        rx: rx,
        ry: ry,
        startAngle: 0,
        endAngle: 0,
        deltaAngle: 0,
        clockwise: sweep,
        // copy explicit arc properties
        xAxisRotation,
        largeArc,
        sweep
    };

    if (rx == 0 || ry == 0) {
        // invalid arguments
        throw Error("rx and ry can not be 0");
    }

    let shortcut = true;

    if (rx === ry && shortcut) {

        // test semicircles
        let diffX = Math.abs(x2 - x1);
        let diffY = Math.abs(y2 - y1);
        let r = diffX;

        let xMin = Math.min(x1, x2),
            yMin = Math.min(y1, y2),
            PIHalf = Math.PI * 0.5;

        // semi circles
        if (diffX === 0 && diffY || diffY === 0 && diffX) {

            r = diffX === 0 && diffY ? diffY / 2 : diffX / 2;
            arcData.rx = r;
            arcData.ry = r;

            // verical
            if (diffX === 0 && diffY) {
                arcData.cx = x1;
                arcData.cy = yMin + diffY / 2;
                arcData.startAngle = y1 > y2 ? PIHalf : -PIHalf;
                arcData.endAngle = y1 > y2 ? -PIHalf : PIHalf;
                arcData.deltaAngle = sweep ? Math.PI : -Math.PI;

            }
            // horizontal
            else if (diffY === 0 && diffX) {
                arcData.cx = xMin + diffX / 2;
                arcData.cy = y1;
                arcData.startAngle = x1 > x2 ? Math.PI : 0;
                arcData.endAngle = x1 > x2 ? -Math.PI : Math.PI;
                arcData.deltaAngle = sweep ? Math.PI : -Math.PI;
            }

            return arcData;
        }
    }

    /**
     * if rx===ry x-axis rotation is ignored
     * otherwise convert degrees to radians
     */
    let phi = rx === ry ? 0 : (xAxisRotation * PI$1) / 180;
    let cx, cy;

    let s_phi = !phi ? 0 : sin$1(phi);
    let c_phi = !phi ? 1 : cos$1(phi);

    let hd_x = (x1 - x2) / 2;
    let hd_y = (y1 - y2) / 2;
    let hs_x = (x1 + x2) / 2;
    let hs_y = (y1 + y2) / 2;

    // F6.5.1
    let x1_ = !phi ? hd_x : c_phi * hd_x + s_phi * hd_y;
    let y1_ = !phi ? hd_y : c_phi * hd_y - s_phi * hd_x;

    // F.6.6 Correction of out-of-range radii
    //   Step 3: Ensure radii are large enough
    let lambda = (x1_ * x1_) / (rx * rx) + (y1_ * y1_) / (ry * ry);
    if (lambda > 1) {
        rx = rx * sqrt$1(lambda);
        ry = ry * sqrt$1(lambda);

        // save real rx/ry
        arcData.rx = rx;
        arcData.ry = ry;
    }

    let rxry = rx * ry;
    let rxy1_ = rx * y1_;
    let ryx1_ = ry * x1_;
    let sum_of_sq = rxy1_ ** 2 + ryx1_ ** 2; // sum of square
    if (!sum_of_sq) {

        throw Error("start point can not be same as end point");
    }
    let coe = sqrt$1(abs$1((rxry * rxry - sum_of_sq) / sum_of_sq));
    if (largeArc == sweep) {
        coe = -coe;
    }

    // F6.5.2
    let cx_ = (coe * rxy1_) / ry;
    let cy_ = (-coe * ryx1_) / rx;

    /** F6.5.3
     * center point of ellipse
     */
    cx = !phi ? hs_x + cx_ : c_phi * cx_ - s_phi * cy_ + hs_x;
    cy = !phi ? hs_y + cy_ : s_phi * cx_ + c_phi * cy_ + hs_y;
    arcData.cy = cy;
    arcData.cx = cx;

    /** F6.5.5
     * calculate angles between center point and
     * commands starting and final on path point
     */
    let startAngle = getAngle(cx, cy, x1, y1);
    let endAngle = getAngle(cx, cy, x2, y2);

    // adjust end angle
    if (!sweep && endAngle > startAngle) {

        endAngle -= Math.PI * 2;
    }

    if (sweep && startAngle > endAngle) {

        endAngle = endAngle <= 0 ? endAngle + Math.PI * 2 : endAngle;
    }

    let deltaAngle = endAngle - startAngle;
    arcData.startAngle = startAngle;
    arcData.endAngle = endAngle;
    arcData.deltaAngle = deltaAngle;

    return arcData;
}

function getPointOnEllipse(cx, cy, rx, ry, angle, ellipseRotation = 0, parametricAngle = true, degrees = false) {

    // Convert degrees to radians
    angle = degrees ? (angle * PI$1) / 180 : angle;
    ellipseRotation = degrees ? (ellipseRotation * PI$1) / 180 : ellipseRotation;
    // reset rotation for circles or 360 degree 
    ellipseRotation = rx !== ry ? (ellipseRotation !== PI$1 * 2 ? ellipseRotation : 0) : 0;

    // is ellipse
    if (parametricAngle && rx !== ry) {
        // adjust angle for ellipse rotation
        angle = ellipseRotation ? angle - ellipseRotation : angle;
        // Get the parametric angle for the ellipse
        let angleParametric = atan$1(tan$1(angle) * (rx / ry));
        // Ensure the parametric angle is in the correct quadrant
        angle = cos$1(angle) < 0 ? angleParametric + PI$1 : angleParametric;
    }

    // Calculate the point on the ellipse without rotation
    let x = cx + rx * cos$1(angle),
        y = cy + ry * sin$1(angle);
    let pt = {
        x: x,
        y: y
    };

    if (ellipseRotation) {
        pt.x = cx + (x - cx) * cos$1(ellipseRotation) - (y - cy) * sin$1(ellipseRotation);
        pt.y = cy + (x - cx) * sin$1(ellipseRotation) + (y - cy) * cos$1(ellipseRotation);
    }
    return pt
}

function bezierhasExtreme(p0, cpts = [], angleThreshold = 0.05) {
    let isCubic = cpts.length === 3 ? true : false;
    let cp1 = cpts[0] || null;
    let cp2 = isCubic ? cpts[1] : null;
    let p = isCubic ? cpts[2] : cpts[1];
    let PIquarter = Math.PI * 0.5;

    let extCp1 = false,
        extCp2 = false;

    let ang1 = cp1 ? getAngle(p, cp1, true) : null;

    extCp1 = Math.abs((ang1 % PIquarter)) < angleThreshold || Math.abs((ang1 % PIquarter) - PIquarter) < angleThreshold;

    if (isCubic) {
        let ang2 = cp2 ? getAngle(cp2, p, true) : 0;
        extCp2 = Math.abs((ang2 % PIquarter)) <= angleThreshold ||
            Math.abs((ang2 % PIquarter) - PIquarter) <= angleThreshold;
    }
    return (extCp1 || extCp2)
}

function getBezierExtremeT(pts) {
    let tArr = pts.length === 4 ? cubicBezierExtremeT(pts[0], pts[1], pts[2], pts[3]) : quadraticBezierExtremeT(pts[0], pts[1], pts[2]);
    return tArr;
}

/**
 * based on Nikos M.'s answer
 * how-do-you-calculate-the-axis-aligned-bounding-box-of-an-ellipse
 * https://stackoverflow.com/questions/87734/#75031511
 * See also: https://github.com/foo123/Geometrize
 */
function getArcExtemes(p0, values) {
    // compute point on ellipse from angle around ellipse (theta)
    const arc = (theta, cx, cy, rx, ry, alpha) => {
        // theta is angle in radians around arc
        // alpha is angle of rotation of ellipse in radians
        var cos = Math.cos(alpha),
            sin = Math.sin(alpha),
            x = rx * Math.cos(theta),
            y = ry * Math.sin(theta);

        return {
            x: cx + cos * x - sin * y,
            y: cy + sin * x + cos * y
        };
    };

    let arcData = svgArcToCenterParam(p0.x, p0.y, values[0], values[1], values[2], values[3], values[4], values[5], values[6]);
    let { rx, ry, cx, cy, endAngle, deltaAngle } = arcData;

    // arc rotation
    let deg = values[2];

    // final on path point
    let p = { x: values[5], y: values[6] };

    // collect extreme points – add end point
    let extremes = [p];

    // rotation to radians
    let alpha = deg * Math.PI / 180;
    let tan = Math.tan(alpha),
        p1, p2, p3, p4, theta;

    /**
    * find min/max from zeroes of directional derivative along x and y
    * along x axis
    */
    theta = Math.atan2(-ry * tan, rx);

    let angle1 = theta;
    let angle2 = theta + Math.PI;
    let angle3 = Math.atan2(ry, rx * tan);
    let angle4 = angle3 + Math.PI;

    // inner bounding box
    let xArr = [p0.x, p.x];
    let yArr = [p0.y, p.y];
    let xMin = Math.min(...xArr);
    let xMax = Math.max(...xArr);
    let yMin = Math.min(...yArr);
    let yMax = Math.max(...yArr);

    // on path point close after start
    let angleAfterStart = endAngle - deltaAngle * 0.001;
    let pP2 = arc(angleAfterStart, cx, cy, rx, ry, alpha);

    // on path point close before end
    let angleBeforeEnd = endAngle - deltaAngle * 0.999;
    let pP3 = arc(angleBeforeEnd, cx, cy, rx, ry, alpha);

    /**
     * expected extremes
     * if leaving inner bounding box
     * (between segment start and end point)
     * otherwise exclude elliptic extreme points
    */

    // right
    if (pP2.x > xMax || pP3.x > xMax) {
        // get point for this theta
        p1 = arc(angle1, cx, cy, rx, ry, alpha);
        extremes.push(p1);
    }

    // left
    if (pP2.x < xMin || pP3.x < xMin) {
        // get anti-symmetric point
        p2 = arc(angle2, cx, cy, rx, ry, alpha);
        extremes.push(p2);
    }

    // top
    if (pP2.y < yMin || pP3.y < yMin) {
        // get anti-symmetric point
        p4 = arc(angle4, cx, cy, rx, ry, alpha);
        extremes.push(p4);
    }

    // bottom
    if (pP2.y > yMax || pP3.y > yMax) {
        // get point for this theta
        p3 = arc(angle3, cx, cy, rx, ry, alpha);
        extremes.push(p3);
    }

    return extremes;
}

// cubic bezier.
function cubicBezierExtremeT(p0, cp1, cp2, p) {
    let [x0, y0, x1, y1, x2, y2, x3, y3] = [p0.x, p0.y, cp1.x, cp1.y, cp2.x, cp2.y, p.x, p.y];

    /**
     * if control points are within 
     * bounding box of start and end point 
     * we cant't have extremes
     */
    let top = Math.min(p0.y, p.y);
    let left = Math.min(p0.x, p.x);
    let right = Math.max(p0.x, p.x);
    let bottom = Math.max(p0.y, p.y);

    if (
        cp1.y >= top && cp1.y <= bottom &&
        cp2.y >= top && cp2.y <= bottom &&
        cp1.x >= left && cp1.x <= right &&
        cp2.x >= left && cp2.x <= right
    ) {
        return []
    }

    let tArr = [],
        a, b, c, t, t1, t2, b2ac, sqrt_b2ac;
    for (let i = 0; i < 2; ++i) {
        if (i == 0) {
            b = 6 * x0 - 12 * x1 + 6 * x2;
            a = -3 * x0 + 9 * x1 - 9 * x2 + 3 * x3;
            c = 3 * x1 - 3 * x0;
        } else {
            b = 6 * y0 - 12 * y1 + 6 * y2;
            a = -3 * y0 + 9 * y1 - 9 * y2 + 3 * y3;
            c = 3 * y1 - 3 * y0;
        }
        if (Math.abs(a) < 1e-12) {
            if (Math.abs(b) < 1e-12) {
                continue;
            }
            t = -c / b;
            if (0 < t && t < 1) {
                tArr.push(t);
            }
            continue;
        }
        b2ac = b * b - 4 * c * a;
        if (b2ac < 0) {
            if (Math.abs(b2ac) < 1e-12) {
                t = -b / (2 * a);
                if (0 < t && t < 1) {
                    tArr.push(t);
                }
            }
            continue;
        }
        sqrt_b2ac = Math.sqrt(b2ac);
        t1 = (-b + sqrt_b2ac) / (2 * a);
        if (0 < t1 && t1 < 1) {
            tArr.push(t1);
        }
        t2 = (-b - sqrt_b2ac) / (2 * a);
        if (0 < t2 && t2 < 1) {
            tArr.push(t2);
        }
    }

    let j = tArr.length;
    while (j--) {
        t = tArr[j];
    }
    return tArr;
}

function quadraticBezierExtremeT(p0, cp1, p) {
    /**
     * if control points are within 
     * bounding box of start and end point 
     * we cant't have extremes
     */
    let top = Math.min(p0.y, p.y);
    let left = Math.min(p0.x, p.x);
    let right = Math.max(p0.x, p.x);
    let bottom = Math.max(p0.y, p.y);
    let a, b, t;

    if (
        cp1.y >= top && cp1.y <= bottom &&
        cp1.x >= left && cp1.x <= right
    ) {
        return []
    }

    let [x0, y0, x1, y1, x2, y2] = [p0.x, p0.y, cp1.x, cp1.y, p.x, p.y];
    let extemeT = [];

    for (let i = 0; i < 2; ++i) {
        a = i == 0 ? x0 - 2 * x1 + x2 : y0 - 2 * y1 + y2;
        b = i == 0 ? -2 * x0 + 2 * x1 : -2 * y0 + 2 * y1;
        if (Math.abs(a) > 1e-12) {
            t = -b / (2 * a);
            if (t > 0 && t < 1) {
                extemeT.push(t);
            }
        }
    }
    return extemeT
}

/**
 * sloppy distance calculation
 * based on x/y differences
 */
function getDistAv(pt1, pt2) {

    let diffX = Math.abs(pt2.x - pt1.x);
    let diffY = Math.abs(pt2.y - pt1.y);
    let diff = (diffX + diffY) / 2;

    /*
    let diffX = pt2.x - pt1.x;
    let diffY = pt2.y - pt1.y;
    let diff = Math.abs(diffX + diffY) / 2;
    */

    return diff;
}

/**
 * split compound paths into 
 * sub path data array
 */
function splitSubpaths(pathData) {

    let subPathArr = [];

    
    try{
        let subPathIndices = pathData.map((com, i) => (com.type.toLowerCase() === 'm' ? i : -1)).filter(i => i !== -1);

    }catch{
        console.log('catch', pathData);
    }

    let subPathIndices = pathData.map((com, i) => (com.type.toLowerCase() === 'm' ? i : -1)).filter(i => i !== -1);

    // no compound path
    if (subPathIndices.length === 1) {
        return [pathData]
    }
    subPathIndices.forEach((index, i) => {
        subPathArr.push(pathData.slice(index, subPathIndices[i + 1]));
    });

    return subPathArr;
}

/**
 * calculate split command points
 * for single t value 
 */
function splitCommand(points, t) {

    let seg1 = [];
    let seg2 = [];

    let p0 = points[0];
    let cp1 = points[1];
    let cp2 = points[points.length - 2];
    let p = points[points.length - 1];
    let m0,m1,m2,m3,m4, p2;

    // cubic
    if (points.length === 4) {
        m0 = pointAtT([p0, cp1], t);
        m1 = pointAtT([cp1, cp2], t);
        m2 = pointAtT([cp2, p], t);
        m3 = pointAtT([m0, m1], t);
        m4 = pointAtT([m1, m2], t);

        // split end point
        p2 = pointAtT([m3, m4], t);

        // 1. segment
        seg1.push(
            { x: p0.x, y: p0.y },
            { x: m0.x, y: m0.y },
            { x: m3.x, y: m3.y },
            { x: p2.x, y: p2.y },
        );
        // 2. segment
        seg2.push(
            { x: p2.x, y: p2.y },
            { x: m4.x, y: m4.y },
            { x: m2.x, y: m2.y },
            { x: p.x, y: p.y },
        );
    }

    // quadratic
    else if (points.length === 3) {
        m1 = pointAtT([p0, cp1], t);
        m2 = pointAtT([cp1, p], t);
        p2 = pointAtT([m1, m2], t);

        // 1. segment
        seg1.push(
            { x: p0.x, y: p0.y },
            { x: m1.x, y: m1.y },
            { x: p2.x, y: p2.y },
        );

        // 1. segment
        seg2.push(
            { x: p2.x, y: p2.y },
            { x: m2.x, y: m2.y },
            { x: p.x, y: p.y },
        );
    }

    // lineto
    else if (points.length === 2) {
        m1 = pointAtT([p0, p], t);

        // 1. segment
        seg1.push(
            { x: p0.x, y: p0.y },
            { x: m1.x, y: m1.y },
        );

        // 1. segment
        seg2.push(
            { x: m1.x, y: m1.y },
            { x: p.x, y: p.y },
        );
    }
    return [seg1, seg2];
}

/**
 * calculate command extremes
 */

function addExtemesToCommand(p0, values, tMin=0, tMax=1) {

    let pathDataNew = [];

    let type = values.length === 6 ? 'C' : 'Q';
    let cp1 = { x: values[0], y: values[1] };
    let cp2 = type === 'C' ? { x: values[2], y: values[3] } : cp1;
    let p = { x: values[4], y: values[5] };

    // get inner bbox
    let xMax = Math.max(p.x, p0.x);
    let xMin = Math.min(p.x, p0.x);
    let yMax = Math.max(p.y, p0.y);
    let yMin = Math.min(p.y, p0.y);

    let extremeCount = 0;

    if (
        cp1.x < xMin ||
        cp1.x > xMax ||
        cp1.y < yMin ||
        cp1.y > yMax ||
        cp2.x < xMin ||
        cp2.x > xMax ||
        cp2.y < yMin ||
        cp2.y > yMax

    ) {
        let pts = type === 'C' ? [p0, cp1, cp2, p] : [p0, cp1, p];
        let tArr = getBezierExtremeT(pts).sort();

        // avoid t split too close to start or end
        tArr = tArr.filter(t=>t>tMin && t<tMax);

        if(tArr.length){
            let commandsSplit = splitCommandAtTValues(p0, values, tArr);

            pathDataNew.push(...commandsSplit);
            extremeCount += commandsSplit.length;
        }else {

            pathDataNew.push({ type: type, values: values });
        }

    }
    // no extremes
    else {
        pathDataNew.push({ type: type, values: values });
    }

    return { pathData: pathDataNew, count: extremeCount };

}

function addExtremePoints(pathData, tMin=0, tMax=1) {
    let pathDataNew = [pathData[0]];
    // previous on path point
    let p0 = { x: pathData[0].values[0], y: pathData[0].values[1] };
    let M = { x: pathData[0].values[0], y: pathData[0].values[1] };
    let len = pathData.length;

    for (let c = 1; len && c < len; c++) {
        let com = pathData[c];

        let { type, values } = com;
        let valsL = values.slice(-2);
        ({ x: valsL[0], y: valsL[1] });

        if (type !== 'C' && type !== 'Q') {
            pathDataNew.push(com);
        }

        else {
            // add extremes
            if (type === 'C' || type === 'Q') {
                let comExt = addExtemesToCommand(p0, values, tMin, tMax).pathData;

                pathDataNew.push(...comExt );
            }
        }

        p0 = { x: valsL[0], y: valsL[1] };

        if (type.toLowerCase() === "z") {
            p0 = M;
        } else if (type === "M") {
            M = { x: valsL[0], y: valsL[1] };
        }
    }

    return pathDataNew;
}

/**
 * split commands multiple times
 * based on command points
 * and t array
 */
function splitCommandAtTValues(p0, values, tArr, returnCommand = true) {
    let segmentPoints = [];

    if (!tArr.length) {
        return false
    }

    let valuesL = values.length;
    let p = { x: values[valuesL - 2], y: values[valuesL - 1] };
    let cp1, cp2, points;

    if (values.length === 2) {
        points = [p0, p];
    }
    else if (values.length === 4) {
        cp1 = { x: values[0], y: values[1] };
        points = [p0, cp1, p];
    }
    else if (values.length === 6) {
        cp1 = { x: values[0], y: values[1] };
        cp2 = { x: values[2], y: values[3] };
        points = [p0, cp1, cp2, p];
    }

    if (tArr.length) {
        // single t
        if (tArr.length === 1) {
            let segs = splitCommand(points, tArr[0]);
            let points1 = segs[0];
            let points2 = segs[1];
            segmentPoints.push(points1, points2);

        } else {

            // 1st segment
            let t1 = tArr[0];
            let seg0 = splitCommand(points, t1);
            let points0 = seg0[0];
            segmentPoints.push(points0);
            points = seg0[1];

            for (let i = 1; i < tArr.length; i++) {
                t1 = tArr[i - 1];
                let t2 = tArr[i];

                // new t value for 2nd segment
                let t2_1 = (t2 - t1) / (1 - t1);
                let segs2 = splitCommand(points, t2_1);
                segmentPoints.push(segs2[0]);

                if (i === tArr.length - 1) {
                    segmentPoints.push(segs2[segs2.length - 1]);
                }
                // take 2nd segment for next splitting
                points = segs2[1];
            }
        }
    }

    if (returnCommand) {

        let pathData = [];
        let com, values;

        segmentPoints.forEach(seg => {
            com = { type: '', values: [] };
            seg.shift();
            values = seg.map(val => { return Object.values(val) }).flat();
            com.values = values;

            // cubic
            if (seg.length === 3) {
                com.type = 'C';
            }

            // quadratic
            else if (seg.length === 2) {
                com.type = 'Q';
            }

            // lineto
            else if (seg.length === 1) {
                com.type = 'L';
            }
            pathData.push(com);
        });
        return pathData;
    }

    return segmentPoints;
}

/**
 * calculate polygon bbox
 */
function getPolyBBox(vertices, decimals = -1) {
    let xArr = vertices.map(pt => pt.x);
    let yArr = vertices.map(pt => pt.y);
    let left = Math.min(...xArr);
    let right = Math.max(...xArr);
    let top = Math.min(...yArr);
    let bottom = Math.max(...yArr);
    let bb = {
        x: left,
        left: left,
        right: right,
        y: top,
        top: top,
        bottom: bottom,
        width: right - left,
        height: bottom - top
    };

    // round

    if (decimals > -1) {
        for (let prop in bb) {
            bb[prop] = +bb[prop].toFixed(decimals);
        }
    }

    return bb;
}

function getSubPathBBoxes(subPaths) {
    let bboxArr = [];
    subPaths.forEach((pathData) => {

        let bb = getPathDataBBox_sloppy(pathData);
        bboxArr.push(bb);
    });

    return bboxArr;
}

function checkBBoxIntersections(bb, bb1) {
    let [x, y, width, height, right, bottom] = [
        bb.x,
        bb.y,
        bb.width,
        bb.height,
        bb.x + bb.width,
        bb.y + bb.height
    ];
    let [x1, y1, width1, height1, right1, bottom1] = [
        bb1.x,
        bb1.y,
        bb1.width,
        bb1.height,
        bb1.x + bb1.width,
        bb1.y + bb1.height
    ];
    let intersects = false;
    if (width * height != width1 * height1) {
        if (width * height > width1 * height1) {
            if (x < x1 && right > right1 && y < y1 && bottom > bottom1) {
                intersects = true;
            }
        }
    }
    return intersects;
}

/**
 * sloppy path bbox aaproximation
 */

function getPathDataBBox_sloppy(pathData) {
    let pts = getPathDataPoly(pathData);
    let bb = getPolyBBox(pts);
    return bb;
}

/**
 * get path data poly
 * including command points
 * handy for faster/sloppy bbox approximations
 */

function getPathDataPoly(pathData) {

    let poly = [];
    for (let i = 0; i < pathData.length; i++) {
        let com = pathData[i];
        let prev = i > 0 ? pathData[i - 1] : pathData[i];
        let { type, values } = com;
        let p0 = { x: prev.values[prev.values.length - 2], y: prev.values[prev.values.length - 1] };
        let p = values.length ? { x: values[values.length - 2], y: values[values.length - 1] } : '';
        let cp1 = values.length ? { x: values[0], y: values[1] } : '';

        switch (type) {

            // convert to cubic to get polygon
            case 'A':

                if (typeof arcToBezier !== 'function') {

                    // get real radii
                    let rx = getDistance(p0, p) / 2;
                    let ptMid = interpolate(p0, p, 0.5);

                    let pt1 = getPointOnEllipse(ptMid.x, ptMid.y, rx, rx, 0);
                    let pt2 = getPointOnEllipse(ptMid.x, ptMid.y, rx, rx, Math.PI);
                    poly.push(pt1, pt2, p);

                    break;
                }
                let cubic = arcToBezier(p0, values);
                cubic.forEach(com => {
                    let vals = com.values;
                    let cp1 = { x: vals[0], y: vals[1] };
                    let cp2 = { x: vals[2], y: vals[3] };
                    let p = { x: vals[4], y: vals[5] };
                    poly.push(cp1, cp2, p);
                });
                break;

            case 'C':
                let cp2 = { x: values[2], y: values[3] };
                poly.push(cp1, cp2);
                break;
            case 'Q':
                poly.push(cp1);
                break;
        }

        // M and L commands
        if (type.toLowerCase() !== 'z') {
            poly.push(p);
        }
    }

    return poly;
}

/**
 * get exact path BBox
 * calculating extremes for all command types
 */

function getPathDataBBox(pathData) {

    // save extreme values
    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;

    const setXYmaxMin = (pt) => {
        if (pt.x < xMin) {
            xMin = pt.x;
        }
        if (pt.x > xMax) {
            xMax = pt.x;
        }
        if (pt.y < yMin) {
            yMin = pt.y;
        }
        if (pt.y > yMax) {
            yMax = pt.y;
        }
    };

    for (let i = 0; i < pathData.length; i++) {
        let com = pathData[i];
        let { type, values } = com;
        let valuesL = values.length;
        let comPrev = pathData[i - 1] ? pathData[i - 1] : pathData[i];
        let valuesPrev = comPrev.values;
        let valuesPrevL = valuesPrev.length;

        if (valuesL) {
            let p0 = { x: valuesPrev[valuesPrevL - 2], y: valuesPrev[valuesPrevL - 1] };
            let p = { x: values[valuesL - 2], y: values[valuesL - 1] };
            // add final on path point
            setXYmaxMin(p);

            if (type === 'C' || type === 'Q') {
                let cp1 = { x: values[0], y: values[1] };
                let cp2 = type === 'C' ? { x: values[2], y: values[3] } : cp1;
                let pts = type === 'C' ? [p0, cp1, cp2, p] : [p0, cp1, p];

                let bezierExtremesT = getBezierExtremeT(pts);
                bezierExtremesT.forEach(t => {
                    let pt = pointAtT(pts, t);
                    setXYmaxMin(pt);
                });
            }

            else if (type === 'A') {
                let arcExtremes = getArcExtemes(p0, values);
                arcExtremes.forEach(pt => {
                    setXYmaxMin(pt);
                });
            }
        }
    }

    let bbox = { x: xMin, y: yMin, width: xMax - xMin, height: yMax - yMin };
    return bbox
}

/**
 * get pathdata area
 */

function getPathArea(pathData, decimals = 9) {
    let totalArea = 0;
    let polyPoints = [];

    let subPathsData = splitSubpaths(pathData);
    let isCompoundPath = subPathsData.length > 1 ? true : false;
    let counterShapes = [];

    // check intersections for compund paths
    if (isCompoundPath) {
        let bboxArr = getSubPathBBoxes(subPathsData);

        bboxArr.forEach(function (bb, b) {

            for (let i = 0; i < bboxArr.length; i++) {
                let bb2 = bboxArr[i];
                if (bb != bb2) {
                    let intersects = checkBBoxIntersections(bb, bb2);
                    if (intersects) {
                        counterShapes.push(i);
                    }
                }
            }
        });
    }

    subPathsData.forEach((pathData, d) => {

        polyPoints = [];
        let comArea = 0;
        let pathArea = 0;
        let multiplier = 1;
        let pts = [];

        pathData.forEach(function (com, i) {
            let [type, values] = [com.type, com.values];
            let valuesL = values.length;

            if (values.length) {
                let prevC = i > 0 ? pathData[i - 1] : pathData[0];
                let prevCVals = prevC.values;
                let prevCValsL = prevCVals.length;
                let p0 = { x: prevCVals[prevCValsL - 2], y: prevCVals[prevCValsL - 1] };
                let p = { x: values[valuesL - 2], y: values[valuesL - 1] };

                // C commands
                if (type === 'C' || type === 'Q') {
                    let cp1 = { x: values[0], y: values[1] };
                    pts = type === 'C' ? [p0, cp1, { x: values[2], y: values[3] }, p] : [p0, cp1, p];
                    let areaBez = Math.abs(getBezierArea(pts));
                    comArea += areaBez;

                    polyPoints.push(p0, p);
                }

                // A commands
                else if (type === 'A') {
                    let arcData = svgArcToCenterParam(p0.x, p0.y, com.values[0], com.values[1], com.values[2], com.values[3], com.values[4], p.x, p.y);
                    let { cx, cy, rx, ry, startAngle, endAngle, deltaAngle } = arcData;

                    let arcArea = Math.abs(getEllipseArea(rx, ry, startAngle, endAngle));

                    // subtract remaining polygon between p0, center and p
                    let polyArea = Math.abs(getPolygonArea([p0, { x: cx, y: cy }, p]));
                    arcArea -= polyArea;

                    polyPoints.push(p0, p);
                    comArea += arcArea;
                }

                // L commands
                else {
                    polyPoints.push(p0, p);
                }
            }
        });

        let areaPoly = getPolygonArea(polyPoints);

        if (counterShapes.indexOf(d) !== -1) {
            multiplier = -1;
        }

        if (
            (areaPoly < 0 && comArea < 0)
        ) {
            // are negative
            pathArea = (Math.abs(comArea) - Math.abs(areaPoly)) * multiplier;

        } else {
            pathArea = (Math.abs(comArea) + Math.abs(areaPoly)) * multiplier;
        }

        totalArea += pathArea;
    });

    return totalArea;
}

/**
 * get ellipse area
 * skips to circle calculation if rx===ry
 */

function getEllipseArea(rx, ry, startAngle, endAngle) {
    const totalArea = Math.PI * rx * ry;
    let angleDiff = (endAngle - startAngle + 2 * Math.PI) % (2 * Math.PI);
    // If circle, use simple circular formula
    if (rx === ry) return totalArea * (angleDiff / (2 * Math.PI));

    // Convert absolute angles to parametric angles
    const absoluteToParametric = (phi)=>{
      return Math.atan2(rx * Math.sin(phi), ry * Math.cos(phi));
    };
    startAngle = absoluteToParametric(startAngle);
    endAngle = absoluteToParametric(endAngle);
    angleDiff = (endAngle - startAngle + 2 * Math.PI) % (2 * Math.PI);
    return totalArea * (angleDiff / (2 * Math.PI));
}

/**
 * compare areas 
 * for thresholds
 * returns a percentage value
 */

function getRelativeAreaDiff(area0, area1) {
    let diff = Math.abs(area0 - area1);
    return Math.abs(100 - (100 / area0 * (area0 + diff)))
}

/**
 * get bezier area
 */
function getBezierArea(pts, absolute=false) {

    let [p0, cp1, cp2, p] = [pts[0], pts[1], pts[2], pts[pts.length - 1]];
    let area;

    if (pts.length < 3) return 0;

    // quadratic beziers
    if (pts.length === 3) {
        cp1 = {
            x: pts[0].x * 1 / 3 + pts[1].x * 2 / 3,
            y: pts[0].y * 1 / 3 + pts[1].y * 2 / 3
        };

        cp2 = {
            x: pts[2].x * 1 / 3 + pts[1].x * 2 / 3,
            y: pts[2].y * 1 / 3 + pts[1].y * 2 / 3
        };
    }

    area = ((p0.x * (-2 * cp1.y - cp2.y + 3 * p.y) +
        cp1.x * (2 * p0.y - cp2.y - p.y) +
        cp2.x * (p0.y + cp1.y - 2 * p.y) +
        p.x * (-3 * p0.y + cp1.y + 2 * cp2.y)) *
        3) / 20;
        
    return absolute ? Math.abs(area) : area;
}

function getPolygonArea(points, absolute=false) {
    let area = 0;
    for (let i = 0, len = points.length; len && i < len; i++) {
        let addX = points[i].x;
        let addY = points[i === points.length - 1 ? 0 : i + 1].y;
        let subX = points[i === points.length - 1 ? 0 : i + 1].x;
        let subY = points[i].y;
        area += addX * addY * 0.5 - subX * subY * 0.5;
    }
    if(absolute) area=Math.abs(area);
    return area;
}

/**
* serialize pathData array to 
* d attribute string 
*/

function pathDataToD(pathData, optimize = 0) {

    optimize = parseFloat(optimize);

    let len = pathData.length;
    let beautify = optimize > 1;
    let minify = beautify || optimize ? false : true;

    // Convert first "M" to "m" if followed by "l" (when minified)
    /*
    if (pathData[1].type === "l" && minify) {
        pathData[0].type = "m";
    }
    */

    let d = '';
    let separator_command = beautify ? `\n` : (minify ? '' : ' ');
    let separator_type =  !minify ? ' ' : '';

    d = `${pathData[0].type}${separator_type}${pathData[0].values.join(" ")}${separator_command}`;

    for (let i = 1; i < len; i++) {
        let com0 = pathData[i - 1];
        let com = pathData[i];
        let { type, values } = com;

        // Minify Arc commands (A/a) – actually sucks!
        if (minify && (type === 'A' || type === 'a')) {
            values = [
                values[0], values[1], values[2],
                `${values[3]}${values[4]}${values[5]}`,
                values[6]
            ];
        }

        // Omit type for repeated commands
        type = (com0.type === com.type && com.type.toLowerCase() !== 'm' && minify)
            ? " "
            : (
                (com0.type === "M" && com.type === "L")
            ) && minify
                ? " "
                : com.type;

        // concatenate subsequent floating point values
        if (minify) {

            let valsString = '';
            let prevWasFloat = false;

            for (let v = 0, l = values.length; v < l; v++) {
                let val = values[v];
                let valStr = val.toString();
                let isFloat = valStr.includes('.');
                let isSmallFloat = isFloat && Math.abs(val) < 1;

                // Remove leading zero from small floats *only* if the previous was also a float
                if (isSmallFloat && prevWasFloat) {
                    valStr = valStr.replace(/^0\./, '.');
                }

                // Add space unless this is the first value OR previous was a small float
                if (v > 0 && !(prevWasFloat && isSmallFloat)) {
                    valsString += ' ';
                }

                valsString += valStr;
                prevWasFloat = isSmallFloat;
            }

            d += `${type}${separator_type}${valsString}${separator_command}`;

        }
        // regular non-minified output
        else {
            d += `${type}${separator_type}${values.join(' ')}${separator_command}`;
        }
    }

    if (minify) {
        d = d
            .replace(/ 0\./g, " .") // Space before small decimals
            .replace(/ -/g, "-")     // Remove space before negatives
            .replace(/-0\./g, "-.")  // Remove leading zero from negative decimals
            .replace(/Z/g, "z");     // Convert uppercase 'Z' to lowercase
    }

    return d;
}

function getCombinedByDominant(com1, com2, maxDist = 0, tolerance = 1, debug = false) {

    // cubic Bézier derivative
    const cubicDerivative = (p0, p1, p2, p3, t) => {
        let mt = 1 - t;

        return {
            x:
                3 * mt * mt * (p1.x - p0.x) +
                6 * mt * t * (p2.x - p1.x) +
                3 * t * t * (p3.x - p2.x),
            y:
                3 * mt * mt * (p1.y - p0.y) +
                6 * mt * t * (p2.y - p1.y) +
                3 * t * t * (p3.y - p2.y)
        };
    };

    // if combining fails return original commands
    let commands = [com1, com2];

    // detect dominant 
    let dist1 = getDistAv(com1.p0, com1.p);
    let dist2 = getDistAv(com2.p0, com2.p);

    let reverse = dist1 > dist2;

    // backup original commands
    let com1_o = JSON.parse(JSON.stringify(com1));
    let com2_o = JSON.parse(JSON.stringify(com2));

    let ptI = checkLineIntersection(com1_o.p0, com1_o.cp1, com2_o.p, com2_o.cp2, false);

    if (!ptI) {

        return commands
    }

    if (reverse) {
        let com2_R = {
            p0: { x: com1.p.x, y: com1.p.y },
            cp1: { x: com1.cp2.x, y: com1.cp2.y },
            cp2: { x: com1.cp1.x, y: com1.cp1.y },
            p: { x: com1.p0.x, y: com1.p0.y },
        };

        let com1_R = {
            p0: { x: com2.p.x, y: com2.p.y },
            cp1: { x: com2.cp2.x, y: com2.cp2.y },
            cp2: { x: com2.cp1.x, y: com2.cp1.y },
            p: { x: com2.p0.x, y: com2.p0.y },
        };

        com1 = com1_R;
        com2 = com2_R;
    }

    let add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y });
    let sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y });
    let mul = (a, s) => ({ x: a.x * s, y: a.y * s });
    let dot = (a, b) => a.x * b.x + a.y * b.y;

    // estimate extrapolation parameter t0

    let B0 = com2.p0;
    let D0 = cubicDerivative(
        com2.p0,
        com2.cp1,
        com2.cp2,
        com2.p,
        0
    );

    let v = sub(com1.p0, B0);

    // first-order projection onto tangent
    let t0 = dot(v, D0) / dot(D0, D0);

    // refine with one Newton iteration (optional but cheap)
    let P = pointAtT([com2.p0, com2.cp1, com2.cp2, com2.p], t0);
    let dP = cubicDerivative(com2.p0, com2.cp1, com2.cp2, com2.p, t0);
    let r = sub(P, com1.p0);

    t0 -= dot(r, dP) / dot(dP, dP);

    // construct merged cubic over [t0, 1]
    let Q0 = pointAtT([com2.p0, com2.cp1, com2.cp2, com2.p], t0);
    let Q3 = com2.p;

    let d0 = cubicDerivative(com2.p0, com2.cp1, com2.cp2, com2.p, t0);
    let d1 = cubicDerivative(com2.p0, com2.cp1, com2.cp2, com2.p, 1);

    let scale = 1 - t0;

    let Q1 = add(Q0, mul(d0, scale / 3));
    let Q2 = sub(Q3, mul(d1, scale / 3));

    let result = {
        p0: Q0,
        cp1: Q1,
        cp2: Q2,
        p: Q3,
    };

    if (reverse) {
        result = {
            p0: Q3,
            cp1: Q2,
            cp2: Q1,
            p: Q0,
        };
    }

    let tMid = (1 - t0) * 0.5;

    let ptM = pointAtT([result.p0, result.cp1, result.cp2, result.p], tMid, false, true);
    let seg1_cp2 = ptM.cpts[2];

    let ptI_1 = checkLineIntersection(ptM, seg1_cp2, result.p0, ptI, false);
    let ptI_2 = checkLineIntersection(ptM, seg1_cp2, result.p, ptI, false);

    let cp1_2 = interpolate(result.p0, ptI_1, 1.333);
    let cp2_2 = interpolate(result.p, ptI_2, 1.333);

    // test self intersections and exit 
    let cp_intersection = checkLineIntersection(com1_o.p0, cp1_2, com2_o.p, cp2_2, true);
    if (cp_intersection) {

        return commands;
    }

    if (debug) renderPoint(markers, ptM, 'purple');

    result.cp1 = cp1_2;
    result.cp2 = cp2_2;

    // check distances between original starting point and extrapolated
    let dist3 = getDistAv(com1_o.p0, result.p0);
    let dist4 = getDistAv(com2_o.p, result.p);
    let dist5 = (dist3 + dist4);

    // use original points
    result.p0 = com1_o.p0;
    result.p = com2_o.p;
    result.extreme = com2_o.extreme;
    result.corner = com2_o.corner;
    result.dimA = com2_o.dimA;
    result.directionChange = com2_o.directionChange;
    result.type = 'C';
    result.values = [result.cp1.x, result.cp1.y, result.cp2.x, result.cp2.y, result.p.x, result.p.y];

    // extrapolated starting point is not completely off
    if (dist5 < maxDist) {

        // split t to meet original mid segment start point
        let tSplit = reverse ? 1 + t0 : Math.abs(t0);

        let ptSplit = pointAtT([result.p0, result.cp1, result.cp2, result.p], tSplit);
        let distSplit = getDistAv(ptSplit, com1.p);

        // not close enough - exit
        if (distSplit > maxDist * tolerance) {

            return commands;
        }

        // compare combined with original area
        let pathData0 = [
            { type: 'M', values: [com1_o.p0.x, com1_o.p0.y] },
            { type: 'C', values: [com1_o.cp1.x, com1_o.cp1.y, com1_o.cp2.x, com1_o.cp2.y, com1_o.p.x, com1_o.p.y] },
            { type: 'C', values: [com2_o.cp1.x, com2_o.cp1.y, com2_o.cp2.x, com2_o.cp2.y, com2_o.p.x, com2_o.p.y] },
        ];

        let area0 = getPathArea(pathData0);
        let pathDataN = [
            { type: 'M', values: [result.p0.x, result.p0.y] },
            { type: 'C', values: [result.cp1.x, result.cp1.y, result.cp2.x, result.cp2.y, result.p.x, result.p.y] },
        ];

        let areaN = getPathArea(pathDataN);
        let areaDiff = Math.abs(areaN / area0 - 1);

        result.error = areaDiff * 5 * tolerance;

        if (debug) {
            let d = pathDataToD(pathDataN);
            renderPath(markers, d, 'orange');
        }

        // success!!!
        if (areaDiff < 0.05 * tolerance) {
            commands = [result];

        } 
    }

    return commands

}

function combineCubicPairs(com1, com2, extrapolateDominant = false, tolerance = 1) {

    let commands = [com1, com2];
    let t = findSplitT(com1, com2);

    let distAv1 = getDistAv(com1.p0, com1.p);
    let distAv2 = getDistAv(com2.p0, com2.p);
    let distMin = Math.min(distAv1, distAv2);

    let distScale = 0.05;
    let maxDist = distMin * distScale * tolerance;

    let comS = getExtrapolatedCommand(com1, com2, t, t);

    // test on path point against original
    let pt = pointAtT([comS.p0, comS.cp1, comS.cp2, comS.p], t);

    let dist0 = getDistAv(com1.p, pt);
    let dist1 = 0, dist2 = 0;
    let close = dist0 < maxDist;
    let success = false;

    // collect error data
    let error = dist0;

    /*
    if (com2.directionChange) {

    }
    */

    if (close) {

        /**
         * check additional points
         * to prevent distortions
         */

        // 2nd segment mid
        let pt_2 = pointAtT([com2.p0, com2.cp1, com2.cp2, com2.p], 0.5);

        // simplified path
        let t3 = (1 + t) * 0.5;
        let ptS_2 = pointAtT([comS.p0, comS.cp1, comS.cp2, comS.p], t3);
        dist1 = getDistAv(pt_2, ptS_2);

        error += dist1;

        // quit - paths not congruent

        if (dist1 < maxDist) {

            // 1st segment mid
            let pt_1 = pointAtT([com1.p0, com1.cp1, com1.cp2, com1.p], 0.5);

            let t2 = t * 0.5;
            let ptS_1 = pointAtT([comS.p0, comS.cp1, comS.cp2, comS.p], t2);
            dist2 = getDistAv(pt_1, ptS_1);

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

        }

    } // end 1st try

    

    // try extrapolated dominant curve

    //  && !com1.extreme
    if (extrapolateDominant && !success  ) {

        let combinedEx = getCombinedByDominant(com1, com2, maxDist, tolerance);

        if(combinedEx.length===1){
            success = true;
            comS = combinedEx[0];
            error = comS.error;

        }

    
    }

    // add meta
    if (success) {

        
        // correct to exact start and end points
        comS.p0 = com1.p0;
        comS.p = com2.p;

        comS.dimA = getDistAv(comS.p0, comS.p);
        comS.type = 'C';
        comS.extreme = com2.extreme;
        comS.directionChange = com2.directionChange;
        comS.corner = com2.corner;

        comS.values = [comS.cp1.x, comS.cp1.y, comS.cp2.x, comS.cp2.y, comS.p.x, comS.p.y];

        // relative error
        comS.error = error / maxDist;

        commands = [comS];

    }

    return commands;
}

function getExtrapolatedCommand(com1, com2, t1 = 0, t2 = 0) {

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

    return comS

}

function findSplitT(com1, com2) {

    let len3 = getDistance(com1.cp2, com1.p);
    let len4 = getDistance(com1.cp2, com2.cp1);

    let t = Math.min(len3) / len4;

    return t
}

function checkBezierFlatness(p0, cpts, p) {

    let isFlat = false;

    let isCubic = cpts.length === 2;

    let cp1 = cpts[0];
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

    let area = getPolygonArea([p0,...cpts, p], true);
    let dist1 = getSquareDistance(p0, p);
    let thresh = dist1/200;

   // if(area<thresh) return true;
    isFlat = area<thresh;

    /*

    let rat = (cross0 / cross1)

    if (rat < 1.1) {
        console.log('cross', cross0, cross1, 'rat', rat );
        isFlat = true;
    }
    */

    return isFlat;

}

function analyzePathData(pathData = []) {

    let pathDataPlus = [];

    let pathPoly = getPathDataVertices(pathData);
    let bb = getPolyBBox(pathPoly);
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

        // init properties
        com.idx = c - 1;
        com.lineto = false;
        com.corner = false;
        com.extreme = false;
        com.directionChange = false;
        com.closePath = false;
        com.dimA = 0;

        /**
         * define angle threshold for 
         * corner detection
         */
        let angleThreshold = 0.05;
        p = valsL.length ? { x: valsL[0], y: valsL[1] } : M;

        // update M for Z starting points
        if (type === 'M') {
            M = p;
            p0 = p;
        }
        else if (type.toLowerCase() === 'z') {
            p = M;
        }

        // add on-path points
        com.p0 = p0;
        com.p = p;

        let cp1, cp2, cp1N, pN, typeN, area1;

        let dimA = getDistAv(p0, p);
        com.dimA = dimA;

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
            cp1 = { x: values[0], y: values[1] };
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
            let commandFlatness = commandIsFlat(commandPts);
            isFlat = commandFlatness.flat;
            com.flat = isFlat;

            if (isFlat) {
                com.extreme = false;
            }
            */
        }

        /**
         * is extreme relative to bounding box 
         * in case elements are rotated we can't rely on 90degree angles
         * so we interpret maximum x/y on-path points as well as extremes
         * but we ignore linetos to allow chunk compilation
         */
        if (type !== 'L' && (p.x === left || p.y === top || p.x === right || p.y === bottom)) {
            com.extreme = true;
        }

        let comN = pathData[c] ? pathData[c] : null;
        let comNValsL = comN ? comN.values.slice(-2) : null;
        typeN = comN ? comN.type : null;

        // get bezier control points
        if (comN && (comN.type === 'Q' || comN.type === 'C')) {
            pN = comN ? { x: comNValsL[0], y: comNValsL[1] } : null;

            cp1N = { x: comN.values[0], y: comN.values[1] };
            comN.type === 'C' ? { x: comN.values[2], y: comN.values[3] } : null;
        }

        /**
         * Detect direction change points
         * this will prevent distortions when simplifying
         * e.g in the "spine" of an "S" glyph
         */
        area1 = getPolygonArea(commandPts);
        let signChange = (area0 < 0 && area1 > 0) || (area0 > 0 && area1 < 0) ? true : false;
        // update area
        area0 = area1;

        if (signChange) {

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

                pN ? Math.abs(pN.x - p0.x) : 0;
                pN ? Math.abs(pN.y - p0.y) : 0;

                /**
                 * if current and next cubic are flat
                 * we don't flag them as extremes to allow simplification
                 */

                let hasExtremes = (!com.extreme ? bezierhasExtreme(p0, cpts, angleThreshold) : true);

                if (hasExtremes) {
                    com.extreme = true;
                }

                // check corners
                else {

                    let cpts1 = cp2 ? [cp2, p] : [cp1, p];
                    let cpts2 = cp2 ? [p, cp1N] : [p, cp1N];

                    let angCom1 = getAngle(...cpts1, true);
                    let angCom2 = getAngle(...cpts2, true);
                    let angDiff = Math.abs(angCom1 - angCom2) * 180 / Math.PI;

                    let cpDist1 = getSquareDistance(...cpts1);
                    let cpDist2 = getSquareDistance(...cpts2);

                    let cornerThreshold = 10;
                    let isCorner = angDiff > cornerThreshold && cpDist1 && cpDist2;

                    if (isCorner) {
                        com.corner = true;
                    }
                }
            }
        }

        pathDataProps.push(com);
        p0 = p;

    }

    let dimA = (width + height) / 2;

    pathDataPlus = { pathData: pathDataProps, bb: bb, dimA: dimA };

    return pathDataPlus

}

function detectAccuracy(pathData) {

    // Reference first MoveTo command (M)
    let M = { x: pathData[0].values[0], y: pathData[0].values[1] };
    let p0 = M;
    let p = M;
    pathData[0].decimals = 0;

    let dims = new Set();

    // add average distances
    for (let i = 0, len = pathData.length; i < len; i++) {
        let com = pathData[i];
        let { type, values } = com;

        let lastVals = values.length ? values.slice(-2) : [M.x, M.y];
        p = { x: lastVals[0], y: lastVals[1] };

        // use existing averave dimension value or calculate
        let dimA = com.dimA ? +com.dimA.toFixed(8) : type !== 'M' ? +getDistAv(p0, p).toFixed(8) : 0;

        if (dimA) dims.add(dimA);

        if (type === 'M') {
            M = p;
        }
        p0 = p;
    }

    let dim_min = Array.from(dims).sort();

    /*
    let minVal = dim_min.length > 15 ?
        (dim_min[0] + dim_min[2]) / 2 :
        dim_min[0];
    */
        
    let sliceIdx = Math.ceil(dim_min.length / 10);
    dim_min = dim_min.slice(0, sliceIdx);
    let minVal = dim_min.reduce((a, b) => a + b, 0) / sliceIdx;

    let threshold = 40;
    let decimalsAuto = minVal > threshold*1.5 ? 0 : Math.floor(threshold / minVal).toString().length;

    // clamp
    return Math.min(Math.max(0, decimalsAuto), 8)

}

/**
 * round path data
 * either by explicit decimal value or
 * based on suggested accuracy in path data
 */
function roundPathData(pathData, decimals = -1) {
    // has recommended decimals
    let hasDecimal = decimals == 'auto' && pathData[0].hasOwnProperty('decimals') ? true : false;

    for (let c = 0, len = pathData.length; c < len; c++) {
        let com = pathData[c];

        if (decimals > -1 || hasDecimal) {
            decimals = hasDecimal ? com.decimals : decimals;

            pathData[c].values = com.values.map(val => { return val ? +val.toFixed(decimals) : val });

        }
    }    return pathData;
}

function revertCubicQuadratic(p0 = {}, cp1 = {}, cp2 = {}, p = {}) {

    // test if cubic can be simplified to quadratic
    let cp1X = interpolate(p0, cp1, 1.5);
    let cp2X = interpolate(p, cp2, 1.5);

    let dist0 = getDistAv(p0, p);
    let threshold = dist0 * 0.01;
    let dist1 = getDistAv(cp1X, cp2X);

    let cp1_Q = null;
    let type = 'C';
    let values = [cp1.x, cp1.y, cp2.x, cp2.y, p.x, p.y];
    let comN = {type, values};

    if (dist1 < threshold) {
        cp1_Q = checkLineIntersection(p0, cp1, p, cp2, false);
        if (cp1_Q) {

            comN.type = 'Q';
            comN.values = [cp1_Q.x, cp1_Q.y, p.x, p.y];
            comN.p0 = p0;
            comN.cp1 = cp1_Q;
            comN.p = p;
        }
    }

    return comN

}

function convertPathData(pathData, {
    toShorthands = true,
    toRelative = true,
    decimals = 3
} = {}) {

    if (toShorthands) pathData = pathDataToShorthands(pathData);

    // pre round - before relative conversion to minimize distortions
    pathData = roundPathData(pathData, decimals);
    if (toRelative) pathData = pathDataToRelative(pathData);
    if (decimals > -1) pathData = roundPathData(pathData, decimals);
    return pathData
}

/**
 * convert cubic circle approximations
 * to more compact arcs
 */

function pathDataArcsToCubics(pathData, {
    arcAccuracy = 1
} = {}) {

    let pathDataCubic = [pathData[0]];
    for (let i = 1, len = pathData.length; i < len; i++) {

        let com = pathData[i];
        let comPrev = pathData[i - 1];
        let valuesPrev = comPrev.values;
        let valuesPrevL = valuesPrev.length;
        let p0 = { x: valuesPrev[valuesPrevL - 2], y: valuesPrev[valuesPrevL - 1] };

        if (com.type === 'A') {
            // add all C commands instead of Arc
            let cubicArcs = arcToBezier$1(p0, com.values, arcAccuracy);
            cubicArcs.forEach((cubicArc) => {
                pathDataCubic.push(cubicArc);
            });
        }

        else {
            // add command
            pathDataCubic.push(com);
        }
    }

    return pathDataCubic

}

function pathDataQuadraticToCubic(pathData) {

    let pathDataQuadratic = [pathData[0]];
    for (let i = 1, len = pathData.length; i < len; i++) {

        let com = pathData[i];
        let comPrev = pathData[i - 1];
        let valuesPrev = comPrev.values;
        let valuesPrevL = valuesPrev.length;
        let p0 = { x: valuesPrev[valuesPrevL - 2], y: valuesPrev[valuesPrevL - 1] };

        if (com.type === 'Q') {
            pathDataQuadratic.push(quadratic2Cubic(p0, com.values));
        }

        else {
            // add command
            pathDataQuadratic.push(com);
        }
    }

    return pathDataQuadratic
}

/**
 * convert quadratic commands to cubic
 */
function quadratic2Cubic(p0, values) {
    if (Array.isArray(p0)) {
        p0 = {
            x: p0[0],
            y: p0[1]
        };
    }
    let cp1 = {
        x: p0.x + 2 / 3 * (values[0] - p0.x),
        y: p0.y + 2 / 3 * (values[1] - p0.y)
    };
    let cp2 = {
        x: values[2] + 2 / 3 * (values[0] - values[2]),
        y: values[3] + 2 / 3 * (values[1] - values[3])
    };
    return ({ type: "C", values: [cp1.x, cp1.y, cp2.x, cp2.y, values[2], values[3]] });
}

/**
 * convert pathData to 
 * This is just a port of Dmitry Baranovskiy's 
 * pathToRelative/Absolute methods used in snap.svg
 * https://github.com/adobe-webplatform/Snap.svg/
 */

function pathDataToAbsoluteOrRelative(pathData, toRelative = false, decimals = -1) {
    if (decimals >= 0) {
        pathData[0].values = pathData[0].values.map(val => +val.toFixed(decimals));
    }

    let M = pathData[0].values;
    let x = M[0],
        y = M[1],
        mx = x,
        my = y;

    for (let i = 1, len = pathData.length; i < len; i++) {
        let com = pathData[i];
        let { type, values } = com;
        let newType = toRelative ? type.toLowerCase() : type.toUpperCase();

        if (type !== newType) {
            type = newType;
            com.type = type;

            switch (type) {
                case "a":
                case "A":
                    values[5] = toRelative ? values[5] - x : values[5] + x;
                    values[6] = toRelative ? values[6] - y : values[6] + y;
                    break;
                case "v":
                case "V":
                    values[0] = toRelative ? values[0] - y : values[0] + y;
                    break;
                case "h":
                case "H":
                    values[0] = toRelative ? values[0] - x : values[0] + x;
                    break;
                case "m":
                case "M":
                    if (toRelative) {
                        values[0] -= x;
                        values[1] -= y;
                    } else {
                        values[0] += x;
                        values[1] += y;
                    }
                    mx = toRelative ? values[0] + x : values[0];
                    my = toRelative ? values[1] + y : values[1];
                    break;
                default:
                    if (values.length) {
                        for (let v = 0; v < values.length; v++) {
                            values[v] = toRelative
                                ? values[v] - (v % 2 ? y : x)
                                : values[v] + (v % 2 ? y : x);
                        }
                    }
            }
        }

        let vLen = values.length;
        switch (type) {
            case "z":
            case "Z":
                x = mx;
                y = my;
                break;
            case "h":
            case "H":
                x = toRelative ? x + values[0] : values[0];
                break;
            case "v":
            case "V":
                y = toRelative ? y + values[0] : values[0];
                break;
            case "m":
            case "M":
                mx = values[vLen - 2] + (toRelative ? x : 0);
                my = values[vLen - 1] + (toRelative ? y : 0);
            default:
                x = values[vLen - 2] + (toRelative ? x : 0);
                y = values[vLen - 1] + (toRelative ? y : 0);
        }

        if (decimals >= 0) {
            com.values = com.values.map(val => +val.toFixed(decimals));
        }
    }
    return pathData;
}

function pathDataToRelative(pathData, decimals = -1) {
    return pathDataToAbsoluteOrRelative(pathData, true, decimals)
}

function pathDataToAbsolute(pathData, decimals = -1) {
    return pathDataToAbsoluteOrRelative(pathData, false, decimals)
}

/**
 * decompose/convert shorthands to "longhand" commands:
 * H, V, S, T => L, L, C, Q
 * reversed method: pathDataToShorthands()
 */

function pathDataToLonghands(pathData, decimals = -1, test = true) {

    // analyze pathdata – if you're sure your data is already absolute skip it via test=false
    let hasRel = false;

    if (test) {
        let commandTokens = pathData.map(com => { return com.type }).join('');
        let hasShorthands = /[hstv]/gi.test(commandTokens);
        hasRel = /[astvqmhlc]/g.test(commandTokens);

        if (!hasShorthands) {
            return pathData;
        }
    }

    pathData = test && hasRel ? pathDataToAbsolute(pathData, decimals) : pathData;

    let pathDataLonghand = [];
    let comPrev = {
        type: "M",
        values: pathData[0].values
    };
    pathDataLonghand.push(comPrev);

    for (let i = 1, len = pathData.length; i < len; i++) {
        let com = pathData[i];
        let { type, values } = com;
        let valuesL = values.length;
        let valuesPrev = comPrev.values;
        let valuesPrevL = valuesPrev.length;
        let [x, y] = [values[valuesL - 2], values[valuesL - 1]];
        let cp1X, cp1Y, cpN1X, cpN1Y, cpN2X, cpN2Y, cp2X, cp2Y;
        let [prevX, prevY] = [
            valuesPrev[valuesPrevL - 2],
            valuesPrev[valuesPrevL - 1]
        ];
        switch (type) {
            case "H":
                comPrev = {
                    type: "L",
                    values: [values[0], prevY]
                };
                break;
            case "V":
                comPrev = {
                    type: "L",
                    values: [prevX, values[0]]
                };
                break;
            case "T":
                [cp1X, cp1Y] = [valuesPrev[0], valuesPrev[1]];
                [prevX, prevY] = [
                    valuesPrev[valuesPrevL - 2],
                    valuesPrev[valuesPrevL - 1]
                ];
                // new control point
                cpN1X = prevX + (prevX - cp1X);
                cpN1Y = prevY + (prevY - cp1Y);
                comPrev = {
                    type: "Q",
                    values: [cpN1X, cpN1Y, x, y]
                };
                break;
            case "S":

                [cp1X, cp1Y] = [valuesPrev[0], valuesPrev[1]];
                [prevX, prevY] = [
                    valuesPrev[valuesPrevL - 2],
                    valuesPrev[valuesPrevL - 1]
                ];

                [cp2X, cp2Y] =
                    valuesPrevL > 2 && comPrev.type !== 'A' ?
                        [valuesPrev[2], valuesPrev[3]] :
                        [prevX, prevY];

                // new control points
                cpN1X = 2 * prevX - cp2X;
                cpN1Y = 2 * prevY - cp2Y;
                cpN2X = values[0];
                cpN2Y = values[1];
                comPrev = {
                    type: "C",
                    values: [cpN1X, cpN1Y, cpN2X, cpN2Y, x, y]
                };

                break;
            default:
                comPrev = {
                    type: type,
                    values: values
                };
        }
        // round final longhand values
        if (decimals > -1) {
            comPrev.values = comPrev.values.map(val => { return +val.toFixed(decimals) });
        }

        pathDataLonghand.push(comPrev);
    }
    return pathDataLonghand;
}

/**
 * apply shorthand commands if possible
 * L, L, C, Q => H, V, S, T
 * reversed method: pathDataToLonghands()
 */
function pathDataToShorthands(pathData, decimals = -1, test = true) {

    /** 
    * analyze pathdata – if you're sure your data is already absolute skip it via test=false
    */
    let hasRel;
    if (test) {
        let commandTokens = pathData.map(com => { return com.type }).join('');
        hasRel = /[astvqmhlc]/g.test(commandTokens);
    }

    pathData = test && hasRel ? pathDataToAbsolute(pathData, decimals) : pathData;

    let comShort = {
        type: "M",
        values: pathData[0].values
    };

    if (pathData[0].decimals) {

        comShort.decimals = pathData[0].decimals;
    }

    let pathDataShorts = [comShort];

    let p0 = { x: pathData[0].values[0], y: pathData[0].values[1] };
    let p;
    let tolerance = 0.01;

    for (let i = 1, len = pathData.length; i < len; i++) {

        let com = pathData[i];
        let { type, values } = com;
        let valuesLast = values.slice(-2);

        // previoius command
        let comPrev = pathData[i - 1];
        let typePrev = comPrev.type;

        p = { x: valuesLast[0], y: valuesLast[1] };

        // first bezier control point for S/T shorthand tests
        let cp1 = { x: values[0], y: values[1] };

        let w = Math.abs(p.x - p0.x);
        let h = Math.abs(p.y - p0.y);
        let thresh = (w + h) / 2 * tolerance;

        let diffX, diffY, diff, cp1_reflected;

        switch (type) {
            case "L":

                if (h === 0 || (h < thresh && w > thresh)) {

                    comShort = {
                        type: "H",
                        values: [values[0]]
                    };
                }

                // V
                else if (w === 0 || (h > thresh && w < thresh)) {

                    comShort = {
                        type: "V",
                        values: [values[1]]
                    };
                } else {

                    comShort = com;
                }

                break;

            case "Q":

                // skip test
                if (typePrev !== 'Q') {

                    p0 = { x: valuesLast[0], y: valuesLast[1] };
                    pathDataShorts.push(com);
                    continue;
                }

                let cp1_prev = { x: comPrev.values[0], y: comPrev.values[1] };
                // reflected Q control points
                cp1_reflected = { x: (2 * p0.x - cp1_prev.x), y: (2 * p0.y - cp1_prev.y) };

                diffX = Math.abs(cp1.x - cp1_reflected.x);
                diffY = Math.abs(cp1.y - cp1_reflected.y);
                diff = (diffX + diffY) / 2;

                if (diff < thresh) {

                    comShort = {
                        type: "T",
                        values: [p.x, p.y]
                    };
                } else {
                    comShort = com;
                }

                break;
            case "C":

                let cp2 = { x: values[2], y: values[3] };

                if (typePrev !== 'C') {

                    pathDataShorts.push(com);
                    p0 = { x: valuesLast[0], y: valuesLast[1] };
                    continue;
                }

                let cp2_prev = { x: comPrev.values[2], y: comPrev.values[3] };

                // reflected C control points
                cp1_reflected = { x: (2 * p0.x - cp2_prev.x), y: (2 * p0.y - cp2_prev.y) };

                diffX = Math.abs(cp1.x - cp1_reflected.x);
                diffY = Math.abs(cp1.y - cp1_reflected.y);
                diff = (diffX + diffY) / 2;

                if (diff < thresh) {

                    comShort = {
                        type: "S",
                        values: [cp2.x, cp2.y, p.x, p.y]
                    };
                } else {
                    comShort = com;
                }
                break;
            default:
                comShort = {
                    type: type,
                    values: values
                };
        }

        // add decimal info
        if (com.decimals || com.decimals === 0) {
            comShort.decimals = com.decimals;
        }

        // round final values
        if (decimals > -1) {
            comShort.values = comShort.values.map(val => { return +val.toFixed(decimals) });
        }

        p0 = { x: valuesLast[0], y: valuesLast[1] };
        pathDataShorts.push(comShort);
    }
    return pathDataShorts;
}

/** 
 * convert arctocommands to cubic bezier
 * based on puzrin's a2c.js
 * https://github.com/fontello/svgpath/blob/master/lib/a2c.js
 * returns pathData array
*/

function arcToBezier$1(p0, values, splitSegments = 1) {
    const TAU = Math.PI * 2;
    let [rx, ry, rotation, largeArcFlag, sweepFlag, x, y] = values;

    if (rx === 0 || ry === 0) {
        return []
    }

    let phi = rotation ? rotation * TAU / 360 : 0;
    let sinphi = phi ? Math.sin(phi) : 0;
    let cosphi = phi ? Math.cos(phi) : 1;
    let pxp = cosphi * (p0.x - x) / 2 + sinphi * (p0.y - y) / 2;
    let pyp = -sinphi * (p0.x - x) / 2 + cosphi * (p0.y - y) / 2;

    if (pxp === 0 && pyp === 0) {
        return []
    }
    rx = Math.abs(rx);
    ry = Math.abs(ry);
    let lambda =
        pxp * pxp / (rx * rx) +
        pyp * pyp / (ry * ry);
    if (lambda > 1) {
        let lambdaRt = Math.sqrt(lambda);
        rx *= lambdaRt;
        ry *= lambdaRt;
    }

    /** 
     * parametrize arc to 
     * get center point start and end angles
     */
    let rxsq = rx * rx,
        rysq = rx === ry ? rxsq : ry * ry;

    let pxpsq = pxp * pxp,
        pypsq = pyp * pyp;
    let radicant = (rxsq * rysq) - (rxsq * pypsq) - (rysq * pxpsq);

    if (radicant <= 0) {
        radicant = 0;
    } else {
        radicant /= (rxsq * pypsq) + (rysq * pxpsq);
        radicant = Math.sqrt(radicant) * (largeArcFlag === sweepFlag ? -1 : 1);
    }

    let centerxp = radicant ? radicant * rx / ry * pyp : 0;
    let centeryp = radicant ? radicant * -ry / rx * pxp : 0;
    let centerx = cosphi * centerxp - sinphi * centeryp + (p0.x + x) / 2;
    let centery = sinphi * centerxp + cosphi * centeryp + (p0.y + y) / 2;

    let vx1 = (pxp - centerxp) / rx;
    let vy1 = (pyp - centeryp) / ry;
    let vx2 = (-pxp - centerxp) / rx;
    let vy2 = (-pyp - centeryp) / ry;

    // get start and end angle
    const vectorAngle = (ux, uy, vx, vy) => {
        let dot = +(ux * vx + uy * vy).toFixed(9);
        if (dot === 1 || dot === -1) {
            return dot === 1 ? 0 : Math.PI
        }
        dot = dot > 1 ? 1 : (dot < -1 ? -1 : dot);
        let sign = (ux * vy - uy * vx < 0) ? -1 : 1;
        return sign * Math.acos(dot);
    };

    let ang1 = vectorAngle(1, 0, vx1, vy1),
        ang2 = vectorAngle(vx1, vy1, vx2, vy2);

    if (sweepFlag === 0 && ang2 > 0) {
        ang2 -= Math.PI * 2;
    }
    else if (sweepFlag === 1 && ang2 < 0) {
        ang2 += Math.PI * 2;
    }

    let ratio = +(Math.abs(ang2) / (TAU / 4)).toFixed(0) || 1;

    // increase segments for more accureate length calculations
    let segments = ratio * splitSegments;
    ang2 /= segments;
    let pathDataArc = [];

    // If 90 degree circular arc, use a constant
    // https://pomax.github.io/bezierinfo/#circles_cubic
    // k=0.551784777779014
    const angle90 = 1.5707963267948966;
    const k = 0.551785;
    let a = ang2 === angle90 ? k :
        (
            ang2 === -angle90 ? -k : 4 / 3 * Math.tan(ang2 / 4)
        );

    let cos2 = ang2 ? Math.cos(ang2) : 1;
    let sin2 = ang2 ? Math.sin(ang2) : 0;
    let type = 'C';

    const approxUnitArc = (ang1, ang2, a, cos2, sin2) => {
        let x1 = ang1 != ang2 ? Math.cos(ang1) : cos2;
        let y1 = ang1 != ang2 ? Math.sin(ang1) : sin2;
        let x2 = Math.cos(ang1 + ang2);
        let y2 = Math.sin(ang1 + ang2);

        return [
            { x: x1 - y1 * a, y: y1 + x1 * a },
            { x: x2 + y2 * a, y: y2 - x2 * a },
            { x: x2, y: y2 }
        ];
    };

    for (let i = 0; i < segments; i++) {
        let com = { type: type, values: [] };
        let curve = approxUnitArc(ang1, ang2, a, cos2, sin2);

        curve.forEach((pt) => {
            let x = pt.x * rx;
            let y = pt.y * ry;
            com.values.push(cosphi * x - sinphi * y + centerx, sinphi * x + cosphi * y + centery);
        });
        pathDataArc.push(com);
        ang1 += ang2;
    }

    return pathDataArc;
}

/**
 * cubics to arcs
 */

function cubicCommandToArc(p0, cp1, cp2, p, tolerance = 7.5) {

    let com = { type: 'C', values: [cp1.x, cp1.y, cp2.x, cp2.y, p.x, p.y] };

    let arcSegArea = 0, isArc = false;

    // check angles
    let angle1 = getAngle(p0, cp1, true);
    let angle2 = getAngle(p, cp2, true);
    let deltaAngle = Math.abs(angle1 - angle2) * 180 / Math.PI;

    let angleDiff = Math.abs((deltaAngle % 180) - 90);
    let isRightAngle = angleDiff < 3;

    /*
    let cp1_r = rotatePoint(cp1, p0.x, p0.y, (Math.PI * -0.5))
    let cp2_r = rotatePoint(cp2, p.x, p.y, (Math.PI * 0.5))

    // assumed centroid
    let ptC = checkLineIntersection(p0, cp1_r, p, cp2_r, false)

    let dist0 = getSquareDistance(p0, p)
    let dist1 = getSquareDistance(p0, ptC)
    let dist2 = getSquareDistance(p, ptC)

    // let mid point
    let ptM = pointAtT([p0, cp1, cp2, p], 0.5)

    let diff1 = Math.abs(dist1 - dist2)

    if (diff1 <= dist0 * 0.01) {

        let r = Math.sqrt((dist1 + dist2) / 2)

        let arcArea = getPolygonArea([p0, cp1, cp2, p])
        let sweep = arcArea < 0 ? 0 : 1;

        // new arc command
        let comArc = { type: 'A', values: [r, r, 0, 0, sweep, p.x, p.y] };

        isArc = true;

        return { com: comArc, isArc, area: arcSegArea }

}
        */

    if (isRightAngle) {
        // point between cps

        let pI = checkLineIntersection(p0, cp1, p, cp2, false);

        if (pI) {

            let r1 = getDistance(p0, pI);
            let r2 = getDistance(p, pI);

            let rMax = +Math.max(r1, r2).toFixed(8);
            let rMin = +Math.min(r1, r2).toFixed(8);

            let rx = rMin;
            let ry = rMax;

            let arcArea = getPolygonArea([p0, cp1, cp2, p]);
            let sweep = arcArea < 0 ? 0 : 1;

            let w = Math.abs(p.x - p0.x);
            let h = Math.abs(p.y - p0.y);
            let landscape = w > h;

            let circular = (100 / rx * Math.abs(rx - ry)) < 5;

            if (circular) {

                rx = rMax;
                ry = rx;
            }

            if (landscape) {

                rx = rMax;
                ry = rMin;
            }

            // get original cubic area 
            let comO = [
                { type: 'M', values: [p0.x, p0.y] },
                { type: 'C', values: [cp1.x, cp1.y, cp2.x, cp2.y, p.x, p.y] }
            ];

            let comArea = getPathArea(comO);

            // new arc command
            let comArc = { type: 'A', values: [rx, ry, 0, 0, sweep, p.x, p.y] };

            // calculate arc seg area
            arcSegArea = (Math.PI * (rx * ry)) / 4;

            // subtract polygon between start, end and center point
            arcSegArea -= Math.abs(getPolygonArea([p0, p, pI]));

            let areaDiff = getRelativeAreaDiff(comArea, arcSegArea);

            if (areaDiff < tolerance) {
                isArc = true;
                com = comArc;
            }

        }
    }

    return { com: com, isArc, area: arcSegArea }

}

/**
 * combine adjacent arcs
 */

function combineArcs(pathData) {

    let arcSeq = [[]];
    let ind = 0;
    let arcIndices = [[]];
    let p0 = { x: pathData[0].values[0], y: pathData[0].values[1] }, p;

    for (let i = 0, len = pathData.length; i < len; i++) {
        let com = pathData[i];
        let { type, values } = com;

        if (type === 'A') {

            let comPrev = pathData[i - 1];

            /** 
             * previous p0 values might not be correct 
             * anymore due to cubic simplification
             */
            let valsL = comPrev.values.slice(-2);
            p0 = { x: valsL[0], y: valsL[1] };

            let [rx, ry, xAxisRotation, largeArc, sweep, x, y] = values;

            // check if arc is circular
            let circular = (100 / rx * Math.abs(rx - ry)) < 5;

            p = { x: values[5], y: values[6] };
            com.p0 = p0;
            com.p = p;
            com.circular = circular;

            let comNext = pathData[i + 1];

            if (!arcSeq[ind].length && comNext && comNext.type === 'A') {
                arcSeq[ind].push(com);
                arcIndices[ind].push(i);
            }

            if (comNext && comNext.type === 'A') {
                let [rx1, ry1, xAxisRotation0, largeArc, sweep, x, y] = comNext.values;
                let diffRx = rx != rx1 ? 100 / rx * Math.abs(rx - rx1) : 0;
                let diffRy = ry != ry1 ? 100 / ry * Math.abs(ry - ry1) : 0;

                p = { x: comNext.values[5], y: comNext.values[6] };
                comNext.p0 = p0;
                comNext.p = p;

                // add if radii are almost same
                if (diffRx < 5 && diffRy < 5) {

                    arcSeq[ind].push(comNext);
                    arcIndices[ind].push(i + 1);
                } else {

                    // start new segment
                    arcSeq.push([]);
                    arcIndices.push([]);
                    ind++;

                }
            }

            else {

                arcSeq.push([]);
                arcIndices.push([]);
                ind++;
            }
        }
    }

    if (!arcIndices.length) return pathData;

    arcSeq = arcSeq.filter(item => item.length);
    arcIndices = arcIndices.filter(item => item.length);

    // Process in reverse to avoid index shifting
    for (let i = arcSeq.length - 1; i >= 0; i--) {
        const seq = arcSeq[i];
        const start = arcIndices[i][0];
        const len = seq.length;

        // Average radii to prevent distortions
        let rxA = 0, ryA = 0;
        seq.forEach(({ values }) => {
            const [rx, ry] = values;
            rxA += rx;
            ryA += ry;
        });
        rxA /= len;
        ryA /= len;

        // Correct near-circular arcs

        // check if arc is circular
        let circular = (100 / rxA * Math.abs(rxA - ryA)) < 5;

        if (circular) {
            // average radii
            rxA = (rxA + ryA) / 2;
            ryA = rxA;
        }

        let comPrev = pathData[start - 1];
        let comPrevVals = comPrev.values.slice(-2);
        ({ type: 'M', values: [comPrevVals[0], comPrevVals[1]] });

        if (len === 4) {

            let [rx, ry, xAxisRotation, largeArc, sweep, x1, y1] = seq[1].values;
            let [, , , , , x2, y2] = seq[3].values;

            if (circular) {

                // simplify radii
                rxA = 1;
                ryA = 1;
            }

            let com1 = { type: 'A', values: [rxA, ryA, xAxisRotation, largeArc, sweep, x1, y1] };
            let com2 = { type: 'A', values: [rxA, ryA, xAxisRotation, largeArc, sweep, x2, y2] };

            // This now correctly replaces the original 4 arc commands with 2
            pathData.splice(start, len, com1, com2);

        }

        else if (len === 3) {

            let [rx, ry, xAxisRotation, largeArc, sweep, x1, y1] = seq[0].values;
            let [rx2, ry2, , , , x2, y2] = seq[2].values;

            // must be large arc
            largeArc = 1;
            let com1 = { type: 'A', values: [rxA, ryA, xAxisRotation, largeArc, sweep, x2, y2] };

            // replace
            pathData.splice(start, len, com1);

        }

        else if (len === 2) {

            let [rx, ry, xAxisRotation, largeArc, sweep, x1, y1] = seq[0].values;
            let [rx2, ry2, , , , x2, y2] = seq[1].values;

            // if circular or non-elliptic xAxisRotation has no effect
            if (circular) {
                rxA = 1;
                ryA = 1;
                xAxisRotation = 0;
            }

            // check if arc is already ideal
            let { p0, p } = seq[0];
            let [p0_1, p_1] = [seq[1].p0, seq[1].p];

            if (p0.x !== p_1.x || p0.y !== p_1.y) {

                let com1 = { type: 'A', values: [rxA, ryA, xAxisRotation, largeArc, sweep, x2, y2] };

                // replace
                pathData.splice(start, len, com1);
            }
        }

        else ;
    }

    return pathData
}

/**
 * parse normalized
 */

function normalizePathData(pathData = [],
    {
        toAbsolute = true,
        toLonghands = true,
        quadraticToCubic = false,
        arcToCubic = false,
        arcAccuracy = 2,
    } = {},

    {
        hasRelatives = true, hasShorthands = true, hasQuadratics = true, hasArcs = true, testTypes = false
    } = {}
) {

    // pathdata properties - test= true adds a manual test 
    if (testTypes) {

        let commands = Array.from(new Set(pathData.map(com => com.type))).join('');
        hasRelatives = /[lcqamts]/gi.test(commands);
        hasQuadratics = /[qt]/gi.test(commands);
        hasArcs = /[a]/gi.test(commands);
        hasShorthands = /[vhst]/gi.test(commands);
        isPoly = /[mlz]/gi.test(commands);
    }

    /**
     * normalize:
     * convert to all absolute
     * all longhands
     */

    if ((hasQuadratics && quadraticToCubic) || (hasArcs && arcToCubic)) {
        toLonghands = true;
        toAbsolute = true;
    }

    if (hasRelatives && toAbsolute) pathData = pathDataToAbsoluteOrRelative(pathData, false);
    if (hasShorthands && toLonghands) pathData = pathDataToLonghands(pathData, -1, false);
    if (hasArcs && arcToCubic) pathData = pathDataArcsToCubics(pathData, arcAccuracy);
    if (hasQuadratics && quadraticToCubic) pathData = pathDataQuadraticToCubic(pathData);

    return pathData;

}

function parsePathDataNormalized(d,
    {
        // necessary for most calculations
        toAbsolute = true,
        toLonghands = true,

        // not necessary unless you need cubics only
        quadraticToCubic = false,

        // mostly a fallback if arc calculations fail      
        arcToCubic = false,
        // arc to cubic precision - adds more segments for better precision     
        arcAccuracy = 4,
    } = {}
) {

    let pathDataObj = parsePathDataString(d);
    let { hasRelatives, hasShorthands, hasQuadratics, hasArcs } = pathDataObj;
    let pathData = pathDataObj.pathData;

    // normalize
    pathData = normalizePathData(pathData,
        { toAbsolute, toLonghands, quadraticToCubic, arcToCubic, arcAccuracy },

        { hasRelatives, hasShorthands, hasQuadratics, hasArcs }
    );

    return pathData;
}

const commandSet = new Set([
    0x4D, 0x6D, 0x41, 0x61, 0x43, 0x63,
    0x4C, 0x6C, 0x51, 0x71, 0x53, 0x73,
    0x54, 0x74, 0x48, 0x68, 0x56, 0x76,
    0x5A, 0x7A
]);

const paramCountsArr = new Uint8Array(128);
// M starting point
paramCountsArr[0x4D] = 2;
paramCountsArr[0x6D] = 2;

// A Arc
paramCountsArr[0x41] = 7;
paramCountsArr[0x61] = 7;

// C Cubic Bézier
paramCountsArr[0x43] = 6;
paramCountsArr[0x63] = 6;

// L Line To
paramCountsArr[0x4C] = 2;
paramCountsArr[0x6C] = 2;

// Q Quadratic Bézier
paramCountsArr[0x51] = 4;
paramCountsArr[0x71] = 4;

// S Smooth Cubic Bézier
paramCountsArr[0x53] = 4;
paramCountsArr[0x73] = 4;

// T Smooth Quadratic Bézier
paramCountsArr[0x54] = 2;
paramCountsArr[0x74] = 2;

// H Horizontal Line
paramCountsArr[0x48] = 1;
paramCountsArr[0x68] = 1;

// V Vertical Line
paramCountsArr[0x56] = 1;
paramCountsArr[0x76] = 1;

// Z Close Path
paramCountsArr[0x5A] = 0;
paramCountsArr[0x7A] = 0;

function parsePathDataString(d, debug = true) {
    d = d.trim();

    if (d === '') {
        return {
            pathData: [],
            hasRelatives: false,
            hasShorthands: false,
            hasQuadratics: false,
            hasArcs: false
        }
    }

    const SPECIAL_SPACES = new Set([
        0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006,
        0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF
    ]);

    const isSpace = (ch) => {
        return (ch === 0x20) || (ch === 0x002C) || // White spaces or comma
            (ch === 0x0A) || (ch === 0x0D) ||   // nl cr
            (ch === 0x2028) || (ch === 0x2029) || // Line terminators
            (ch === 0x09) || (ch === 0x0B) || (ch === 0x0C) || (ch === 0xA0) ||
            (ch >= 0x1680 && SPECIAL_SPACES.has(ch));
    };

    let i = 0, len = d.length;
    let lastCommand = "";
    let pathData = [];
    let itemCount = -1;
    let val = '';
    let wasE = false;
    let floatCount = 0;
    let valueIndex = 0;
    let maxParams = 0;
    let needsNewSegment = false;
    let foundCommands = new Set([]);

    // collect errors 
    let log = [];
    let feedback;

    const addSeg = () => {
        // Create new segment if needed before adding the minus sign
        if (needsNewSegment) {

            // sanitize implicit linetos
            if (lastCommand === 'M') lastCommand = 'L';
            else if (lastCommand === 'm') lastCommand = 'l';

            pathData.push({ type: lastCommand, values: [] });

            itemCount++;
            valueIndex = 0;
            needsNewSegment = false;
        }
    };

    const pushVal = (checkFloats = false) => {

        // regular value or float
        if (!checkFloats ? val !== '' : floatCount > 0) {

            // error: no first command
            if (debug && itemCount === -1) {

                feedback = 'Pathdata must start with M command';
                log.push(feedback);

                // add M command to collect subsequent errors
                lastCommand = 'M';
                pathData.push({ type: lastCommand, values: [] });
                maxParams = 2;
                valueIndex = 0;
                itemCount++;

            }

            if (lastCommand === 'A' || lastCommand === 'a') {
                val = sanitizeArc();

                pathData[itemCount].values.push(...val);

            } else {
                // error: leading zeroes
                if (debug && val[1] && val[1] !== '.' && val[0] === '0') {
                    feedback = `${itemCount}. command: Leading zeros not valid: ${val}`;
                    log.push(feedback);
                }
                pathData[itemCount].values.push(+val);
            }

            valueIndex++;
            val = '';
            floatCount = 0;

            // Mark that a new segment is needed if maxParams is reached
            needsNewSegment = valueIndex >= maxParams;

        }
    };

    const sanitizeArc = () => {

        let valLen = val.length;
        let arcSucks = false;

        // large arc and sweep
        if (valueIndex === 3 && valLen === 2) {

            val = [+val[0], +val[1]];
            arcSucks = true;
            valueIndex++;
        }

        // sweep and final
        else if (valueIndex === 4 && valLen > 1) {

            val = [+val[0], +val[1]];
            arcSucks = true;
            valueIndex++;
        }

        // large arc, sweep and final pt combined
        else if (valueIndex === 3 && valLen >= 3) {

            val = [+val[0], +val[1], +val.substring(2)];
            arcSucks = true;
            valueIndex += 2;
        }

        return !arcSucks ? [+val] : val;

    };

    const validateCommand = () => {

        if (itemCount > 0) {
            let lastCom = pathData[itemCount];
            let valLen = lastCom.values.length;

            if ((valLen && valLen < maxParams) || (valLen && valLen > maxParams) || ((lastCommand === 'z' || lastCommand === 'Z') && valLen > 0)) {
                let diff = maxParams - valLen;
                feedback = `${itemCount}. command of type "${lastCommand}": ${diff} values too few - ${maxParams} expected`;

                let prevFeedback = log[log.length - 1];

                if (prevFeedback !== feedback) {
                    log.push(feedback);
                }
            }
        }
    };

    let isE = false;
    let isMinusorPlus = false;
    let isDot = false;

    while (i < len) {

        let charCode = d.charCodeAt(i);

        let isDigit = (charCode > 47 && charCode < 58);
        if (!isDigit) {
            isE = (charCode === 101 || charCode === 69);
            isMinusorPlus = (charCode === 45 || charCode === 43);
            isDot = charCode === 46;
        }

        /**
         * number related:
         * digit, e-notation, dot or -/+ operator
         */

        if (
            isDigit ||
            isMinusorPlus ||
            isDot ||
            isE
        ) {

            // minus or float/dot separated: 0x2D=hyphen; 0x2E=dot
            if (!wasE && (charCode === 0x2D || charCode === 0x2E)) {

                // checkFloats changes condition for value adding
                let checkFloats = charCode === 0x2E;

                // new val
                pushVal(checkFloats);

                // new segment
                addSeg();

                // concatenated floats
                if (checkFloats) {
                    floatCount++;
                }
            }

            // regular splitting
            else {

                addSeg();
            }

            val += d[i];

            // e/scientific notation in value
            wasE = isE;
            i++;
            continue;
        }

        /**
         * Separated by white space 
         */
        if ((charCode < 48 || charCode > 5759) && isSpace(charCode)) {

            // push value
            pushVal();

            i++;
            continue;
        }

        /**
         * New command introduced by
         * alphabetic A-Z character
         */
        if (charCode > 64) {

            // is valid command
            let isValid = commandSet.has(charCode);

            if (!isValid) {
                feedback = `${itemCount}. command "${d[i]}" is not a valid type`;
                log.push(feedback);
                i++;
                continue
            }

            // command is concatenated without whitespace
            if (val !== '') {
                pathData[itemCount].values.push(+val);
                valueIndex++;
                val = '';
            }

            // check if previous command was correctly closed
            if (debug) validateCommand();

            lastCommand = d[i];
            maxParams = paramCountsArr[charCode];
            let isM = lastCommand === 'M' || lastCommand === 'm';
            let wasClosePath = itemCount > 0 && (pathData[itemCount].type === 'z' || pathData[itemCount].type === 'Z');

            foundCommands.add(lastCommand);

            // add omitted M command after Z
            if (wasClosePath && !isM) {
                pathData.push({ type: 'm', values: [0, 0] });
                itemCount++;
            }

            // init new command
            pathData.push({ type: lastCommand, values: [] });
            itemCount++;

            // reset counters
            floatCount = 0;
            valueIndex = 0;
            needsNewSegment = false;

            i++;
            continue;
        }

        // exceptions - prevent infinite loop
        if (!isDigit) {
            feedback = `${itemCount}. ${d[i]} is not a valid separarator or token`;
            log.push(feedback);
            val = '';
        }

        i++;

    }

    // final value
    pushVal();
    if (debug) validateCommand();

    // return error log
    if (debug && log.length) {
        feedback = 'Invalid path data:\n' + log.join('\n');
        if (debug === 'log') {
            console.log(feedback);
        } else {
            throw new Error(feedback)
        }
    }

    pathData[0].type = 'M';

    /**
     * check if absolute/relative or 
     * shorthands are present
     * to specify if normalization is required
     */

    let commands = Array.from(foundCommands).join('');
    let hasRelatives = /[lcqamts]/g.test(commands);
    let hasShorthands = /[vhst]/gi.test(commands);
    let hasArcs = /[a]/gi.test(commands);
    let hasQuadratics = /[qt]/gi.test(commands);

    return {
        pathData,
        hasRelatives,
        hasShorthands,
        hasQuadratics,
        hasArcs
    }

}

function stringifyPathData(pathData) {
    return pathData.map(com => { return `${com.type} ${com.values.join(' ')}` }).join(' ');
}

function shapeElToPath(el){

    let nodeName = el.nodeName.toLowerCase();
    if(nodeName==='path')return el;

    let pathData = getPathDataFromEl(el);
    let d = pathData.map(com=>{return `${com.type} ${com.values} `}).join(' ');
    let attributes = [...el.attributes].map(att=>att.name);

    let pathN = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    pathN.setAttribute('d', d );

    let exclude = ['x', 'y', 'cx', 'cy', 'dx', 'dy', 'r', 'rx', 'ry', 'width', 'height', 'points'];

    attributes.forEach(att=>{
        if(!exclude.includes(att)){
            let val = el.getAttribute(att);
            pathN.setAttribute(att, val);
        }
    });

    return pathN

}

// retrieve pathdata from svg geometry elements
function getPathDataFromEl(el, stringify=false) {

    let pathData = [];
    let type = el.nodeName;
    let atts, attNames, d, x, y, width, height, r, rx, ry, cx, cy, x1, x2, y1, y2;

    // convert relative or absolute units 
    const svgElUnitsToPixel = (el, decimals = 9) => {

        const svg = el.nodeName !== "svg" ? el.closest("svg") : el;

        // convert real life units to pixels
        const translateUnitToPixel = (value) => {

            if (value === null) {
                return 0
            }

            let dpi = 96;
            let unit = value.match(/([a-z]+)/gi);
            unit = unit ? unit[0] : "";
            let val = parseFloat(value);
            let rat;

            // no unit - already pixes/user unit
            if (!unit) {
                return val;
            }

            switch (unit) {
                case "in":
                    rat = dpi;
                    break;
                case "pt":
                    rat = (1 / 72) * 96;
                    break;
                case "cm":
                    rat = (1 / 2.54) * 96;
                    break;
                case "mm":
                    rat = ((1 / 2.54) * 96) / 10;
                    break;
                // just a default approximation
                case "em":
                case "rem":
                    rat = 16;
                    break;
                default:
                    rat = 1;
            }
            let valuePx = val * rat;
            return +valuePx.toFixed(decimals);
        };

        // svg width and height attributes
        let width = svg.getAttribute("width");
        width = width ? translateUnitToPixel(width) : 300;
        let height = svg.getAttribute("height");
        height = width ? translateUnitToPixel(height) : 150;

        let vB = svg.getAttribute("viewBox");
        vB = vB
            ? vB
                .replace(/,/g, " ")
                .split(" ")
                .filter(Boolean)
                .map((val) => {
                    return +val;
                })
            : [];

        let w = vB.length ? vB[2] : width;
        let h = vB.length ? vB[3] : height;
        let scaleX = w / 100;
        let scaleY = h / 100;
        let scalRoot = Math.sqrt((Math.pow(scaleX, 2) + Math.pow(scaleY, 2)) / 2);

        let attsH = ["x", "width", "x1", "x2", "rx", "cx", "r"];
        let attsV = ["y", "height", "y1", "y2", "ry", "cy"];

        let atts = el.getAttributeNames();
        atts.forEach((att) => {
            let val = el.getAttribute(att);
            let valAbs = val;
            if (attsH.includes(att) || attsV.includes(att)) {
                let scale = attsH.includes(att) ? scaleX : scaleY;
                scale = att === "r" && w != h ? scalRoot : scale;
                let unit = val.match(/([a-z|%]+)/gi);
                unit = unit ? unit[0] : "";
                if (val.includes("%")) {
                    valAbs = parseFloat(val) * scale;
                }

                else {
                    valAbs = translateUnitToPixel(val);
                }
                el.setAttribute(att, +valAbs);
            }
        });
    };

    svgElUnitsToPixel(el);

    const getAtts = (attNames) => {
        atts = {};
        attNames.forEach(att => {
            atts[att] = +el.getAttribute(att);
        });
        return atts
    };

    switch (type) {
        case 'path':
            d = el.getAttribute("d");
            pathData = parsePathDataNormalized(d);
            break;

        case 'rect':
            attNames = ['x', 'y', 'width', 'height', 'rx', 'ry'];
            ({ x, y, width, height, rx, ry } = getAtts(attNames));

            if (!rx && !ry) {
                pathData = [
                    { type: "M", values: [x, y] },
                    { type: "L", values: [x + width, y] },
                    { type: "L", values: [x + width, y + height] },
                    { type: "L", values: [x, y + height] },
                    { type: "Z", values: [] }
                ];
            } else {

                if (rx > width / 2) {
                    rx = width / 2;
                }
                if (ry > height / 2) {
                    ry = height / 2;
                }
                pathData = [
                    { type: "M", values: [x + rx, y] },
                    { type: "L", values: [x + width - rx, y] },
                    { type: "A", values: [rx, ry, 0, 0, 1, x + width, y + ry] },
                    { type: "L", values: [x + width, y + height - ry] },
                    { type: "A", values: [rx, ry, 0, 0, 1, x + width - rx, y + height] },
                    { type: "L", values: [x + rx, y + height] },
                    { type: "A", values: [rx, ry, 0, 0, 1, x, y + height - ry] },
                    { type: "L", values: [x, y + ry] },
                    { type: "A", values: [rx, ry, 0, 0, 1, x + rx, y] },
                    { type: "Z", values: [] }
                ];
            }
            break;

        case 'circle':
        case 'ellipse':

            attNames = ['cx', 'cy', 'rx', 'ry', 'r'];
            ({ cx, cy, r, rx, ry } = getAtts(attNames));

            if (type === 'circle') {
                r = r;
                rx = r;
                ry = r;
            } else {
                rx = rx ? rx : r;
                ry = ry ? ry : r;
            }

            pathData = [
                { type: "M", values: [cx + rx, cy] },
                { type: "A", values: [rx, ry, 0, 1, 1, cx - rx, cy] },
                { type: "A", values: [rx, ry, 0, 1, 1, cx + rx, cy] },
            ];

            break;
        case 'line':
            attNames = ['x1', 'y1', 'x2', 'y2'];
            ({ x1, y1, x2, y2 } = getAtts(attNames));
            pathData = [
                { type: "M", values: [x1, y1] },
                { type: "L", values: [x2, y2] }
            ];
            break;
        case 'polygon':
        case 'polyline':

            let points = el.getAttribute('points').replaceAll(',', ' ').split(' ').filter(Boolean);

            for (let i = 0; i < points.length; i += 2) {
                pathData.push({
                    type: (i === 0 ? "M" : "L"),
                    values: [+points[i], +points[i + 1]]
                });
            }
            if (type === 'polygon') {
                pathData.push({
                    type: "Z",
                    values: []
                });
            }
            break;
    }

    return stringify ? stringifyPathData(pathData): pathData;

}

function pathDataRemoveColinear(pathData, tolerance = 1, flatBezierToLinetos = true) {

    let pathDataN = [pathData[0]];
    let M = { x: pathData[0].values[0], y: pathData[0].values[1] };
    let p0 = M;
    let p = M;
    pathData[pathData.length - 1].type.toLowerCase() === 'z';

    for (let c = 1, l = pathData.length; c < l; c++) {
        let comPrev = pathData[c - 1];
        let com = pathData[c];
        let comN = pathData[c + 1] || pathData[l - 1];
        let p1 = comN.type.toLowerCase() === 'z' ? M : { x: comN.values[comN.values.length - 2], y: comN.values[comN.values.length - 1] };

        let { type, values } = com;
        let valsL = values.slice(-2);
        p = type !== 'Z' ? { x: valsL[0], y: valsL[1] } : M;

        let area = getPolygonArea([p0, p, p1], true);

        getSquareDistance(p0, p);
        getSquareDistance(p, p1);
        let distSquare = getSquareDistance(p0, p1);

        let distMax = distSquare / 200 * tolerance;

        let isFlat = area < distMax;
        let isFlatBez = false;

        if (!flatBezierToLinetos && type === 'C') isFlat = false;

        // convert flat beziers to linetos
        if (flatBezierToLinetos && (type === 'C' || type === 'Q')) {

            let cpts = type === 'C' ?
            [{ x: values[0], y: values[1] }, { x: values[2], y: values[3] }] :
            (type === 'Q' ? [{ x: values[0], y: values[1] }] : []);

            isFlatBez = checkBezierFlatness(p0, cpts, p);

           // console.log();

            if (isFlatBez  && c < l - 1 && comPrev.type !== 'C') {
                type = "L";
                com.type = "L";
                com.values = valsL;

            }

        }

        // update end point
        p0 = p;

        // colinear – exclude arcs (as always =) as semicircles won't have an area

        if ( isFlat && c < l - 1 && (type === 'L' || (flatBezierToLinetos && isFlatBez)) ) {

            

            continue;
        }

        if (type === 'M') {
            M = p;
            p0 = M;
        }

        else if (type === 'Z') {
            p0 = M;
        }

        // proceed and add command
        pathDataN.push(com);

    }

    return pathDataN;

}

function removeOrphanedM(pathData) {

    for (let i = 0, l = pathData.length; i < l; i++) {
        let com = pathData[i];
        if (!com) continue;
        let { type = null, values = [] } = com;
        let comN = pathData[i + 1] ? pathData[i + 1] : null;
        if ((type === 'M' || type === 'm')) {

            if (!comN || (comN && (comN.type === 'Z' || comN.type === 'z'))) {
                pathData[i] = null;
                pathData[i + 1] = null;
            }
        }
    }

    pathData = pathData.filter(Boolean);
    return pathData;

}

/*
// remove zero-length segments introduced by rounding
export function removeZeroLengthLinetos_post(pathData) {
    let pathDataOpt = []
    pathData.forEach((com, i) => {
        let { type, values } = com;
        if (type === 'l' || type === 'v' || type === 'h') {
            let hasLength = type === 'l' ? (values.join('') !== '00') : values[0] !== 0
            if (hasLength) pathDataOpt.push(com)
        } else {
            pathDataOpt.push(com)
        }
    })
    return pathDataOpt
}
*/

function removeZeroLengthLinetos(pathData) {

    let M = { x: pathData[0].values[0], y: pathData[0].values[1] };
    let p0 = M;
    let p = p0;

    let pathDataN = [pathData[0]];

    for (let c = 1, l = pathData.length; c < l; c++) {
        let com = pathData[c];
        let { type, values } = com;

        let valsLen = values.length;

        p = { x: values[valsLen-2], y: values[valsLen-1] };

        // skip lineto
        if (type === 'L' && p.x === p0.x && p.y === p0.y) {
            continue
        }

        // skip minified zero length
        if (type === 'l' || type === 'v' || type === 'h') {
            let noLength = type === 'l' ? (values.join('') === '00') : values[0] === 0;
            if(noLength) continue
        } 

        pathDataN.push(com);
        p0 = p;
    }

    return pathDataN

}

function pathDataToTopLeft(pathData) {

    let len = pathData.length;
    let isClosed = pathData[len - 1].type.toLowerCase() === 'z';

    // we can't change starting point for non closed paths
    if (!isClosed) {
        return pathData
    }

    let newIndex = 0;

    let indices = [];
    for (let i = 0; i < len; i++) {
        let com = pathData[i];
        let { type, values } = com;
        let valsLen = values.length;
        if (valsLen) {
            let p = { type: type, x: values[valsLen-2], y: values[valsLen-1], index: 0};
            p.index = i;
            indices.push(p);
        }
    }

    // reorder  to top left most

    indices = indices.sort((a, b) => +a.y.toFixed(3) - +b.y.toFixed(3) );
    newIndex = indices[0].index;

    return  newIndex ? shiftSvgStartingPoint(pathData, newIndex) : pathData;
}

function optimizeClosePath(pathData, removeFinalLineto = true, reorder = true) {

    let pathDataNew = [];
    let len = pathData.length;
    let M = { x: +pathData[0].values[0].toFixed(8), y: +pathData[0].values[1].toFixed(8) };
    let isClosed = pathData[len - 1].type.toLowerCase() === 'z';

    let linetos = pathData.filter(com => com.type === 'L');

    // check if order is ideal
    let penultimateCom = pathData[len - 2];
    let penultimateType = penultimateCom.type;
    let penultimateComCoords = penultimateCom.values.slice(-2).map(val => +val.toFixed(8));

    // last L command ends at M 
    let isClosingCommand = penultimateComCoords[0] === M.x && penultimateComCoords[1] === M.y;

    // if last segment is not closing or a lineto
    let skipReorder = pathData[1].type !== 'L' && (!isClosingCommand || penultimateType === 'L');
    skipReorder = false;

    // we can't change starting point for non closed paths
    if (!isClosed) {
        return pathData
    }

    let newIndex = 0;

    if (!skipReorder) {

        let indices = [];
        for (let i = 0, len = pathData.length; i < len; i++) {
            let com = pathData[i];
            let { type, values } = com;
            if (values.length) {
                let valsL = values.slice(-2);
                let prevL = pathData[i - 1] && pathData[i - 1].type === 'L';
                let nextL = pathData[i + 1] && pathData[i + 1].type === 'L';
                let prevCom = pathData[i - 1] ? pathData[i - 1].type.toUpperCase() : null;
                let nextCom = pathData[i + 1] ? pathData[i + 1].type.toUpperCase() : null;
                let p = { type: type, x: valsL[0], y: valsL[1], dist: 0, index: 0, prevL, nextL, prevCom, nextCom };
                p.index = i;
                indices.push(p);
            }
        }

        // find top most lineto

        if (linetos.length) {
            let curveAfterLine = indices.filter(com => (com.type !== 'L' && com.type !== 'M') && com.prevCom &&
                com.prevCom === 'L' || com.prevCom === 'M' && penultimateType === 'L').sort((a, b) => a.y - b.y || a.x - b.x)[0];

            newIndex = curveAfterLine ? curveAfterLine.index - 1 : 0;

        }
        // use top most command
        else {
            indices = indices.sort((a, b) => +a.y.toFixed(1) - +b.y.toFixed(1) || a.x - b.x);
            newIndex = indices[0].index;
        }

        // reorder 
        pathData = newIndex ? shiftSvgStartingPoint(pathData, newIndex) : pathData;
    }

    M = { x: +pathData[0].values[0].toFixed(8), y: +pathData[0].values[1].toFixed(7) };

    len = pathData.length;

    // remove last lineto
    penultimateCom = pathData[len - 2];
    penultimateType = penultimateCom.type;
    penultimateComCoords = penultimateCom.values.slice(-2).map(val=>+val.toFixed(8));

    isClosingCommand = penultimateType === 'L' && penultimateComCoords[0] === M.x && penultimateComCoords[1] === M.y;

    if (removeFinalLineto && isClosingCommand) {
        pathData.splice(len - 2, 1);
    }

    pathDataNew.push(...pathData);

    return pathDataNew
}

/**
 * shift starting point
 */
function shiftSvgStartingPoint(pathData, offset) {
    let pathDataL = pathData.length;
    let newStartIndex = 0;
    let lastCommand = pathData[pathDataL - 1]["type"];
    let isClosed = lastCommand.toLowerCase() === "z";

    if (!isClosed || offset < 1 || pathData.length < 3) {
        return pathData;
    }

    let trimRight = isClosed ? 1 : 0;

    // add explicit lineto
    addClosePathLineto(pathData);

    // M start offset
    newStartIndex =
        offset + 1 < pathData.length - 1
            ? offset + 1
            : pathData.length - 1 - trimRight;

    // slice array to reorder
    let pathDataStart = pathData.slice(newStartIndex);
    let pathDataEnd = pathData.slice(0, newStartIndex);

    // remove original M
    pathDataEnd.shift();
    let pathDataEndL = pathDataEnd.length;

    let pathDataEndLastValues, pathDataEndLastXY;
    pathDataEndLastValues = pathDataEnd[pathDataEndL - 1].values || [];
    pathDataEndLastXY = [
        pathDataEndLastValues[pathDataEndLastValues.length - 2],
        pathDataEndLastValues[pathDataEndLastValues.length - 1]
    ];

    if (trimRight) {
        pathDataStart.pop();
        pathDataEnd.push({
            type: "Z",
            values: []
        });
    }
    // prepend new M command and concatenate array chunks
    pathData = [
        {
            type: "M",
            values: pathDataEndLastXY
        },
        ...pathDataStart,
        ...pathDataEnd,
    ];

    return pathData;
}

/**
 * Add closing lineto:
 * needed for path reversing or adding points
 */

function addClosePathLineto(pathData) {
    let pathDataL = pathData.length;
    let closed = pathData[pathDataL - 1].type.toLowerCase() === "z" ? true : false;

    let M = pathData[0];
    let [x0, y0] = [M.values[0], M.values[1]].map(val => { return +val.toFixed(8) });
    let comLast = closed ? pathData[pathDataL - 2] : pathData[pathDataL - 1];
    let comLastL = comLast.values.length;

    // last explicit on-path coordinates
    let [xL, yL] = [comLast.values[comLastL - 2], comLast.values[comLastL - 1]].map(val => { return +val.toFixed(8) });

    if (closed && (x0 != xL || y0 != yL)) {

        pathData.pop();
        pathData.push(
            {
                type: "L",
                values: [x0, y0]
            },
            {
                type: "Z",
                values: []
            }
        );
    }

    return pathData;
}

/**
 * reverse pathdata
 * make sure all command coordinates are absolute and
 * shorthands are converted to long notation
 */
function reversePathData(pathData, {
    arcToCubic = false,
    quadraticToCubic = false,
    toClockwise = false,
    returnD = false
} = {}) {

    /**
     * Add closing lineto:
     * needed for path reversing or adding points
     */
    const addClosePathLineto = (pathData) => {
        let closed = pathData[pathData.length - 1].type.toLowerCase() === "z";
        let M = pathData[0];
        let [x0, y0] = [M.values[0], M.values[1]];
        let lastCom = closed ? pathData[pathData.length - 2] : pathData[pathData.length - 1];
        let [xE, yE] = [lastCom.values[lastCom.values.length - 2], lastCom.values[lastCom.values.length - 1]];

        if (closed && (x0 != xE || y0 != yE)) {

            pathData.pop();
            pathData.push(
                {
                    type: "L",
                    values: [x0, y0]
                },
                {
                    type: "Z",
                    values: []
                }
            );
        }
        return pathData;
    };

    // helper to rearrange control points for all command types
    const reverseControlPoints = (type, values) => {
        let controlPoints = [];
        let endPoints = [];
        if (type !== "A") {
            for (let p = 0; p < values.length; p += 2) {
                controlPoints.push([values[p], values[p + 1]]);
            }
            endPoints = controlPoints.pop();
            controlPoints.reverse();
        }
        // is arc
        else {

            let sweep = values[4] == 0 ? 1 : 0;
            controlPoints = [values[0], values[1], values[2], values[3], sweep];
            endPoints = [values[5], values[6]];
        }
        return { controlPoints, endPoints };
    };

    // start compiling new path data
    let pathDataNew = [];

    let closed =
        pathData[pathData.length - 1].type.toLowerCase() === "z" ? true : false;
    if (closed) {
        // add lineto closing space between Z and M
        pathData = addClosePathLineto(pathData);
        // remove Z closepath
        pathData.pop();
    }

    // define last point as new M if path isn't closed
    let valuesLast = pathData[pathData.length - 1].values;
    let valuesLastL = valuesLast.length;
    let M = closed
        ? pathData[0]
        : {
            type: "M",
            values: [valuesLast[valuesLastL - 2], valuesLast[valuesLastL - 1]]
        };
    // starting M stays the same – unless the path is not closed
    pathDataNew.push(M);

    // reverse path data command order for processing
    pathData.reverse();
    for (let i = 1; i < pathData.length; i++) {
        let com = pathData[i];
        let type = com.type;
        let values = com.values;
        let comPrev = pathData[i - 1];
        let typePrev = comPrev.type;
        let valuesPrev = comPrev.values;

        // get reversed control points and new end coordinates
        let controlPointsPrev = reverseControlPoints(typePrev, valuesPrev).controlPoints;
        let endPoints = reverseControlPoints(type, values).endPoints;

        // create new path data
        let newValues = [];
        newValues = [controlPointsPrev, endPoints].flat();
        pathDataNew.push({
            type: typePrev,
            values: newValues.flat()
        });
    }

    // add previously removed Z close path
    if (closed) {
        pathDataNew.push({
            type: "z",
            values: []
        });
    }

    return pathDataNew;
}

function refineAdjacentExtremes(pathData, {
    threshold = null, tolerance = 1
} = {}) {

    if (!threshold) {
        let bb = getPathDataBBox(pathData);
        threshold = (bb.width + bb.height) / 2 * 0.05;

    }

    let l = pathData.length;

    for (let i = 0; i < l; i++) {
        let com = pathData[i];
        let { type, values, extreme, corner=false, dimA, p0, p } = com;
        let comN = pathData[i + 1] ? pathData[i + 1] : null;

        // adjacent 

        if (comN && type === 'C' && comN.type === 'C' && extreme && !corner) {

            // check dist
            let diff = getDistAv(p, comN.p);
            let isCose = diff < threshold;

            if (isCose) {

                let dx1 = (com.cp1.x - comN.p0.x);
                let dy1 = (com.cp1.y - comN.p0.y);

                let horizontal = Math.abs(dy1) < Math.abs(dx1);

                let pN = comN.p;
                let ptI;
                let t = 1;

                if (comN.extreme) {

                    // extend cp2
                    if (horizontal) {
                        t = Math.abs(Math.abs(comN.cp2.x - comN.p.x) / Math.abs(com.cp2.x - com.p.x));

                        ptI = interpolate(comN.p, com.cp2, 1 + t);
                        com.cp2.x = ptI.x;

                    }
                    else {

                        t = Math.abs(Math.abs(comN.cp2.y - comN.p.y) / Math.abs(com.cp2.y - com.p.y));
                        ptI = interpolate(comN.p, com.cp2, 1 + t);
                        com.cp2.y = ptI.y;
                    }

                    pathData[i + 1].values = [com.cp1.x, com.cp1.y, com.cp2.x, com.cp2.y, pN.x, pN.y];
                    pathData[i + 1].cp1 = com.cp1;
                    pathData[i + 1].cp2 = com.cp2;
                    pathData[i + 1].p0 = com.p0;
                    pathData[i + 1].p = pN;
                    pathData[i + 1].extreme = true;

                    // nullify 1st
                    pathData[i] = null;
                    continue

                }

                // extend fist command
                else {

                    let comN2 = pathData[i + 2] ? pathData[i + 2] : null;
                    if (!comN2 && comN2.type !== 'C') continue

                    // extrapolate
                    let comEx = getCombinedByDominant(comN, comN2, threshold, tolerance, false);

                    if (comEx.length === 1) {
                        pathData[i + 1] = null;

                        comEx = comEx[0];

                        pathData[i + 2].values = [comEx.cp1.x, comEx.cp1.y, comEx.cp2.x, comEx.cp2.y, comEx.p.x, comEx.p.y];
                        pathData[i + 2].cp1 = comEx.cp1;
                        pathData[i + 2].cp2 = comEx.cp2;
                        pathData[i + 2].p0 = comEx.p0;
                        pathData[i + 2].p = comEx.p;
                        pathData[i + 2].extreme = comEx.extreme;

                        i++;
                        continue
                    }

                }

            }
        }
    }

    // remove commands
    pathData = pathData.filter(Boolean);
    l = pathData.length;

    /**
     * refine closing commands
     */

    let closed = pathData[l - 1].type.toLowerCase() === 'z';
    let lastIdx = closed ? l - 2 : l - 1;
    let lastCom = pathData[lastIdx];
    let penultimateCom = pathData[lastIdx - 1] || null;
    let M = { x: pathData[0].values[0], y: pathData[0].values[1] };

    let dec = 8;
    let lastVals = lastCom.values.slice(-2);
    let isClosingTo = +lastVals[0].toFixed(dec) === +M.x.toFixed(dec) && +lastVals[1].toFixed(dec) === +M.y.toFixed(dec);
    let fistExt = pathData[1].type === 'C' && pathData[1].extreme ? pathData[1] : null;

    let diff = getDistAv(lastCom.p0, lastCom.p);
    let isCose = diff < threshold;

    if (penultimateCom && penultimateCom.type === 'C' && isCose && isClosingTo && fistExt) {

        Math.abs(fistExt.cp1.x - M.x);
        Math.abs(fistExt.cp1.y - M.y);

        let comEx = getCombinedByDominant(penultimateCom, lastCom, threshold, tolerance, false);
        console.log('comEx', comEx);

        if (comEx.length === 1) {
            pathData[lastIdx - 1] = comEx[0];
            pathData[lastIdx] = null;
            pathData = pathData.filter(Boolean);
        }

    }

    return pathData

}

function removeEmptySVGEls(svg) {
  let els = svg.querySelectorAll('g, defs');
  els.forEach(el => {
      if (!el.children.length) el.remove();
  });
}

function cleanUpSVG(svgMarkup, {
  returnDom=false, 
  removeHidden=true,
  removeUnused=true,
}={}) {
  svgMarkup = cleanSvgPrologue(svgMarkup);
  
  // replace namespaced refs 
  svgMarkup = svgMarkup.replaceAll("xlink:href=", "href=");
  
  let svg = new DOMParser()
    .parseFromString(svgMarkup, "text/html")
    .querySelector("svg");
  
  
  let allowed=['viewBox', 'xmlns', 'width', 'height', 'id', 'class', 'fill', 'stroke', 'stroke-width'];
  removeExcludedAttribues(svg, allowed);
  
  let removeEls = ['metadata', 'script'];
  
  let els = svg.querySelectorAll('*');
  els.forEach(el=>{
    let name = el.nodeName;    
    // remove hidden elements
    let style = el.getAttribute('style') || '';
    let isHiddenByStyle = style ? style.trim().includes('display:none') : false;
    let isHidden = (el.getAttribute('display') && el.getAttribute('display') === 'none') || isHiddenByStyle;
    if(name.includes(':') || removeEls.includes(name) || (removeHidden && isHidden )) {
      el.remove();
    }else {
      // remove BS elements
      removeNameSpaceAtts(el);
    }
  });

  if(returnDom) return svg

  let markup = stringifySVG(svg);
  console.log(markup);

  return markup;
}

function cleanSvgPrologue(svgString) {
  return (
    svgString
      // Remove XML prologues like <?xml ... ?>
      .replace(/<\?xml[\s\S]*?\?>/gi, "")
      // Remove DOCTYPE declarations
      .replace(/<!DOCTYPE[\s\S]*?>/gi, "")
      // Remove comments <!-- ... -->
      .replace(/<!--[\s\S]*?-->/g, "")
      // Trim extra whitespace
      .trim()
  );
}

function removeExcludedAttribues(el, allowed=['viewBox', 'xmlns', 'width', 'height', 'id', 'class']){
  let atts = [...el.attributes].map((att) => att.name);
  atts.forEach((att) => {
    if (!allowed.includes(att)) {
      el.removeAttribute(att);
    }
  });
}

function removeNameSpaceAtts(el) {
  let atts = [...el.attributes].map((att) => att.name);
  atts.forEach((att) => {
    if (att.includes(":")) {
      el.removeAttribute(att);
    }
  });
}

function stringifySVG(svg){
    let markup = new XMLSerializer().serializeToString(svg);
  markup = markup
  .replace(/\t/g, "")
  .replace(/[\n\r|]/g, "\n")
  .replace(/\n\s*\n/g, '\n')
  .replace(/ +/g, ' ');

  return markup
}

function svgPathSimplify(input = '', {

    // return svg markup or object
    getObject = false,

    toAbsolute = true,
    toRelative = true,
    toShorthands = true,

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

    let paths = [];

    /**
     * normalize input
     * switch mode
     */

    // original size
    svgSize = new Blob([input]).size;

    // single path
    if (!mode) {
        if (inputType === 'pathDataString') {
            d = input;
        } else if (inputType === 'polyString') {
            d = 'M' + input;
        }
        paths.push({ d, el: null });
    }
    // process svg
    else {

        let returnDom = true;
        svg = cleanUpSVG(input, { returnDom, removeHidden, removeUnused }
        );

        if(shapesToPaths){
            let shapes = svg.querySelectorAll('polygon, polyline, line, rect, circle, ellipse');
            shapes.forEach(shape=>{
                let path = shapeElToPath(shape);
                shape.replaceWith(path);
            });
        }

        // collect paths
        let pathEls = svg.querySelectorAll('path');
        pathEls.forEach(path => {
            paths.push({ d: path.getAttribute('d'), el: path });
        });
    }

    /**
     * process all paths
     */

    // SVG optimization options
    let pathOptions = {
        toRelative,
        toShorthands,
        decimals,
    };

    // combinded path data for SVGs with mergePaths enabled
    let pathData_merged = [];

    paths.forEach(path => {
        let { d, el } = path;

        let pathDataO = parsePathDataNormalized(d, { quadraticToCubic, toAbsolute, arcToCubic });

        // count commands for evaluation
        let comCount = pathDataO.length;

        // create clone for fallback

        let pathData = pathDataO;

        if(removeOrphanSubpaths) pathData = removeOrphanedM(pathData);

        /**
         * get sub paths
         */
        let subPathArr = splitSubpaths(pathData);

        // cleaned up pathData
        let pathDataArrN = [];

        for (let i = 0, l = subPathArr.length; i < l; i++) {

            let pathDataSub = subPathArr[i];

            // try simplification in reversed order
            if (reverse) pathDataSub = reversePathData(pathDataSub);

            // remove zero length linetos
            if (removeColinear) pathDataSub = removeZeroLengthLinetos(pathDataSub);

            // add extremes

            let tMin = 0, tMax = 1;
            if (addExtremes) pathDataSub = addExtremePoints(pathDataSub, tMin, tMax);

            // sort to top left
            if (optimizeOrder) pathDataSub = pathDataToTopLeft(pathDataSub);

            // remove colinear/flat
            if (removeColinear) pathDataSub = pathDataRemoveColinear(pathDataSub, tolerance, flatBezierToLinetos);

            // analyze pathdata to add info about signicant properties such as extremes, corners
            let pathDataPlus = analyzePathData(pathDataSub);

            // simplify beziers
            let { pathData, bb, dimA } = pathDataPlus;

            pathData = simplifyBezier ? simplifyPathDataCubic(pathData, { simplifyBezier, keepInflections, keepExtremes, keepCorners, extrapolateDominant, revertToQuadratics, tolerance, reverse }) : pathData;

            // refine extremes
            if(refineExtremes){
                let thresholdEx = (bb.width + bb.height) / 2 * 0.05;
                pathData = refineAdjacentExtremes(pathData, {threshold:thresholdEx, tolerance});
            }

            // cubic to arcs
            if (cubicToArc) {

                let thresh = 3;

                pathData.forEach((com, c) => {
                    let { type, values, p0, cp1 = null, cp2 = null, p = null } = com;
                    if (type === 'C') {

                        let comA = cubicCommandToArc(p0, cp1, cp2, p, thresh);
                        if (comA.isArc) pathData[c] = comA.com;

                    }
                });

                // combine adjacent cubics
                pathData = combineArcs(pathData);

            }

            // simplify to quadratics
            if (revertToQuadratics) {
                pathData.forEach((com, c) => {
                    let { type, values, p0, cp1 = null, cp2 = null, p = null } = com;
                    if (type === 'C') {

                        let comQ = revertCubicQuadratic(p0, cp1, cp2, p);
                        if (comQ.type === 'Q') {
                            /*
                            comQ.p0 = com.p0
                            comQ.cp1 = {x:comQ.values[0], y:comQ.values[1]}
                            comQ.p = com.p
                            */
                            comQ.extreme = com.extreme;
                            comQ.corner = com.corner;
                            comQ.dimA = com.dimA;

                            pathData[c] = comQ;
                        }
                    }
                });
            }

            // optimize close path
            if (optimizeOrder) pathData = optimizeClosePath(pathData);

            // poly

            // update
            pathDataArrN.push(pathData);
        }

        // flatten compound paths 
        pathData = pathDataArrN.flat();

        // collect for merged svg paths 
        if (el && mergePaths) {
            pathData_merged.push(...pathData);
        }
        // single output
        else {

            /**
             * detect accuracy
             */
            if (autoAccuracy) {
                decimals = detectAccuracy(pathData);
                pathOptions.decimals = decimals;

            }

            // optimize path data
            pathData = convertPathData(pathData, pathOptions);

            // remove zero-length segments introduced by rounding
            pathData = removeZeroLengthLinetos(pathData);

            // compare command count
            let comCountS = pathData.length;

            let dOpt = pathDataToD(pathData, minifyD);
            svgSizeOpt = new Blob([dOpt]).size;
            compression = +(100 / svgSize * (svgSizeOpt)).toFixed(2);

            path.d = dOpt;
            path.report = {
                original: comCount,
                new: comCountS,
                saved: comCount - comCountS,
                compression,
                decimals,

            };

            // apply new path for svgs
            if (el) el.setAttribute('d', dOpt);
        }
    });

    /**
     *  stringify new SVG
     */
    if (mode) {

        if (pathData_merged.length) {
            // optimize path data
            let pathData = convertPathData(pathData_merged, pathOptions);

            // remove zero-length segments introduced by rounding

            pathData = removeZeroLengthLinetos(pathData);

            let dOpt = pathDataToD(pathData, minifyD);

            // apply new path for svgs
            paths[0].el.setAttribute('d', dOpt);

            // remove other paths
            for (let i = 1; i < paths.length; i++) {
                let pathEl = paths[i].el;
                if (pathEl) pathEl.remove();
            }

            // remove empty groups e.g groups
            removeEmptySVGEls(svg);
        }

        svg = stringifySVG(svg);
        svgSizeOpt = new Blob([svg]).size;

        compression = +(100 / svgSize * (svgSizeOpt)).toFixed(2);

        svgSize = +(svgSize / 1024).toFixed(3);
        svgSizeOpt = +(svgSizeOpt / 1024).toFixed(3);

        report = {
            svgSize,
            svgSizeOpt,
            compression
        };

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

        let isDirChange = com?.directionChange || null;
        let isDirChangeN = comN?.directionChange || null;

        let { type, values, p0, p, cp1 = null, cp2 = null, extreme = false, corner = false, dimA = 0 } = com;

        // next is also cubic
        if (type === 'C' && typeN === 'C') {

            // cannot be combined as crossing extremes or corners
            if (
                (keepInflections && isDirChangeN) ||
                (keepCorners && corner) ||
                (!isDirChange && keepExtremes && extreme)
            ) {

                pathDataN.push(com);
            }

            // try simplification
            else {

                let combined = combineCubicPairs(com, comN, extrapolateDominant, tolerance);
                let error = 0;

                // combining successful! try next segment
                if (combined.length === 1) {
                    com = combined[0];
                    let offset = 1;

                    // add cumulative error to prevent distortions
                    error += com.error;

                    // find next candidates
                    for (let n = i + 1; error < tolerance && n < l; n++) {
                        let comN = pathData[n];
                        if (comN.type !== 'C' ||
                            (
                                (keepInflections && comN.directionChange) ||
                                (keepCorners && com.corner) ||
                                (keepExtremes && com.extreme)
                            )
                        ) {
                            break
                        }

                        let combined = combineCubicPairs(com, comN, extrapolateDominant, tolerance);
                        if (combined.length === 1) {
                            // add cumulative error to prevent distortions

                            error += combined[0].error * 0.5;

                            offset++;
                        }
                        com = combined[0];
                    }

                    pathDataN.push(com);

                    if (i < l) {
                        i += offset;
                    }

                } else {
                    pathDataN.push(com);
                }
            }

        } // end of bezier command

        // other commands
        else {
            pathDataN.push(com);
        }

    } // end command loop

    // reverse back
    if (reverse) pathDataN = reversePathData(pathDataN);

    return pathDataN
}

const {
    abs, acos, asin, atan, atan2, ceil, cos, exp, floor,
    log, hypot, max, min, pow, random, round, sin, sqrt, tan, PI
} = Math;

/*
import {XMLSerializerPoly, DOMParserPoly} from './dom_polyfills';
export {XMLSerializerPoly as XMLSerializerPoly};
export {DOMParserPoly as DOMParserPoly};
*/

// IIFE 
if (typeof window !== 'undefined') {
    window.svgPathSimplify = svgPathSimplify;

}

export { PI, abs, acos, asin, atan, atan2, ceil, cos, exp, floor, hypot, log, max, min, pow, random, round, sin, sqrt, svgPathSimplify, tan };
