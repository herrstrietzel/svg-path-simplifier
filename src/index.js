// just for visual debugging
import { renderPoint } from './svgii/visualize';

import {svgPathSimplify} from './pathSimplify-main';
import {getViewBox} from './svg_getViewbox';


export {svgPathSimplify as svgPathSimplify};
export {getViewBox as getViewBox};

export {
    abs, acos, asin, atan, atan2, ceil, cos, exp, floor, hypot,
    log, max, min, pow, random, round, sin, sqrt, tan, PI
} from './constants';


// IIFE 
if (typeof window !== 'undefined') {
    window.svgPathSimplify = svgPathSimplify;
    window.getViewBox = getViewBox;
    window.renderPoint = renderPoint;
}



