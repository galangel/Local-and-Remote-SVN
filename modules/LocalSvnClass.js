const   svnUltimate         = require('node-svn-ultimate'),
        path                = require('path'),
        url                 = require('url'),
        r                   = require('./util').required,
        SvnClass            = require('./SvnClass'),
        getDirectories      = require('./util').getDirectories

class LocaleSvn extends SvnClass {

    constructor () {
        super()
    }

    checkoutFolder({folderPath=r('folderPath: (String)')}) {
        return new Promise((resolve,reject) => {
            const folderURL = url.resolve(this.svnModelParams.baseURL, folderPath)
            const localFolderPath = path.resolve(this.svnModelParams.baseFolder, folderPath)
            svnUltimate.commands.checkout(folderURL, localFolderPath, {...this.svnModelParams.creds}, (err, data) => {
                if(err) {
                    this.svnModelParams.logger.error(`checkoutFolder - ${err}`)
                    return reject(false)
                }
                this.svnModelParams.logger.debug(`checkoutFolder - ${folderPath}, Done.`)
                return resolve(true)
            })
        })
    }

    updateFolders({foldersPaths=r('foldersPaths: (Array of Strings)')}) {
        return new Promise(async (resolve,reject) => {
            const pathsArr = foldersPaths.map(x => path.resolve(this.svnModelParams.baseFolder, x))
            for (let i = 0; i < pathsArr.length; i++) {
                await this.cleanupFolder({folderPath:foldersPaths[i]})
            }
            svnUltimate.commands.update(pathsArr, {params: ['--accept tf'], ...this.svnModelParams.creds}, (err, data) => {
                if(err) {
                    this.svnModelParams.logger.error(`updateFolders - ${err}`)
                    return reject(false)
                }
                this.svnModelParams.logger.debug(`updateFolders - ${foldersPaths}, Done.`)
                return resolve(true)
            })
        })
    }

    cleanupFolder({folderPath=r('folderPath: (String)'), remove_unversioned = false}) {
        return new Promise(async (resolve,reject) => {
            const localFolderPath = path.resolve(this.svnModelParams.baseFolder, folderPath)
            const ru = remove_unversioned ? '--remove-unversioned' : ''
            svnUltimate.commands.cleanup(localFolderPath, {params: [ru], ...this.svnModelParams.creds}, (err, data) => {
                if(err) {
                    this.svnModelParams.logger.error(`cleanupFolder - ${err}`)
                    return reject(false)
                }
                this.svnModelParams.logger.debug(`cleanupFolder - ${folderPath}, Done.`)
                return resolve(true)
            })
        })
    }

    revertFolder({folderPath=r('folderPath: (String)')}) {
        return new Promise(async (resolve,reject) => {
            const localFolderPath = path.resolve(this.svnModelParams.baseFolder, folderPath)
            svnUltimate.commands.revert(localFolderPath, {params: ['--recursive'], ...this.svnModelParams.creds}, (err, data) => {
                if(err) {
                    this.svnModelParams.logger.error(`revertFolder - ${err}`)
                    return reject(false)
                }
                this.svnModelParams.logger.debug(`revertFolder - ${folderPath}, Done.`)
                return resolve(true)
            })
        })
    }

    pristine() {
        return new Promise(async (resolve, reject) => {
            try{
                const dirs = getDirectories(this.svnModelParams.baseFolder)
                for(const dir of dirs) {
                    await this.cleanupFolder({folderPath: dir, remove_unversioned: true})
                    await this.revertFolder({folderPath: dir})
                }
                await this.updateFolders({foldersPaths: dirs})
                this.svnModelParams.logger.debug('pristine - Done')
                return resolve(true)
            } catch(err) {
                this.svnModelParams.logger.error(`pristine - ${err}`)
                return reject(false)
            }
        })
    }
}

module.exports = LocaleSvn