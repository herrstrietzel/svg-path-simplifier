import { svgPathSimplify  } from 'svg-path-simplify';

let pathDataString =
`
M 57.13 15.5
c 13.28 0 24.53 8.67 28.42 20.65
c 0.94 2.91 1.45 6.01 1.45 9.23
`

// try to simplify
let pathDataOpt = svgPathSimplify(pathDataString);

// simplified pathData
console.log(pathDataOpt)