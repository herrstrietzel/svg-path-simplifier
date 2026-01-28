// just for visual debugging
import { renderPoint } from './svgii/visualize';

import {svgPathSimplify} from './pathSimplify-main';


export {svgPathSimplify as svgPathSimplify};

export {
    abs, acos, asin, atan, atan2, ceil, cos, exp, floor, hypot,
    log, max, min, pow, random, round, sin, sqrt, tan, PI
} from './constants';


// IIFE 
if (typeof window !== 'undefined') {
    window.svgPathSimplify = svgPathSimplify;
    window.renderPoint = renderPoint;
}



