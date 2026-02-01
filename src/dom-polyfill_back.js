// polyfill browsers XMLSerializer
export class XMLSerializerPoly {
    serializeToString(document) {
        return document.toString();
    }
}

export class DOMParserPoly {
    parseFromString(string) {
        return parseHTML(string);
    }
}

if (typeof globalThis.XMLSerializer === 'undefined') {
    globalThis.XMLSerializer = XMLSerializerPoly;
    //console.log('!!!no XMLSerializer')
}

if (typeof globalThis.DOMParser === 'undefined') {
    globalThis.DOMParser = DOMParserPoly;
    //console.log('!!!no DOMParser')
}
