// add suport for DOM manipulations
import { DOMParser, parseHTML } from 'linkedom';
//import { XMLSerializerPoly, DOMParserPoly } from 'svg-path-simplify/dom_polyfills.js';
import { svgPathSimplify } from 'svg-path-simplify';




let svgMarkup =
    `<?xml version="1.0" encoding="utf-8"?>
<!-- Generator: Adobe Illustrator 16.0.0, SVG Export Plug-In . SVG Version: 6.00 Build 0)  -->
<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" width="100px"
	 height="100px" viewBox="0 0 100 100" enable-background="new 0 0 100 100" xml:space="preserve">
<g id="garamond">
	<path id="path1" d="M16.2 125.7 L16.2 125.7 Q12.1 125.7 8.4 123.8 Q4.6 122 2.3 119.1 Q0 116.2 0.2 113.1 L0.2 113.1 L0.4 112.6 Q2.2 111.2 5 109.3 Q7.8 107.4 11.4 105.1 Q15 102.8 19.1 100.4 L19.1 100.4 L19.2 99.5 Q16.8 98.1 15.5 94.7 Q14.1 91.3 14.1 86.7 L14.1 86.7 Q14.1 81.1 16 75.5 Q17.9 70 21.1 65.5 Q24.2 61 28.1 58.3 Q32 55.6 35.9 55.6 L35.9 55.6 L46.1 57.2 L47.2 54.7 L47.7 54.6 L50.8 56.1 L51.6 57 Q49.2 61.4 47.6 65.1 Q45.9 68.9 45 72 Q44 75.1 43.7 77.8 L43.7 77.8 Q43.4 80.3 43.2 83.7 Q43 87.1 42.8 90.6 Q42.6 94.2 42.5 97.1 Q42.3 100.1 42.1 101.6 L42.1 101.6 Q41.7 105.1 40 108.5 Q38.2 112 35.6 115.1 Q32.9 118.2 29.7 120.6 Q26.5 123 23 124.3 Q19.5 125.7 16.2 125.7 ZM19.5 119.9 L19.5 119.9 Q25.9 119.9 30.4 115.3 Q34.9 110.7 35.9 102.7 L35.9 102.7 L38.4 82 L37.6 81.8 Q34.5 87.5 32.3 91 Q30 94.6 28 96.8 Q25.9 99 23.5 100.8 L23.5 100.8 Q20.4 103.1 16.8 105.3 Q13.2 107.6 10.7 109.4 Q8.1 111.3 8.1 112.3 L8.1 112.3 Q8.1 114 9.9 115.8 Q11.6 117.5 14.3 118.7 Q16.9 119.9 19.5 119.9 ZM24.8 92.9 L24.8 92.9 Q26.3 92.9 29 89.4 Q31.6 86 35.2 79.5 Q38.7 73.1 42.9 64.1 L42.9 64.1 Q40.9 63.1 39.1 62.4 Q37.2 61.7 35.7 61.3 Q34.1 61 32.8 61 L32.8 61 Q29.8 61 27.1 64 Q24.4 67.1 22.7 71.9 Q21 76.7 21 82 L21 82 Q21 86.3 22.2 89.6 Q23.3 92.9 24.8 92.9 Z "/>
</g>
</svg>`


/*
*/
let document = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml');
let svg = document.querySelector('svg');
let path = svg.querySelector('path');
let d = path.getAttribute('d')

let markup = document.toString()
markup = new XMLSerializer().serializeToString(svg)

console.log(markup);

/*
// try to simplify
let svgOpt = svgPathSimplify(svgMarkup);

// simplified pathData
console.log(svgOpt)
*/
