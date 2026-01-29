# svg-path-simplify
Simplify Bézier paths while keeping shape.  

> Darling, please look at the graphic – not the file size

This library prioritizes **visual quality** over numeric compression gains.
Unlike most existing approaches (e.g in graphic applications), it checks where simplifications are suitable and stops simplification at the right »point« (literally).


## Features – what it does
* reduces the number of SVG commands (both Bèziers and lines) by converting/combining adjacent:  
  * Béziers (`C`, `Q`)
  * flat Béziers to Linetos
  * colinear lines (`L`)

* reorders path starting points to strip unnecessary closing lineto commands
* optimizes SVG file size by contextually converting to:  
  * shorthand commands (`C` => `S`, `Q` => `T`, `L`=>`H` or `V`)
  * cubics to quadratic Béziers  (only 1 control point)
  * cubic arc-like segments to `A` (elliptic arc)

* adaptive coordinate rounding: small or large details can be auto-detected to find a suitable floating point accuracy without guessing the decimal value (3 decimals may not be the silver bullet=)
* split segments at extremes – only useful for manual editing


## Usage 

### Browser IIFE

```html
<script src="https://cdn.jsdelivr.net/npm/svg-path-simplify@latest/dist/svg-path-simplify.min.js"></script>
```

```js

// stringified pathData – 2 cubic Bézier commands
let pathDataString = 
`
M 57.13 15.5
c 13.28 0 24.53 8.67 28.42 20.65
c 0.94 2.91 1.45 6.01 1.45 9.23
`

// try to simplify
let pathDataOpt = svgPathSimplify(pathDataString)

let { d, pathData, report } = pathDataOpt;


// simplified pathData
console.log(d)

// returns `M 57.1 15.5c16.5 0 29.9 13.4 29.9 29.9`

```






