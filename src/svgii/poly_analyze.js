import { checkLineIntersection, getAngle, getPointOnEllipse, getSquareDistance, pointAtT, reducePoints } from "./geometry";
import { getPolygonArea } from "./geometry_area";
import { getPolyBBox } from "./geometry_bbox";
import { renderPoint } from "./visualize";

export function analyzePoly(pts, debug=false) {

    let l = pts.length;
    let polyArea = getPolygonArea(pts, true)
    //console.log(polyArea);


    // get areas 
    for (let i = 0; i < l; i++) {
        let pt0 = i > 0 ? pts[i - 1] : pts[l - 1];
        let pt1 = pts[i];
        let pt2 = i < l - 1 ? pts[i + 1] : pts[0];

        let area = getPolygonArea([pt0, pt1, pt2], false);
        let ang1 = getAngle(pt1, pt0, true);
        let ang2 = getAngle(pt1, pt2, true);
        let delta = Math.abs(ang1 - ang2);
        let deltaDeg = delta * 180 / Math.PI;



        /**
         * get local extremes
         * my coincide with corners or
         * direction changes
         */
        let { left, right, top, bottom } = getPolyBBox([pt0, pt2]);
        let isExtreme = (pt1.x < left || pt1.x > right || pt1.y < top || pt1.y > bottom);


        /**
         * check corners by  
         * adjacent angle differences
         */
        let isCorner = deltaDeg < 120 || deltaDeg > 270;


        /**
         * get direction changes
         * e.g the spine of a "S" shape
         */
        let directionChange = pt0.isCorner === false && ((pt0.area < 0 && area > 0) || (pt0.area > 0 && area < 0));



        if (pt0.isExtreme &&
            (pt1.y === pt0.y || pt1.x === pt0.x)
        ) {
            isExtreme = true;
        }


        if (directionChange && isExtreme) {
            isCorner = true;
        }

        // if segment is too large relative to total area - don't interpret as corner
        let areaRat = Math.abs(area / polyArea);

        if (areaRat > 0.2) {
            isCorner = false;
        }


        /**
         * visualize significant points for 
         * debugging
         */

        /*
        */

        if(debug){

            if ((isExtreme && isCorner)) {
                isExtreme = false;
                directionChange = false;
                //isCorner = false;
            }
    
            if (isExtreme) {
                renderPoint(markers, pt1, 'cyan', '1%');
            }
    
            if (isCorner) {
                renderPoint(markers, pt1, 'purple', '0.5%');
            }
    
            if (directionChange) {
                renderPoint(markers, pt1, 'orange', '1.5%', '0.5');
            }

        }


        /**
         * save point analysis properties 
         * to point objects
         */
        pt1.isExtreme = isExtreme;
        pt1.isCorner = isCorner;
        pt1.directionChange = directionChange;

        pt1.area = area;
        pt1.delta = delta;
        pt1.deltaDeg = deltaDeg;

    }


    //getControlPoints(pts)


    return pts
}








export function getPathDataChunks(pathData) {

    let chunks = [[]];
    let lastType = 'M'
    let ind = 0;
    let wasExtreme, wasCorner, wasDirectionchange;

    pathData.forEach(com => {

        let { isCorner, isExtreme, directionChange, type } = com;

        if (type !== lastType || wasExtreme || wasCorner || directionChange || wasDirectionchange) {
            chunks.push([])
            ind++
        }
        chunks[ind].push(com)

        wasExtreme = isExtreme
        wasCorner = isCorner
        wasDirectionchange = directionChange;
        lastType = type
    })


    return chunks;

}




/**
 * check whether a polygon is likely 
 * to be closed 
 * or an open polyline 
 */
export function isClosedPolygon(pts, reduce = 24) {

    let ptsR = reducePoints(pts, reduce);
    let { width, height } = getPolyBBox(ptsR);
    //let dimAvg = Math.max(width, height);
    let dimAvg = (width + height) / 2;
    //let closingThresh = (dimAvg / pts.length) ** 2
    let closingThresh = (dimAvg) ** 2
    let closingDist = getSquareDistance(pts[0], pts[pts.length - 1]);

    return closingDist < closingThresh;
}