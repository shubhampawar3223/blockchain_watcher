const express = require("express")
const cors = require('cors')
require('dotenv').config()
const db = require("./models")
const ethers = require('ethers')
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())


//connecting to the db.
db.sequelize.sync().then(async () => {
    app.listen(PORT, () => {
        console.log(`Server is listening on ${PORT}`)
    })

    //provider creation
    let provider = new ethers.providers.InfuraProvider("kovan")

    //hdwallet
    let hdWallet = ethers.utils.HDNode.fromMnemonic(process.env.mnemonic_key)

    //creating 100 addresses
    let promises = []
    for (i = 0; i < 100; i++) {
        promises.push(db.Address.create(
            { address: hdWallet.derivePath(process.env.basepathstr + i.toString()).address }
        ))
    }

    //Storing addresses to the database. 

    Promise.all(promises).then(() => {
        console.log("Address created successfully")
    })
        .catch(error => {
            console.log(error)
        })

    //creating new instance of the wallet
    let newWallet = new ethers.Wallet(hdWallet.privateKey)
    //connecting newWallet to provider network
    let wallet = newWallet.connect(provider)

    console.log(hdWallet)
    let currBlockNo, prevBlockNo
    let lastBlockRecorded = await db.Block.findOne({
        limit: 1,
        order: [['createdAt', 'DESC']]
    })
    if (lastBlockRecorded) {
        let getLastBlock = await provider.getBlock(lastBlockRecorded.block_hash)
        if (getLastBlock.number +1 < parseInt(await provider.getBlockNumber())) {
            currBlockNo = parseInt(getLastBlock.number) + 1
        }
    }


    //below code checks the newly created blocks 
     setInterval(async () => {
        try {
            let processCount = 0
            if (!currBlockNo) {
                currBlockNo = parseInt(await provider.getBlockNumber())
            }
            if (currBlockNo !== prevBlockNo) {
                console.log("currBlockNo", currBlockNo, "prevBlockNo", prevBlockNo)
                let block = await provider.getBlockWithTransactions(currBlockNo)
                if (block.transactions.length) {
                    await Promise.all(
                        block.transactions.map(async (transaction) => {
                            let validAddress = await db.Address.findOne({
                                where: {
                                    address: transaction.to
                                }
                            })
                            if (validAddress) {
                                await db.Transaction.create({
                                    transaction_hash: transaction.hash,
                                    fromAddress: transaction.from,
                                    toAddress: transaction.to,
                                    amount: transaction.value.toBigInt(),
                                    timestamp: block.timestamp
                                })
                            }
                            processCount++
                        })
                    )
                }
                await db.Block.create({
                    block_hash: block.hash,
                    parent_hash: block.parentHash,
                    timestamp: block.timestamp,
                    process: processCount
                })
            }
            prevBlockNo = currBlockNo
            if (currBlockNo + 1 < parseInt(await provider.getBlockNumber())) {
                currBlockNo += 1
            }
        }
        catch (error) {
            throw new Error(error.message)
        }

    }, 5000)
})

