const mysql = require("mysql2/promise");

async function connector(){
    try{
    const connection = await mysql.createConnection({
    host:"localhost",
    port:3306,
    user:"root",
    password:"sumit@rot",
    database:"vendor"
});
    console.log("database connected")
    return connection; 
    }
    catch(err){
        console.log(err);
    }
}


module.exports = connector;