import { getDistance, getSquareDistance, checkLineIntersection, pointAtT, getDistAv } from "./svgii/geometry";
import { getBezierArea, getPolygonArea } from "./svgii/geometry_area";
import { renderPoint } from "./svgii/visualize";

export function combineCubicArray(commands = [], threshold = 0.05) {


    let [comF, comM, comE] = commands;

    commands.forEach(com => {
        let area = getBezierArea([com.p0, com.cp1, com.cp2, com.p], true)
        com.area = area
    })

    // sort by area
    let commandsFiltered = JSON.parse(JSON.stringify(commands)).sort((a,b)=>b.area-a.area )

    let comL = commandsFiltered[0]

    // find largest segment
    //let area2 = getBezierArea(comF)

    console.log('area1', commands, commandsFiltered);

    // largest segment
    comM = commandsFiltered[0]


    //let segLargest = 
    let pt_mid = pointAtT([comM.p0, comM.cp1, comM.cp2, comM.p], 0.5, false, true)

    let seg1_cp2 = pt_mid.cpts[2]
    let seg2_cp1 = pt_mid.cpts[3]
    renderPoint(markers, seg1_cp2, 'orange')
    renderPoint(markers, seg2_cp1, 'cyan')


    console.log('comM', pt_mid);

    renderPoint(markers, comF.p0, 'green')
    renderPoint(markers, comL.p, 'purple')
    //renderPoint(markers, comE.cp2, 'orange')

    renderPoint(markers, pt_mid, 'magenta')
    //let ptI_1 = checkLineIntersection(comF)


    return commands;
}

