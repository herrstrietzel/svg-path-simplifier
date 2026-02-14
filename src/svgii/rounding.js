
/**
 * detect suitable floating point accuracy
 * for further rounding/optimizations
 */

import { getDistAv, getDistManhattan } from "./geometry";


export function detectAccuracy(pathData) {

    let minDim = Infinity
    let dims = [];
    //console.log(pathData);

    // add average distances
    for (let i = 1, len = pathData.length; i < len; i++) {
        let com = pathData[i];
        let { type, values, p0=null, p=null, dimA=0 } = com;

        // use existing averave dimension value or calculate
        if(values.length && p && p0){
            //console.log(com);
            dimA = dimA ? dimA : getDistManhattan(p0, p);
    
            //let dimA = +getDistAv(p0, p).toFixed(8)
            //console.log('dimA', dimA, com.dimA, type);
    
            if (dimA) dims.push(dimA);
            if (dimA && dimA < minDim) minDim = dimA;
            //if (dimA && dimA > maxDim) maxDim = dimA;
        }

    }

    let dim_min = dims.sort()        
    let sliceIdx = Math.ceil(dim_min.length / 8);
    dim_min = dim_min.slice(0, sliceIdx);
    let minVal = dim_min.reduce((a, b) => a + b, 0) / sliceIdx;

    let threshold = 50
    let decimalsAuto = minVal > threshold*1.5 ? 0 : Math.floor(threshold / minVal).toString().length

    // clamp
    return Math.min(Math.max(0, decimalsAuto), 8)

}




/**
 * round path data
 * either by explicit decimal value or
 * based on suggested accuracy in path data
 */
export function roundPathData(pathData, decimals = -1) {

    if(decimals < 0 ) return pathData;

    let len = pathData.length;

    for (let c = 0; c < len; c++) {
        //let com = pathData[c];
        let values = pathData[c].values
        let valLen = values.length;

        if (valLen) {
            for(let v=0; v<valLen; v++){
                pathData[c].values[v] =  +values[v].toFixed(decimals);
            }
        }
    };

    //console.log(pathData);
    return pathData;
}
