//import { arcToBezier, quadratic2Cubic } from './convert.js';
//import { getAngle, bezierhasExtreme, getDistance  } from "./geometry";



export function parse(path, debug = true) {


    debug = 'log'

    const paramCounts = {
        // Move (absolute & relative)
        0x4D: 2,  // 'M'
        0x6D: 2,  // 'm'

        // Arc
        0x41: 7,  // 'A'
        0x61: 7,  // 'a'

        // Cubic Bézier
        0x43: 6,  // 'C'
        0x63: 6,  // 'c'

        // Horizontal Line
        0x48: 1,  // 'H'
        0x68: 1,  // 'h'

        // Line To
        0x4C: 2,  // 'L'
        0x6C: 2,  // 'l'

        // Quadratic Bézier
        0x51: 4,  // 'Q'
        0x71: 4,  // 'q'

        // Smooth Cubic Bézier
        0x53: 4,  // 'S'
        0x73: 4,  // 's'

        // Smooth Quadratic Bézier
        0x54: 2,  // 'T'
        0x74: 2,  // 't'

        // Vertical Line
        0x56: 1,  // 'V'
        0x76: 1,  // 'v'

        // Close Path
        0x5A: 0,  // 'Z'
        0x7A: 0   // 'z'
    };



    const commandSet = new Set([

        //M
        0x4D,
        0x6D,

        // Arc
        0x41,
        0x61,

        // Cubic Bézier
        0x43,
        0x63,

        // Horizontal Line
        0x48,
        0x68,

        // Line To
        0x4C,
        0x6C,

        // Quadratic Bézier
        0x51,
        0x71,

        // Smooth Cubic Bézier
        0x53,
        0x73,

        // Smooth Quadratic Bézier
        0x54,
        0x74,

        // Vertical Line
        0x56,
        0x76,

        // Close Path
        0x5A,
        0x7A,
    ]);


    const SPECIAL_SPACES = new Set([
        0x1680, 0x180E, 0x2000, 0x2001, 0x2002, 0x2003, 0x2004, 0x2005, 0x2006,
        0x2007, 0x2008, 0x2009, 0x200A, 0x202F, 0x205F, 0x3000, 0xFEFF
    ]);


    function isSpace(ch) {
        return (ch === 0x0A) || (ch === 0x0D) || (ch === 0x2028) || (ch === 0x2029) || // Line terminators
            // White spaces or comma
            (ch === 0x002C) || (ch === 0x20) || (ch === 0x09) || (ch === 0x0B) || (ch === 0x0C) || (ch === 0xA0) ||
            (ch >= 0x1680 && SPECIAL_SPACES.has(ch) >= 0);
    }


    function isCommandType(code) {
        //return paramCounts.hasOwnProperty(code);
        return commandSet.has(code);
    }


    let i = 0, len = path.length;
    let lastCommand = "";
    let pathData = [];
    let itemCount = -1;
    let val = '';
    let wasE = false;
    let wasSpace = false;
    let floatCount = 0;
    let valueIndex = 0;
    let maxParams = 0;
    let needsNewSegment = false;

    //absolute/relative or shorthands
    let hasRelatives = false;
    let hasArcs = false;
    let hasShorthands = false;
    let hasQuadratics = false;

    let relatives = new Set(['m', 'c', 'q', 'l', 'a', 't', 's', 'v', 'h']);
    let shorthands = new Set(['t', 's', 'v', 'h', 'T', 'S', 'V', 'H']);
    let quadratics = new Set(['t', 'q', 'T', 'Q']);

    //collect errors 
    let log = [];
    let feedback;

    function addSeg() {
        // Create new segment if needed before adding the minus sign
        if (needsNewSegment) {

            // sanitize implicit linetos
            if (lastCommand === 'M') lastCommand = 'L';
            else if (lastCommand === 'm') lastCommand = 'l';

            pathData.push({ type: lastCommand, values: [] });
            itemCount++;
            valueIndex = 0;
            needsNewSegment = false;


        }
    }

    function pushVal(checkFloats = false) {

        // regular value or float
        if (!checkFloats ? val !== '' : floatCount > 0) {

            // error: no first command
            if (debug && itemCount === -1) {

                feedback = 'Pathdata must start with M command'
                log.push(feedback)

                // add M command to collect subsequent errors
                lastCommand = 'M'
                pathData.push({ type: lastCommand, values: [] });
                maxParams = 2;
                valueIndex = 0
                itemCount++

            }

            if (lastCommand === 'A' || lastCommand === 'a') {
                val = sanitizeArc()
                pathData[itemCount].values.push(...val);

            } else {
                // error: leading zeroes
                if (debug && val[1] && val[1] !== '.' && val[0] === '0') {
                    feedback = 'Leading zeros not valid: ' + val
                    log.push(feedback)
                }

                pathData[itemCount].values.push(+val);
            }

            valueIndex++;
            val = '';
            floatCount = 0;

            // Mark that a new segment is needed if maxParams is reached
            needsNewSegment = valueIndex >= maxParams;

        }

    }


    function sanitizeArc() {

        let valLen = val.length;
        let arcSucks = false;

        // large arc and sweep
        if (valueIndex === 3 && valLen === 2) {
            //console.log('large arc sweep combined', val, +val[0], +val[1]);
            val = [+val[0], +val[1]];
            arcSucks = true
            valueIndex++
        }

        // sweep and final
        else if (valueIndex === 4 && valLen > 1) {
            //console.log('sweep and final', val, val[0], val[1]);
            val = [+val[0], +val[1]];
            arcSucks = true
            valueIndex++
        }

        // large arc, sweep and final pt combined
        else if (valueIndex === 3 && valLen >= 3) {
            //console.log('large arc, sweep and final pt combined', val);
            val = [+val[0], +val[1], +val.substring(2)];
            arcSucks = true
            valueIndex += 2
        }

        //console.log('val arc', val);
        return !arcSucks ? [+val] : val;

    }

    function validateCommand() {
        if (debug) {
            let lastCom = itemCount > 0 ? pathData[itemCount] : 0
            let valLen = lastCom ? lastCom.values.length : 0;

            //console.log(lastCom, valLen, maxParams,  (valLen && valLen < maxParams ) );

            if ((valLen && valLen < maxParams) || (valLen && valLen > maxParams) || ((lastCommand === 'z' || lastCommand === 'Z') && valLen > 0)) {
                let diff = maxParams - valLen
                feedback = `Pathdata commands in "${lastCommand}" (segment index: ${itemCount}) don't match allowed number of values: ${diff}/${maxParams}`;
                log.push(feedback)
            }
        }
    }



    while (i < len) {
        let char = path[i];
        let charCode = path.charCodeAt(i);

        // New command
        if (isCommandType(charCode)) {


            // command is concatenated without whitespace
            if (val !== '') {
                pathData[itemCount].values.push(+val);
                valueIndex++;
                val = '';
            }

            // check if previous command was correctly closed
            validateCommand()


            // new command type
            lastCommand = char;
            maxParams = paramCounts[charCode];
            let isM = lastCommand === 'M' || lastCommand === 'm'
            let wasClosePath = itemCount>0 && (pathData[itemCount].type === 'z' || pathData[itemCount].type === 'Z')

            // add omitted M command after Z
            if ( wasClosePath && !isM  ) {
                pathData.push({ type: 'm', values: [0, 0]});
                itemCount++;
            }



            pathData.push({ type: lastCommand, values: [] });
            itemCount++;

            //check types relative arcs or quadratics
            if (!hasRelatives) hasRelatives = relatives.has(lastCommand);
            if (!hasShorthands) hasShorthands = shorthands.has(lastCommand);
            if (!hasQuadratics) hasQuadratics = quadratics.has(lastCommand);
            if (!hasArcs) hasArcs = lastCommand === 'a' || lastCommand === 'A';

            // reset counters
            wasSpace = false;
            floatCount = 0;
            valueIndex = 0;
            needsNewSegment = false;

            i++;
            continue;
        }

        // Separated by White space 
        if (isSpace(charCode)) {

            // push value
            pushVal()

            wasSpace = true;
            wasE = false;
            i++;
            continue;
        }


        // if last
        else if (i === len - 1) {

            val += char;
            //console.log('last', val, char);

            // push value
            pushVal()
            wasSpace = false;
            wasE = false;

            validateCommand()
            break;
        }


        // minus or float separated
        if ((!wasE && !wasSpace && charCode === 0x2D) ||
            (!wasE && charCode === 0x2E)
        ) {

            // checkFloats changes condition for value adding
            let checkFloats = charCode === 0x2E;

            // new val
            pushVal(checkFloats);

            // new segment
            addSeg()


            // concatenated floats
            if (checkFloats) {
                floatCount++;
            }
        }


        // regular splitting
        else {
            addSeg()
        }

        val += char;

        // e/scientific notation in value
        wasE = (charCode === 0x45 || charCode === 0x65);
        wasSpace = false;
        i++;
    }

    //validate final
    validateCommand()

    // return error log
    if (debug && log.length) {
        feedback = 'Invalid path data:\n' + log.join('\n')
        if (debug === 'log') {
            console.log(feedback);
        } else {
            throw new Error(feedback)
        }
    }

    pathData[0].type = 'M'




    return {
        pathData: pathData,
        hasRelatives: hasRelatives,
        hasShorthands: hasShorthands,
        hasQuadratics: hasQuadratics,
        hasArcs: hasArcs
    }

}

