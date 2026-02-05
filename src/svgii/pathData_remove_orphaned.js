export function removeOrphanedM(pathData) {

    let pathDataN = []
    for (let i = 0, l = pathData.length; i < l; i++) {
        let com = pathData[i];
        if (!com) continue;
        let { type = null, values = [] } = com;
        let comN = pathData[i + 1] ? pathData[i + 1] : null;
        if ((type === 'M' || type === 'm')) {

            if (!comN || (comN && (comN.type === 'Z' || comN.type === 'z'))) {
                if(comN) i++
                continue
            }
        }
        pathDataN.push(com)
    }

    return pathDataN;

}