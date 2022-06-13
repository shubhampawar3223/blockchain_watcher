module.exports = (sequelize,DataTypes)=>{
    const Block = sequelize.define("Block",{
        id:{
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        }, 
        block_hash: {
            type: DataTypes.STRING,
        },
        parent_hash: {
            type: DataTypes.STRING,
        },
        timestamp:{
            type: DataTypes.DATE,
        },
        process:{
            type: DataTypes.STRING,
        }
    })
    return Block;
}