import { getDistAv, pointAtT } from "./geometry";
import { getPolyBBox } from "./geometry_bbox";
import { addDimensionData, analyzePathData } from "./pathData_analyze";
import { addExtremePoints } from "./pathData_split";
import { pathDataToD } from "./pathData_stringify";
import { analyzePoly } from "./poly_analyze";
import { getCurvePathData } from "./poly_to_pathdata";
import { renderPoint } from "./visualize";


export function pathDataToPolySingle(pathData, addExtremes = true) {


    let dimMin = Infinity;
    let dimMax = 0;


    /**
     * add extremes to beziers
     * to reproduce the shape better
     */
    if (addExtremes) {
        pathData = addExtremePoints(pathData, 0.1, 0.9)
    }

    //console.log(pathData);

    let pathDataPlus = analyzePathData(pathData);
    let { bb } = pathDataPlus;
    let thresh = (bb.width + bb.height) / 2 / 50

    pathData = pathDataPlus.pathData


    /**
     * approximate min and max segment sizes
     * for segment splitting
     */
    let dimArr = pathData.filter(com => com.dimA).sort((a, b) => a.dimA - b.DimA)
    let dimMinL = dimArr[0].dimA
    let dimMaxL = dimArr[dimArr.length - 1].dimA
    //console.log('dimArr', dimArr, dimMaxL);
    if (dimMinL && dimMinL < dimMin) dimMin = dimMinL;
    if (dimMaxL && dimMaxL > dimMax) dimMax = dimMaxL;

    //console.log(dimMin, dimMax);

    // find split point based on smallest point distance
    dimMin = (dimMin * 2 + dimMax) / 2 / 4
    //dimMin = (bb.width + bb.height) / 2 / 8

    // collect vertices
    let polyArr = [];

    let p0 = { x: pathData[0].p0.x, y: pathData[0].p0.y, extreme: pathData[0].extreme, corner: pathData[0].corner }
    let poly = [p0];

    for (let i = 1, l = pathData.length; i < l; i++) {

        let com = pathData[i];
        let { type, values, extreme = false, corner = false, dimA = null, p0, p, cp1 = null, cp2 = null } = com;

        dimA = getDistAv(p0, p);


        if(extreme){
            //renderPoint(markers, p, 'cyan')
        }

        let split = (type === 'C' || type === 'Q') && dimA ? Math.ceil(dimA / dimMin) : 0;


        //console.log(com);
        p.extreme = extreme
        p.corner = corner

        //console.log(p);

        if ((type === 'C' || type === 'Q') && split) {
            let splitT = 1 / split;
            for (let i = 1; i < split; i++) {
                let t = splitT * i;
                let cpts = type === 'C' ? [cp1, cp2] : [cp1];
                let ptI = pointAtT([p0, ...cpts, p], t)
                poly.push(ptI)
            }
        }
        poly.push(p)

    }


    // remove short
    let remove = new Set([])
    for (let i = 1, l = poly.length; i < l; i++) {
        let p = poly[i - 1]
        let pN = poly[i]

        let dist1 = getDistAv(p, pN)
        if (dist1 < thresh && pN.extreme) {
            let pR = p.extreme ? pN : p
            let idx = p.extreme ? i : i - 1
            //console.log('remove', idx);
            remove.add(idx)
        } 
    }


    remove = Array.from(remove).reverse();
    //console.log(remove);

    for (let i = 0; i < remove.length; i++) {
        let idx = remove[i];
        //console.log('idx', idx);
        poly.splice(idx, 1)
    }

    poly.splice(poly.length-1, poly.length)


    let polyAtt = poly.map(pt => `${pt.x} ${pt.y} `).join(' ')
    //console.log('polyAtt', polyAtt);

    //markers.insertAdjacentHTML('beforeend', `<polygon points="${polyAtt}" stroke="red" fill="none"/>`)


    poly = analyzePoly(poly, false)
    let pathDataP = getCurvePathData(poly, 0.666, true)
    let d = pathDataToD(pathDataP)

    console.log(d);
    //markers.insertAdjacentHTML('beforeend', `<path d="${d}" stroke="green" fill="none" stroke-width="1%"/>`)





    return poly

}



