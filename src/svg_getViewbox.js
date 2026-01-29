/**
 * get viewBox 
 * either from explicit attribute or
 * width and height attributes
 */

export function getViewBox(svg = null, round = false) {

    // browser default
    if (!svg) return { x: 0, y: 0, width: 300, height: 150 }

    let style = window.getComputedStyle(svg);

    // the baseVal API method also converts physical units to pixels/user-units
    let w = svg.hasAttribute('width') ? svg.width.baseVal.value : parseFloat(style.width) || 300;
    let h = svg.hasAttribute('height') ? svg.height.baseVal.value : parseFloat(style.height) || 150;

    let viewBox = svg.getAttribute('viewBox') ? svg.viewBox.baseVal : { x: 0, y: 0, width: w, height: h };

    // remove SVG constructor
    let { x, y, width, height } = viewBox;
    viewBox = { x, y, width, height };

    // round to integers
    if (round) {
        for (let prop in viewBox) {
            viewBox[prop] = Math.ceil(viewBox[prop]);
        }
    }

    return viewBox
}