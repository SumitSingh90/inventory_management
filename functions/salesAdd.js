const express = require("express");
const router = express.Router();
const connection = require("../database_connection/connection");

router.post("/sl", async (req, res) => {
  const { customer_id,itemSelect, quantity } = req.body; // get form data
  const con = await connection();

  try {
    const [itemData] = await con.execute(
  "SELECT * FROM item_record WHERE item_id = ? and stock_added>0 ORDER BY date_added LIMIT 1",
  [itemSelect]
);

    if (itemData.length === 0) {
      return res.status(400).send("out of stock");
    }
    console.log(itemData[0].stock_added);
    if(itemData[0].stock_added<quantity){
      return res.status(400).send("out of stock");
    }
    
    const price = itemData[0].price;
    const total = price * quantity;
    console.log(total);

    await con.execute(`update item_record ,
  (select id from item_record where item_id = ? and stock_added>0 order by date_added limit 1) as temp
  set item_record.stock_added = item_record.stock_added - ?
  where item_record.id = temp.id`,[itemSelect,quantity]);

    await con.execute(
      "INSERT INTO sales (customer_id,item_id,quantity,price) VALUES (?, ?, ?, ?)",
      [customer_id,itemSelect,quantity,total]
    );

    
    res.redirect("/sales");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
