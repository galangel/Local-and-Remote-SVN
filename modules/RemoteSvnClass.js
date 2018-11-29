const   svnUltimate         = require('node-svn-ultimate'),
        path                = require('path'),
        url                 = require('url'),
        fs                  = require('fs-extra'),
        getArrMaxInt        = require('./util').getArrMaxInt,
        r                   = require('./util').required,
        createFolderArr     = require('./util').createFolderArr,
        SvnClass            = require('./SvnClass')

class RemoteSvn extends SvnClass{

    constructor () {
        super()
    }

    getFileRev({filePath = r('filePath')}) {
        return new Promise((resolve, reject) => {
            const fileUrl = url.resolve(this.svnModelParams.baseURL, filePath)
            svnUltimate.commands.info(fileUrl, {...this.svnModelParams.creds}, (err, data) => {
                if(err) {
                    this.svnModelParams.logger.error(`getFileRev - ${err}`)
                    return reject(err)
                }
                const ver = data.entry.commit.$.revision
                this.svnModelParams.logger.debug(`getFileRev - ${filePath} : ${ver}, Done.`)
                return resolve(ver)
            })
        })
    }

    getFileInfo({filePath = r('filePath')}) {
        return new Promise((resolve, reject) => {
            const fileUrl = url.resolve(this.svnModelParams.baseURL, filePath)
            svnUltimate.commands.info(fileUrl, {...this.svnModelParams.creds}, (err, data) => {
                if(err) {
                    this.svnModelParams.logger.error(`getFileInfo - ${err}`)
                    return reject(err)
                }
                const resVal = data.entry.commit
                this.svnModelParams.logger.debug(`getFileInfo - ${filePath} : ${resVal}, Done.`)
                return resolve(resVal)
            })
        })
    }

    getFileContent({filePath = r('filePath')}) {
        return new Promise((resolve, reject) => {
            const fileUrl = url.resolve(this.svnModelParams.baseURL, filePath)
            svnUltimate.commands.cat(fileUrl, {...this.svnModelParams.creds}, (err, data) => {
                if(err) {
                    this.svnModelParams.logger.error(`getFileContent - ${err}`)
                    return reject(err)
                }
                this.svnModelParams.logger.debug(`getFileContent - ${filePath}, Done.`)
                return resolve(data)
            })
        })
    }

    ensureSvnDir({dirPath = r('dirPath')}) {
        return new Promise(async (resolve, reject) => {
            const pathArr = createFolderArr(dirPath)
            for (let i = 0; i < pathArr.length; i++) {
                if(await this.confirmURL({folderURL:pathArr[i]})){
                    pathArr.splice(i,1); i--
                }
            }
            this.svnModelParams.logger.debug(`ensureSvnDir - ${dirPath}, Done.`)
            return resolve(pathArr)
        })
    }

    deleteFiles({filePaths = r('filePaths'), message = r('message')}) {
        return new Promise(async (resolve, reject) => {
            const errs = []
            const urlArr = filePaths.map(x => url.resolve(this.svnModelParams.baseURL, x))
            svnUltimate.commands.del(urlArr, {params:[`-m "${message}"`], ...this.svnModelParams.creds}, (err, data) => {
                if(err) {
                    this.svnModelParams.logger.error(`deleteFiles - ${err}`)
                    return reject(err)
                }
                this.svnModelParams.logger.debug(`deleteFiles - ${filePaths} : ${data}, Done.`)
                return resolve(data)
            })
        })
    }

    getFile({filePath = r('filePath'),revision}) {
        return new Promise(async (resolve, reject) => {
            const rev = typeof revision != 'undefined' ? revision : await this.getFileRev({filePath})
            const fileUrl = url.resolve(this.svnModelParams.baseURL, filePath)
            const localFilePath = path.resolve(this.svnModelParams.baseFolder, filePath)
            const folderPath = path.dirname(localFilePath)
            await fs.ensureDir(folderPath);
            svnUltimate.commands.export(fileUrl, localFilePath, {force:true, params:[`-r ${rev}`], ...this.svnModelParams.creds}, (err, data) => {
                if(err) {
                    this.svnModelParams.logger.error(`getFile - ${err}`)
                    return reject(err)
                }
                this.svnModelParams.localFiles[filePath] = rev
                const fileAdded = data.split('\n')[0]
                this.svnModelParams.logger.debug(`getFile - ${filePath} : ${fileAdded}, Done.`)
                return resolve(fileAdded.slice(fileAdded.lastIndexOf(' ')+1).replace(/\\/g, "/").trim())
            })
        })
    }

    getFiles({filePathRevPairs = r('filePathRevPairs')}) {
        return new Promise(async (resolve, reject) => {
            const mappingPromise = filePathRevPairs.map(x => this.getFile({filePath:x.filePath, revision:x.revision}))
            await Promise.all(mappingPromise).then(function(result) {
                this.svnModelParams.logger.debug(`getFiles - ${JSON.stringify(filePathRevPairs)}, Done.`)
                return resolve(result)
            }.bind(this))
        })
    }

    commitFiles({message = r('message'), files, clearOnFinish}) {
        return new Promise(async (resolve, reject) => {
            const maxRev = getArrMaxInt(Object.values(this.svnModelParams.localFiles))
            const commandArr = []
            commandArr.push(`-U ${this.svnModelParams.baseURL}`)
            commandArr.push(`-r ${(maxRev == 0 ? this.svnModelParams.currentSvnVer : maxRev)}`)
            commandArr.push(' -- ')
            let paths = files != undefined ? files : Object.keys(this.svnModelParams.localFiles)
            if (!Array.isArray(paths)) {paths = [paths]}
            await Promise.all(paths.map(async (file) => {
                const neededFolders = await this.ensureSvnDir({dirPath:file})
                neededFolders.forEach((folder) => {
                    commandArr.push(`mkdir ${folder}`)
                })
                const localFilePath = path.resolve(this.svnModelParams.baseFolder, file);
                commandArr.push(`put ${localFilePath} ${file}`)
            }))
            svnUltimate.commands.mucc(commandArr, message, {noStandardOptions:true, ...this.svnModelParams.creds}, (err, data) => {
                if(err) {
                    this.svnModelParams.logger.error(`commitFiles - ${err}`)
                    return reject(err)
                }
                this.svnModelParams.logger.info(`commitFiles - ${JSON.stringify(data)}, Done.`)
                if(clearOnFinish) {
                    this.clearLocalFiles()
                }
                return resolve(data)
            })
        })
    }

    newFile({dest = r('dest'), sourceFile:filePath, sourceText}) {
        return new Promise (async (resolve, reject) => {
            let fileContent
            if(typeof filePath != 'undefined') {
                fileContent = await this.getFileContent({filePath})
            }else if(typeof sourceText != 'undefined') {
                fileContent = sourceText
            }else{
                fileContent = ''
            }
            const localFilePath = path.join(this.svnModelParams.baseFolder, dest)
            await fs.ensureFile(localFilePath)
            await fs.writeFile(localFilePath, fileContent)
            this.svnModelParams.localFiles[dest] = 0
                this.svnModelParams.logger.debug(`newFile - ${dest}, Done.`)
            return resolve(localFilePath)
        })
    }
}

module.exports = RemoteSvn