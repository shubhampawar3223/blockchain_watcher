module.exports = (sequelize,DataTypes)=>{
    const Address = sequelize.define("Address",{
        id:{
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        }, 
        address: {
            type: DataTypes.STRING,
            allowNull:false
        },
    })
    return Address;
}