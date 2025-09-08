const express = require("express");
const router = express.Router();
const connection = require("../database_connection/connection");


router.post("/product",async (req,res)=>{
    const{item_id,item_name:item,category,price,stock_added} = req.body;
    console.log(req.body);
    const con = await connection();
    try{
        const [row] = await con.execute("select * from item where item_id = ?",[item_id]);
        if(row.length ===0){
            await con.execute("insert into item values(?,?,?)",[item_id,item,category]);
            
        }
           await con.execute(
            "INSERT INTO item_record (item_id, stock_added, price) VALUES (?, ?, ?)",
                [item_id,stock_added, price]
            );


        res.redirect("/items");
    }
    catch(err){
        console.error(err);
         res.json("error occured");
    }   
    
});

module.exports = router;