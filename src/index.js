// just for visual debugging
import { renderPoint } from './svgii/visualize';

import {svgPathSimplify} from './pathSimplify-main';
//import { parsePathDataNormalized } from './svgii/pathData_parse';
//import {getViewBox} from './svg_getViewbox';

export {svgPathSimplify as svgPathSimplify};
//export {getViewBox as getViewBox};

export {
    abs, acos, asin, atan, atan2, ceil, cos, exp, floor, hypot,
    log, max, min, pow, random, round, sin, sqrt, tan, PI
} from './constants';


/*
//export {parsePathDataString} from './svgii/pathData_parse';
import {parsePathDataString} from './svgii/pathData_parse';
import {parsePathDataString_plus} from './svgii/pathData_parse2';
export {parsePathDataString as parsePathDataString}
export {parsePathDataString_plus as parsePathDataString_plus}
*/

// IIFE 
if (typeof window !== 'undefined') {
    window.svgPathSimplify = svgPathSimplify;
    //window.parsePathDataString_plus = parsePathDataString_plus;
    //window.parsePathDataString = parsePathDataString;
    //window.svgPathSimplify = svgPathSimplify;
    //window.svgPathSimplify = parsePathDataNormalized;
    //window.getViewBox = getViewBox;
    //window.renderPoint = renderPoint;
}





