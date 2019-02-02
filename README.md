# RemoteSvn / LocalSvn

perform operations on remote copy of SVN or Read only operations on a Local copy

## Getting Started

checkout to your computer and run: npm install, to run mocha use: npm run test-local / test-remote (edit credentials)

**referance the module**

**create a svn object**
```
const testSvn = new remoteSvn();
```
**Create log output interface**

implement info error and debug functions, accept string, do whatever you want with it
```
logger =  { //looger interface
    info:(str)=>{console.log("[INFO]",str)},
    error:(str)=>{console.error("[ERROR]",str)},
    debug:(str)=>{console.warn("[DEBUG]",str)}
}
```
**Create credentials object**
```
creds = {
    username: "my.username",
    password: "myPassword123"
}
```
**initialize the object**
pass the name of the folder you want the local files to be saved at,
pass the base URL of the svn remote
pass the logger interface function
pass the credentials object
(match the names)
```
svnConfig = {baseFolder, baseURL, logger, creds}
const params = await testSvn.init(svnConfig)
```

+ some examples ...

**all operations returns a Promise, and perform async operations**
```
const returnFilePath = await testSvn.getFile({"filePath":testFiles[0], "revision":undefined})
```

**all operations that require parameters expect an object with a key:value for every parameter**
```
await testSvn.deleteFiles({filePaths:[testFiles[0],testFiles[1]],message:commitMessage})
```

**all downloaded files / newly created files are stored localy, remember to delete them when finished**
```
await testSvn.deleteFiles({filePaths:[testFiles[0],testFiles[1]],message:commitMessage})
```

### Prerequisites
must have svn v1.8 or later installed, one of the packages relay on svnmucc which is included
in that version

```
svnmucc put _localPath_ _remotePath_
```

## Running the tests
Edit the .env file , fill in missing details
Use mocah ( installed globaly using npm i -g mocha)
or use  "npm run test-remote"
or use  "npm run test-local"

### Break down into end to end tests
you can take example from the tests on how to get/add/remove a file and commit


## Built With
* [node-svn-ultimate](https://www.npmjs.com/package/node-svn-ultimate) - SVN wrapper for node
* [fs-extra](https://www.npmjs.com/package/fs-extra) - file system methods
* [count-files](https://www.npmjs.com/package/count-files) - Count files, directories, and bytes in a directory recursively.
* [mocha](https://www.npmjs.com/package/mocha) - Simple, flexible, fun JavaScript test framework for Node.js & The Browser.


## Authors
* **[Gal Angel](gal0angel@gmail.com)**

## License
[GNUv3](/LICENCE.md)

## Acknowledgments
* stackOverflow
* coffee
