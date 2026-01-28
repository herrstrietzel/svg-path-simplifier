
let settings = {}
let inputDecimals = document.querySelector('[name=decimals]')

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

    let { dInput } = settings;

    if (!dInput) return

    let t0=performance.now();
    let pathDataOpt = svgPathSimplify(dInput, settings)
    let t1=performance.now() - t0;

    console.log('pathDataOpt', pathDataOpt, 'timing', t1);

    //pathDataOpt = svgPathSimplify(pathDataOpt.d, settings)

    let { d, pathData, report } = pathDataOpt;
    let { original, decimals } = report;

    // show auto accuracy
    if (inputDecimals && settings.autoAccuracy) {
        settings.decimals = decimals
        inputDecimals.value = decimals
    }


    commandInfo.textContent = `${report.new}/${report.original} – removed ${report.saved}`

    outputSvg.value = d;

    // update rendering
    path1.setAttribute('d', dInput)
    pathS.setAttribute('d', d)


    adjustViewBox(svg);


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