export function detectInputType(input) {
    let type = 'string';
    if (input instanceof HTMLImageElement) return "img";
    if (input instanceof SVGElement) return "svg";
    if (input instanceof HTMLCanvasElement) return "canvas";
    if (input instanceof File) return "file";
    if (input instanceof ArrayBuffer) return "buffer";
    if (input instanceof Blob) return "blob";
    if (Array.isArray(input)) return "array";

    if (typeof input === "string") {
        input = input.trim();
        let isSVG = input.includes('<svg') && input.includes('</svg');
        let isPathData = input.startsWith('M') || input.startsWith('m');
        let isPolyString = !isNaN(input.substring(0, 1)) && !isNaN(input.substring(input.length-1, input.length))

        //console.log(input.substring(0, 1), input.substring(input.length-1, input.length));
        
        if(isSVG) {
            type='svgMarkup'
        }
        else if(isPathData) {
            type='pathDataString'
        }
        else if(isPolyString) {
            type='polyString'
        }

        else{
            let url = /^(file:|https?:\/\/|\/|\.\/|\.\.\/)/.test(input);
            let dataUrl = input.startsWith('data:image');
            type = url || dataUrl ? "url" : "string";
        }

        return type
    }

    type = typeof input
    let constructor = input.constructor.name

    return (constructor || type).toLowerCase();
}
