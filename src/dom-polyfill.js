// dom-polyfill.js
import { DOMParser } from 'linkedom';

// XMLSerializer polyfill
class XMLSerializerPoly {
    serializeToString(document) {
        // LinkedOM's toString() should work for XML documents
        return document.toString();
    }
}

// Function to install polyfills globally
export function installDOMPolyfills() {
    if (typeof globalThis.DOMParser === 'undefined') {
        globalThis.DOMParser = DOMParser;
    }
    
    if (typeof globalThis.XMLSerializer === 'undefined') {
        globalThis.XMLSerializer = XMLSerializerPoly;
    }
}

// Export individual polyfills for manual use
export { DOMParser, XMLSerializerPoly as XMLSerializer };

// Auto-install if in Node.js environment and not in browser
if (typeof window === 'undefined' && typeof globalThis.DOMParser === 'undefined') {
    installDOMPolyfills();
}