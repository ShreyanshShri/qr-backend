const randomstring = require("randomstring");

let publicKeys = {
    BAS101: randomstring.generate(),
    BAS103: randomstring.generate(),
    BAS105: randomstring.generate(),
    BEE101: randomstring.generate(),
    BME101: randomstring.generate()
};

const getKeys = () => {
    return publicKeys;
}

const getKey = (sub) => {
    return publicKeys[sub];
}

const setKeys = (keys) => {
    publicKeys = keys;
}

const resetKeys = () => {
    // resetting the timer
    const len = Object.keys(publicKeys).length;
    // updating tokens
    for(let i=0; i<=len-1; i++) {
        publicKeys[Object.keys(publicKeys)[i]] = randomstring.generate();
    }
}

module.exports = {
    publicKeys,
    getKey,
    getKeys,
    setKeys,
    resetKeys
};