import { checkLineIntersection, pointAtT } from "./geometry";
import { pathDataToD } from "./pathData_stringify";
import { renderPath, renderPoint } from "./visualize";

export function redrawPathData(pathData, {
    tolerance = 1

} = {}) {

    let pathDataN = [];
    let chunks = [];
    let chunk = [];
    let idx = 0;


    let l = pathData.length;
    return pathData

    //console.log(pathData);

    for (let i = 1; i < l; i++) {
        let com = pathData[i];
        let { type, values, p0, cp1 = null, cp2 = null, p, extreme = null, semiExtreme = null, corner = null, directionChange } = com;

        let comN = pathData[i + 1] || null;

        if (extreme || corner || semiExtreme || directionChange) {

            if (extreme) renderPoint(markers, com.p, 'cyan', '1%', '0.5')
            if(directionChange) renderPoint(markers, com.p, 'blue', '1.75%', '0.5')
            /*
            if (semiExtreme) renderPoint(markers, com.p, 'orange', '1%', '0.5')
            if (corner) renderPoint(markers, com.p, 'magenta', '1.75%', '0.5')
        */

        }

        //start new chunk
        if (extreme || corner) {
            chunk.push(com)
            if (chunk.length > 1) {
            }

            chunks.push(chunk)
            chunk = []
            continue
        }

        chunk.push(com)

    }

    console.log('chunks', chunks);

    /*
    for (let c = 0; c < chunks.length; c++) {
        let chunk = chunks[c]

        let len = chunk.length
        let semi = chunk.filter(ch=>ch.semiExtreme);

        if(semi.length){
            //console.log(semi);
            let chunknew = [semi[0], chunk[chunk.length-1]]
            chunks[c] = chunknew
            //chunks[c+1] = chunk[chunk.length-1]
            continue
        }

        let dirChange = chunk.filter(ch=>ch.directionChange);

        if(dirChange.length){
            //console.log(semi);
            let chunknew = [dirChange[0], chunk[chunk.length-1]]
            chunks[c] = chunknew
            //chunks[c+1] = chunk[chunk.length-1]
            continue
        }
    }
    */

    //console.log('!!!chunks', chunks);


    let pathDataC= [pathData[0]];

    for (let c = 0; c < chunks.length; c++) {
        let chunk = chunks[c]

        for(let i=0, l=chunk.length; i<l; i++){
            let com = chunk[i];
            let comN = chunk[i+1];
            let comL = chunk[l-1];

            //console.log(com);

            let {type, values, p0, cp1=null, cp2=null, p=null, extreme, semiExtreme=null, corner=null} = com;


            if(type==='C' && comL && comL.type==='C'){
                let pI = checkLineIntersection(p, cp2, p0, cp1, false)
                let pI2 = checkLineIntersection(p, cp2, comL.p, comL.cp2, false)
                let cp1_1=null
                let cp2_1=null
                let cp1_2=null
                let cp2_2=null

                if(pI){
                    cp1_1 = pointAtT([p0, pI], 0.666 )
                    //renderPoint(markers, cp1_1, 'magenta', '1.75%', '0.5')
                }
                if(pI2){
                    cp2_2 = pointAtT([comL.p, pI2], 0.666 )
                    //renderPoint(markers, cp2_2, 'cyan', '1.75%', '0.5')
                }

                if(pI && pI2){
                    cp2_1= pointAtT([p, pI], 0.666 )
                    //renderPoint(markers, cp2_1, 'orange', '1.75%', '0.5')

                    cp1_2= pointAtT([p, pI2], 0.666 )
                    //renderPoint(markers, cp1_2, 'blue', '1.75%', '0.5')


                
                    let comN =[
                        {type:'M', values: [p0.x, p0.y]},
                        {type:'C', values: [cp1_1.x, cp1_1.y, cp2_1.x, cp2_1.y, p.x, p.y]},
                        {type:'C', values: [cp1_2.x, cp1_2.y, cp2_2.x, cp2_2.y, comL.p.x, comL.p.y]}
                    ]

                    let d=pathDataToD(comN);
                    renderPath(markers, d, 'orange', '1%',  '0.75')
                    //console.log(d);

                    pathDataC.push(
                        {type:'C', values: [cp1_1.x, cp1_1.y, cp2_1.x, cp2_1.y, p.x, p.y]},
                        {type:'C', values: [cp1_2.x, cp1_2.y, cp2_2.x, cp2_2.y, comL.p.x, comL.p.y]}
                    )

                    i++
                    continue

                } else{
                    //pathDataC.push(com)
                }


            }

            // else
            pathDataC.push(com)


        }

    }

    // render
    let d=pathDataToD(pathDataC);
   // renderPath(markers, d, 'orange', '1%',  '0.75')



    // reduce chunks

    return pathData
    return pathDataN
}