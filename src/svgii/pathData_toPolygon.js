import { pointAtT } from "./geometry";
import { getPolyBBox } from "./geometry_bbox";
import { addDimensionData, analyzePathData } from "./pathData_analyze";
import { addExtremePoints } from "./pathData_split";

export function pathDataToPolyPlus(pathDataArr = [], addExtremes=true) {

    // check if splitting sub paths is required
    pathDataArr = Object.hasOwnProperty(pathDataArr[0].type) ? splitSubpaths(pathDataArr) : pathDataArr;

    let dimMin = Infinity;
    let dimMax = 0;


    /**
     * add extremes to beziers
     * to reproduce the shape better
     */
    if(addExtremes){
        pathDataArr.forEach((pathData, i) => {
    
            //pathDataArr[i] = addExtremePoints(pathData)
            let pathDataE = addExtremePoints(pathData)
            
            //pathDataArr[i] = analyzePathData(pathDataE).pathData
            pathDataArr[i] = addDimensionData(pathDataE)
    
        })
    }


    /**
     * approximate min and max segment sizes
     * for segment splitting
     */
    pathDataArr.forEach(pathData => {

        let dimArr = pathData.filter(com => com.dimA).sort((a, b) => a.dimA - b.DimA)
        let dimMinL = dimArr[0].dimA
        let dimMaxL = dimArr[dimArr.length - 1].dimA
        //console.log('dimArr', dimArr, dimMaxL);
        if (dimMinL && dimMinL < dimMin) dimMin = dimMinL;
        if (dimMaxL && dimMaxL > dimMax) dimMax = dimMaxL;

    })

    //console.log(dimMin, dimMax);

    // find split point based on smallest point distance
    dimMin = (dimMin * 2 + dimMax) / 2 * 0.5

    // collect vertices
    let polyArr = [];


    pathDataArr.forEach(pathData => {

        let poly = [pathData[0].p0];

        pathData.forEach(com => {

            let { type, values, dimA = null, p0, p, cp1 = null, cp2 = null } = com;
            let split = type === 'C' && dimA ? Math.ceil(dimA / dimMin) : 0;

            if (type === 'C' && split) {

                let splitT = 1 / split;

                for (let i = 1; i < split; i++) {

                    let t = splitT * i;
                    let ptI = pointAtT([p0, cp1, cp2, p], t)
                    poly.push(ptI)
                }

            }
            poly.push(p)
        })

        polyArr.push(poly)

        /*
        let bb = getPolyBBox(poly);
        let dimAv = (bb.width+bb.height)/2
        console.log('dimAv', dimAv);
        */

    })

    return polyArr

}
