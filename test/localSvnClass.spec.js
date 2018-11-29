const assert    = require('assert')
const localSvn   = require('../modules/LocalSvnClass')

/* Edit these to test */
logger =  {
    info:(str)=>{console.log("[INFO]", str)},
    error:(str)=>{console.error("[ERROR]", str)},
    debug:(str)=>{console.warn("[DEBUG]", str)}
}
const creds = {
    username: "__SVN_USER__",
    password: "__SVN_PASS__"
}
const baseFolder = "__WHERE_LOCAL_FILES_SHOULD_BE_STORED__"
const baseURL =  "__SVN_URL__"
const checkoutFolders = ['__SVN_FOLDER1__', '__SVN_FOLDER2__', '...']

const svnConfig   = {baseFolder, baseURL, logger, creds}

/* Use: npm run test-local */
describe('RemoteSvnClass',function(){
    const testSvn = new localSvn();
    let params;
    describe('Initialize SVN with remote URL',function(){
        it('RemoteSvn initialization should finish without errors',async function(){
            params = await testSvn.init(svnConfig)
        }).timeout(0)
    })
    describe('Step 1 - checkout',function(){
        describe("Checkout a folder",function(){
            it('checkout finished without errors',async function(){
                checkoutResult1 = await testSvn.checkoutFolder({"folderPath":checkoutFolders[0]})
                checkoutResult2 = await testSvn.checkoutFolder({"folderPath":checkoutFolders[1]})
                assert.equal(checkoutResult1, true)
                assert.equal(checkoutResult2, true)
            }).timeout(0)
        })
    })
    describe('Step 2 - update',function(){
        describe('update a folder',function(){
            it('should finish update wihout errors',async function(){
                updateResult = await testSvn.updateFolders({"foldersPaths":checkoutFolders})
                assert.equal(updateResult, true)
            }).timeout(0)
        })
    })
    describe('Step 3 - pristine',function(){
        describe('pristine working copy',function(){
            it('should finish update wihout errors',async function(){
                updateResult = await testSvn.pristine()
                assert.equal(updateResult, true)
            }).timeout(0)
        })
    })
    describe('Step 4 - delete',function(){
        describe('delete local copy',function(){
            it('should finish update wihout errors',async function(){
                deleteResults = await testSvn.clearLocalFiles()
                assert.equal(updateResult, true)
            }).timeout(0)
        })
    })
});