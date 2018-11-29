const path                = require('path')
const fs                  = require('fs')

Object.defineProperty(global, '__stack', {
    get: function() {
        var orig = Error.prepareStackTrace;
        Error.prepareStackTrace = function(_, stack) {
            return stack;
        };
        var err = new Error;
        Error.captureStackTrace(err, arguments.callee);
        var stack = err.stack;
        Error.prepareStackTrace = orig;
        return stack;
    }
});

Object.defineProperty(global, '__line', {
    get: function() {
        return __stack[1].getLineNumber();
    }
});

Object.defineProperty(global, '__function', {
    get: function() {
        return __stack[1].getFunctionName();
    }
});

Object.defineProperty(global, '__callee', {
    get: function() {
        return __stack[2].getFunctionName();
    }
});
const required = (name = '') => {throw new Error(__callee + ' >> Missing parameter: '+ name)};
let setRequiredParams = (params,required) => {
    if(typeof params != 'object'){throw new Error(`options should be an object`)}
    let retObj = {}
    for (const param in params) {
        retObj[param] = params[param];
        const index = required.indexOf(param)
        if(index > -1) { required.splice(index, 1)}
        else {throw new Error(`Unknowen parameter ${param}`)};
    }
    if(required.length > 0){throw new Error(`missing parameters: ${required}`)};
    return retObj;
}
let getArrMaxInt = (arr) => {
    let res = arr;
    res = res.map(x => parseInt(x))
    res = Math.max(...res)
    return res;
}
let createFolderArr = (filePath) => {
    const pathArr = path.dirname(filePath).split('/')
    const folderCreateArr = []
    while(pathArr.length){
        let x = pathArr.shift()
        if(folderCreateArr.length > 0) {
            folderCreateArr.push(path.join(folderCreateArr[folderCreateArr.length -1],x))
        }else{
            folderCreateArr.push(x)
        }
    }
    return folderCreateArr
}
const isDirectory = source => fs.lstatSync(source).isDirectory()
const getDirectories = source => {
    var reduced = fs.readdirSync(source).reduce(function(filtered, dir) {
        if (isDirectory(path.join(source, dir))) {
           filtered.push(dir)
        }
        return filtered
      }, [])
      return reduced
}

module.exports = {
    setRequiredParams,
    getArrMaxInt,
    required,
    createFolderArr,
    getDirectories
}