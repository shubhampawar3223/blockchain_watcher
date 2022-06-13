const express = require("express")
const cors = require('cors')
require('dotenv').config()
const db = require("./models")
const ethers = require('ethers')
const { id } = require("ethers/lib/utils")
const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())


//connecting to the db.
db.sequelize.sync({ force: true }).then(async () => {
    app.listen(PORT, () => {
        console.log(`Server is listening on ${PORT}`)
    })

    //provider creation
    let provider = new ethers.providers.InfuraProvider("kovan")

    //hdwallet
    let hdWallet = ethers.utils.HDNode.fromMnemonic(process.env.mnemonic_key)
    console.log("privateKey", hdWallet.privateKey)

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

    //below code checks the newly created blocks 
    setInterval(async () => {
        try {
            let hasValidTransaction = 0
            let processCount = 0
            currBlockNo = parseInt(await provider.getBlockNumber())
            console.log("exact", currBlockNo)
            if (currBlockNo !== prevBlockNo) {
                if (currBlockNo - prevBlockNo > 1) {
                    currBlockNo = prevBlockNo + 1
                }
                console.log("currBlockNo", currBlockNo, "prevBlockNo", prevBlockNo)
                let block = await provider.getBlockWithTransactions(currBlockNo)
                // console.log("transactions", JSON.stringify(block.transactions))
                if (block.transactions.length) {
                    Promise.all(
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
                                processCount++
                                hasValidTransaction = 1
                            }

                            await db.Block.create({
                                block_hash: block.hash,
                                parent_hash: block.parentHash,
                                timestamp: block.timestamp,
                                process: processCount
                            })
                        })
                    )
                }
            }
            prevBlockNo = currBlockNo
        }
        catch (error) {
            throw new Error(error.message)
        }

    }, 5000)
})

