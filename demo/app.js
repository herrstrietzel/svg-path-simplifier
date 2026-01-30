
let settings = {}
let inputDecimals = document.querySelector('[name=decimals]')
// preview svg for paths
let svgEl = document.getElementById('svg')


window.addEventListener('DOMContentLoaded', (e) => {

    settings = enhanceInputsSettings;
    //console.log(settings);

    //update rendering
    updateSVG(settings);


    document.addEventListener('settingsChange', (e) => {

        console.log('settingschange', settings);

        //update rendering
        updateSVG(settings);


    })

})


inputFile.addEventListener('input', async (e) => {
    let file = inputFile.files[0];
    let { size } = file;
    let sizeKB = +(size / 1024).toFixed(1)

    if (sizeKB > 500) {

        if (!window.confirm(`This image is quite large ${sizeKB} KB – processing may take a while.\n Wanna proceed?`)) {
            inputFile.value = '';
            return
        }

    }

    let input = await file.text();
    settings.dInput = input;
    inputSvg.value = input;
    
    updateSVG(settings);



}, true)



inputSamples.addEventListener('input', e => {
    let d = e.currentTarget.value;
    inputSvg.value = d;
    settings['dInput'] = d;
    //document.dispatchEvent(new Event('settingsChange'))
    updateSVG(settings);

})


function updateSVG(settings = {}) {

    markers.innerHTML = '';

    showMarkersInPreview(previewWrp, settings)

    // get detailed object
    settings.getObject = true;

    let { dInput } = settings;

    if (!dInput) return

    let t0 = performance.now();
    let pathDataOpt = svgPathSimplify(dInput, settings)
    let t1 = performance.now() - t0;

    console.log('pathDataOpt', pathDataOpt, 'timing', t1);

    console.log(JSON.stringify(pathDataOpt, null, ' '))

    //pathDataOpt = svgPathSimplify(pathDataOpt.d, settings)

    let { d, svg, report, inputType, mode } = pathDataOpt;
    let { original, decimals = null } = report;

    // show auto accuracy
    if (decimals !== null && inputDecimals && settings.autoAccuracy) {
        settings.decimals = decimals
        inputDecimals.value = decimals
    }

    let reportText = !mode ? `${report.new}/${report.original} – removed: ${report.saved} compressed: ${report.compression} %` : `${report.svgSizeOpt}/${report.svgSize} KB – compressed: ${report.compression} %`

    // update report
    commandInfo.textContent = reportText

    // return path data or svg 
    outputSvg.value = !mode ? d : svg;


    // update preview rendering
    svgWrap.innerHTML='';

    if (!mode) {
        svgEl.classList.remove('dsp-non')

        if (inputType === 'polyString') dInput = 'M' + dInput;

        path1.setAttribute('d', dInput)
        pathS.setAttribute('d', d)


        adjustViewBox(svgEl);
    }

    // input is svg doc
    if(mode){
        svgEl.classList.add('dsp-non')
        svgWrap.insertAdjacentHTML('beforeend', svg)
        let svgDocEl = svgWrap.querySelector('svg')

        let viewBoxAtt = svgDocEl.getAttribute('viewBox')

        if(!viewBoxAtt){

            let viewBox = getViewBox(svgDocEl);
            viewBoxAtt = [viewBox.x, viewBox.y, viewBox.width, viewBox.height].join(' ')
    
            //console.log('viewBox', viewBox);
            svgDocEl.setAttribute('viewBox', viewBoxAtt)
        }

        svgDocEl.removeAttribute('width')
        svgDocEl.removeAttribute('height')

    }

}




function showMarkersInPreview(target, settings = {}) {

    if (settings.showMarkers) {
        target.classList.add('showMarkers')

    } else {
        target.classList.remove('showMarkers')
    }
}



function adjustViewBox(svg) {
    let bb = svg.getBBox();
    let [x, y, width, height] = [bb.x, bb.y, bb.width, bb.height];
    svg.setAttribute("viewBox", [x, y, width, height].join(" "));
}