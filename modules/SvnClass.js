const   svnUltimate         = require('node-svn-ultimate'),
        url                 = require('url'),
        fs                  = require('fs-extra'),
        r                   = require('./util').required;

class Svn {

    constructor () {
        this.svnModelParams = {}
    }

    init({
        creds       = r('creds: {username, password}'),
        baseURL     = r('baseURL: (String)'),
        baseFolder  = r('baseFolder: (String)'),
        logger      = r('logger: ({info(),debug(),error()})')
    }) {
        return new Promise (async (resolve, reject) => {
            this.svnModelParams = {baseURL, baseFolder, localFiles:{}, logger, creds}
            if (await this.confirmURL({})){
                this.svnModelParams.currentSvnVer = await this.getSvnRevision()
                this.svnModelParams.logger.info(`init - ${baseURL}, Done.`)
                return resolve(this.svnModelParams)
            } else {
                this.svnModelParams.logger.error(`init - username ${creds.username} Failed for url: ${baseURL}`)
                return reject(new Error('Bad URL / Authentication'))
            }
        })
    }

    confirmURL({folderURL=''}) {
        return new Promise((resolve,reject) => {
            const testURL = url.resolve(this.svnModelParams.baseURL, folderURL)
            svnUltimate.commands.list(testURL,{params:['--depth empty'], ...this.svnModelParams.creds}, (err,data) => {
                if(err) {
                    this.svnModelParams.logger.error(`confirmURL - ${err.message}`)
                    return resolve(false)
                }
                this.svnModelParams.logger.debug(`confirmURL - ${JSON.stringify(data)}, Done.`)
                return resolve(true)
            })
        })
    }

    getSvnRevision() {
        return new Promise((resolve, reject) => {
            svnUltimate.commands.info(this.svnModelParams.baseURL, {...this.svnModelParams.creds}, (err,data) => {
                if(err) {
                    this.svnModelParams.logger.error(`getSvnRevision - ${err}`)
                    return reject(err)
                }
                const ver = data.entry.$.revision
                this.svnModelParams.logger.debug(`getSvnRevision - ${ver}, Done.`)
                return resolve(ver)
            })
        })
    }
    clearLocalFiles() {
        return new Promise((resolve, reject) => {
            fs.removeSync(this.svnModelParams.baseFolder)
            this.svnModelParams.localFiles={}
            this.svnModelParams.logger.info('clearLocalFiles, Done.')
            return resolve()
        })
    }
}
module.exports = Svn