import { getDistAv, getSquareDistance } from "./geometry.js";
import { getPolygonArea } from "./geometry_area.js";
import { checkBezierFlatness, commandIsFlat } from "./geometry_flatness.js";
import { renderPoint } from "./visualize.js";

export function pathDataRemoveColinear(pathData, {
    tolerance = 1, 
    //toleranceCubics = null,
    flatBezierToLinetos = true
}={}) {

    //toleranceCubics = !toleranceCubics ? tolerance : toleranceCubics;
    let pathDataN = [pathData[0]];

    let M = { x: pathData[0].values[0], y: pathData[0].values[1] }
    let p0 = M;
    let p = M
    let isClosed = pathData[pathData.length - 1].type.toLowerCase() === 'z'

    for (let c = 1, l = pathData.length; c < l; c++) {
        //let comPrev = pathData[c - 1];
        let com = pathData[c];
        let comN = pathData[c + 1] || pathData[l - 1];
        let p1 = comN.type.toLowerCase() === 'z' ? M : { x: comN.values[comN.values.length - 2], y: comN.values[comN.values.length - 1] }

        let { type, values } = com;
        let valsL = values.slice(-2)
        p = type !== 'Z' ? { x: valsL[0], y: valsL[1] } : M;

        let area = getPolygonArea([p0, p, p1], true)

        //let distSquare0 = getSquareDistance(p0, p)
        //let distSquare1 = getSquareDistance(p, p1)
        let distSquare = getSquareDistance(p0, p1)

        let distMax = distSquare / 1000 * tolerance

        let isFlat = area < distMax;
        let isFlatBez = false;


        if (!flatBezierToLinetos && type === 'C') isFlat = false;

        // convert flat beziers to linetos
        if (flatBezierToLinetos && (type === 'C' || type === 'Q')) {

            let cpts = type === 'C' ?
            [{ x: values[0], y: values[1] }, { x: values[2], y: values[3] }] :
            (type === 'Q' ? [{ x: values[0], y: values[1] }] : []);

            isFlatBez = commandIsFlat([p0, ...cpts, p],{tolerance});

            if (isFlatBez  && c < l - 1  ) {
                type = "L"
                com.type = "L"
                com.values = valsL
                //renderPoint(markers, p, 'cyan', '1%', '0.5')
            }
        }

        // update end point
        p0 = p;

        // colinear – exclude arcs (as always =) as semicircles won't have an area
        //&& comN.type==='L'
        if ( isFlat && c < l - 1 && (type === 'L' || (flatBezierToLinetos && isFlatBez)) ) {
            //console.log(area,distMax );
            //if(comN.type!=='L' ){}

            //renderPoint(markers, p, 'orange', '1%', '0.5')
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