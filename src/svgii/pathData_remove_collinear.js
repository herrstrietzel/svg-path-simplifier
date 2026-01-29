import { checkBezierFlatness, getDistAv, getSquareDistance } from "./geometry.js";
import { getPolygonArea } from "./geometry_area.js";
import { renderPoint } from "./visualize.js";

export function pathDataRemoveColinear(pathData, tolerance = 1, flatBezierToLinetos = true) {

    let pathDataN = [pathData[0]];


    let lastType = 'L';
    let M = { x: pathData[0].values[0], y: pathData[0].values[1] }
    let p0 = M;
    let p = M
    let isClosed = pathData[pathData.length - 1].type.toLowerCase() === 'z'

    for (let c = 1, l = pathData.length; c < l; c++) {
        let comPrev = pathData[c - 1];
        let com = pathData[c];
        let comN = pathData[c + 1] || pathData[l - 1];
        let p1 = comN.type.toLowerCase() === 'z' ? M : { x: comN.values[comN.values.length - 2], y: comN.values[comN.values.length - 1] }

        let { type, values } = com;
        let valsL = values.slice(-2)
        p = type !== 'Z' ? { x: valsL[0], y: valsL[1] } : M;

        let area = getPolygonArea([p0, p, p1], true)

        let distSquare = getSquareDistance(p0, p1)
        let distMax = distSquare / 100 * tolerance

        let isFlat = area < distMax;
        let isFlatBez = false;


        if (!flatBezierToLinetos && type === 'C') isFlat = false;
        //let isFlat = flatBezierToLinetos && type === 'C' ? area < distMax : false

        // convert flat beziers to linetos
        if (flatBezierToLinetos && (type === 'C' || type === 'Q')) {

            let cpts = type === 'C' ?
            [{ x: values[0], y: values[1] }, { x: values[2], y: values[3] }] :
            (type === 'Q' ? [{ x: values[0], y: values[1] }] : []);


            //let areaBez = getPolygonArea([p0, ...cpts, p], true)

            isFlatBez = checkBezierFlatness(p0, cpts, p)
           // console.log();

            //isFlatBez = areaBez < distMax * 0.25
            //console.log('isFlatBez', isFlatBez);
            //isFlatBez = false

            //&& comPrev.type !== 'C'
            if (isFlatBez  && c < l - 1 && comPrev.type !== 'C') {
                type = "L"
                com.type = "L"
                com.values = valsL

                //renderPoint(markers, p)
            }

        }

        // update end point
        p0 = p;

        // colinear – exclude arcs (as always =) as semicircles won't have an area
        if ( isFlat && c < l - 1 && (type === 'L' || (flatBezierToLinetos && isFlatBez))) {
            //console.log(area,distMax );
            continue;
        }


        if (type === 'M') {
            M = p
            p0 = M
        }

        else if (type === 'Z') {
            p0 = M;
        }

        // proceed and add command
        pathDataN.push(com)

    }

    // add close path
    if (isClosed) {
        //pathDataN.push({ type: 'Z', values: [] })
    }
    //console.log('pathDataN', pathDataN);

    return pathDataN;

}