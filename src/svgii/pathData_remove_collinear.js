import { getSquareDistance } from "./geometry.js";
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
        let p1 = comN.type === 'Z' ? M : { x: comN.values[comN.values.length - 2], y: comN.values[comN.values.length - 1] }

        let { type, values } = com;
        let valsL = values.slice(-2)
        p = type !== 'Z' ? { x: valsL[0], y: valsL[1] } : M;

        let cpts = type === 'C' ?
            [{ x: values[0], y: values[1] }, { x: values[2], y: values[3] }] :
            (type === 'Q' ? [{ x: values[0], y: values[1] }] : []);


        let area = getPolygonArea([p0, ...cpts, p, p1], true)
        let distSquare = getSquareDistance(p0, p)
        let distMax = distSquare / 500 * tolerance

        let isFlat = area < distMax 
        
        if(!flatBezierToLinetos && type==='C') isFlat = false;
        //let isFlat = flatBezierToLinetos && type === 'C' ? area < distMax : false


        // convert flat beziers to linetos
        if (flatBezierToLinetos && type === 'C') {

            let areaBez = getPolygonArea([p0, ...cpts, p], true)
            let isFlatBez = areaBez < distSquare / 1000

            if (isFlatBez && comPrev.type !== 'C') {
                com.type = "L"
                com.values = valsL
            }

        }


        // update end point
        p0 = p;

        // colinear – exclude arcs (as always =) as semicircles won't have an area
        if (type !== 'A' && isFlat && c < l - 1) {
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