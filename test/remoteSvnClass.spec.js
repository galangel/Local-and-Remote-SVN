require('dotenv').config({path: './test/.env'})
const assert = require('assert')
    remoteSvn   = require('../modules/RemoteSvnClass'),
    path = require('path'),
    countFiles = require('count-files'),
    {promisify} = require('util'),
    fs = require('fs-extra'),
    countFilesP = promisify(countFiles),

logger =  {
    info: (str) => {console.log('[INFO]', str)},
    error: (str) => {console.error('[ERROR]', str)},
    debug: (str) => {console.warn('[DEBUG]', str)}
}
const creds = {
    username: process.env.REMOTE_SVN_USERNAME || '__SVN_USER__',
    password: process.env.REMOTE_SVN_PASSWORD || '__SVN_PASS__'
}
const baseFolder = process.env.REMOTE_SVN_LOCAL_FOLDER_NAME || '__WHERE_LOCAL_FILES_SHOULD_BE_STORED__'
const baseURL = process.env.REMOTE_SVN_URL || '__SVN_URL__'

const testFiles   = ['test/file1.txt', 'test/file2.txt']

const svnConfig   = {baseFolder, baseURL, logger, creds}
const testStrings  = ['text123', 'text456']
const commitMessage = 'Mocha testing...'

describe('RemoteSvnClass', function() {
    describe('Initialize SVN with remote URL', function() {
        it('RemoteSvn initialization should finish without errors', async function() {
            const testSvn = new remoteSvn()
            const params = await testSvn.init(svnConfig)
        }).timeout(0)
    })
    describe('Step 1 - adding a new file using text', function() {
        describe('Create a new file from content and commit it to SVN', function() {
            this.timeout(0)
            let commitMSG, testfile0, params, testSvn = new remoteSvn()
            after(async () => {await testSvn.clearLocalFiles()})
            before(() => {
                return new Promise(async(resolve) => {
                    params = await testSvn.init(svnConfig)
                    testFile0 = await testSvn.newFile({'sourceText': testStrings[0], 'dest': testFiles[0]})
                    commitMSG = await testSvn.commitFiles({'message': commitMessage})
                    resolve()
                });
            });
            it('The created file`s content is matching the content parameter', async function() {
                const localFIleContent = await fs.readFile(path.resolve(svnConfig.baseFolder, testFiles[0]),'utf8')
                assert.equal(localFIleContent, testStrings[0])
            })
            it('The created file is commited to the remote SVN without an error', async function() {
                const commmitSuccess = commitMSG.revision > params.currentSvnVer
                assert.equal(true, commmitSuccess)
            })
        })
    })
    describe('Step 2 - Download a file or get its content', function() {
        describe('Get test file from the remote SVN', function() {
            const testSvn = new remoteSvn()
            it('expected path should match the returned path', async function() {
                const params = await testSvn.init(svnConfig)
                const returnFilePath = await testSvn.getFile({'filePath': testFiles[0]})
                const expectedPath = path.resolve(svnConfig.baseFolder, testFiles[0])
                const actualPath = path.resolve(returnFilePath)
                assert.equal(actualPath, expectedPath)
            }).timeout(0)
        })
        describe('Get file content of file from remote SVN', function() {
            const testSvn = new remoteSvn()
            after(async () => {await testSvn.clearLocalFiles()})
            it('File content should match downloaded file content', async function() {
                const params = await testSvn.init(svnConfig)
                const testFileContent = await testSvn.getFileContent({'filePath': testFiles[0]})
                const localFIleContent = await fs.readFile(path.resolve(svnConfig.baseFolder, testFiles[0]),'utf8')
                assert.equal(localFIleContent, testFileContent)
            }).timeout(0)
        })
    })
    describe('Step 3 - adding a new file using exsting file', function() {
        describe('Create file from template file', function() {
            this.timeout(0)
            let commitMSG, testfile1, params, testSvn = new remoteSvn()
            before(() => {
                return new Promise(async(resolve) => {
                    params = await testSvn.init(svnConfig)
                    testFile1 = await testSvn.newFile({'sourceFile': testFiles[0], 'dest': testFiles[1]})
                    commitMSG = await testSvn.commitFiles({'message': commitMessage})
                    resolve()
                })
            })
            after(() => {testSvn.clearLocalFiles()})
            it('File created with matching content of given file', async function() {
                const testFileContent = await testSvn.getFileContent({'filePath': testFiles[0]})
                const localFIleContent = await fs.readFile(path.resolve(svnConfig.baseFolder, testFiles[1]),'utf8')
                assert.equal(localFIleContent, testFileContent)
            })
            it('File Created is commited to SVN without error', async function() {
                const commmitSuccess = commitMSG.revision > params.currentSvnVer
                assert.equal(true, commmitSuccess)
            })
        })
        describe('Get both files from the remote SVN', function() {
            const testSvn = new remoteSvn()
            after(async() => {await testSvn.clearLocalFiles()})
            it('Number of requested files should match the number of downloaded files ', async function() {
                const params = await testSvn.init(svnConfig)
                const filesObject = {filePathRevPairs: [{'filePath': testFiles[0]}, {'filePath': testFiles[1]}]}
                const downloadedFilesArray = await testSvn.getFiles(filesObject)
                assert.equal(downloadedFilesArray.length, testFiles.length)
            }).timeout(0)
            it('Number of requested files should match number of files in directory', async function() {
                const dirData = await countFilesP(path.resolve(svnConfig.baseFolder))
                assert.equal(testFiles.length, dirData.files)
            }).timeout(0)
        })
    })
    describe('Step 4 - Delete files from svn', function() {
        it('Files Should be deleted from the remote SVN without errors', async function() {
            const testSvn = new remoteSvn()
            const params = await testSvn.init(svnConfig)
            const testFileContent = await testSvn.deleteFiles({filePaths: [testFiles[0], testFiles[1]], message: commitMessage})
        }).timeout(0)
    })
});