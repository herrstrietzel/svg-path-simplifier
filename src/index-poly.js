// src/node-dom.js
import { DOMParser, parseHTML } from 'linkedom';

// install globals BEFORE anything else loads
if (!globalThis.DOMParser) {
  globalThis.DOMParser = DOMParser;
}

if (!globalThis.parseHTML) {
  globalThis.parseHTML = parseHTML;
}


// polyfill browsers XMLSerializer
export class XMLSerializerPoly {
    serializeToString(document) {
        return document.toString();
    }
}

if (!globalThis.XMLSerializer) {
    globalThis.XMLSerializer = XMLSerializerPoly;
}



