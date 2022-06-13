module.exports = (sequelize, DataTypes) => {
    const Transaction = sequelize.define("Transaction", {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        transaction_hash: {
            type: DataTypes.STRING,
        },
        fromAddress: {
            type: DataTypes.STRING,
        },
        toAddress: {
            type: DataTypes.STRING,
        },
        amount: {
            type: DataTypes.STRING,
        },
        timestamp: {
            type: DataTypes.STRING,
        }
    })
    return Transaction;
}