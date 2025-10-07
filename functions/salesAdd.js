const express = require("express");
const router = express.Router();
const connection = require("../database_connection/connection");

router.post("/sl", async (req, res) => {
  let { customer_id, itemSelect, quantity } = req.body; // get form data
  const con = await connection();
  const quan = quantity;
  try {
    const [itemData] = await con.execute(
      `select ?,sum(stock_added) as stock from item_record group by item_id having sum(stock_added) >0
      `,
      [itemSelect]
    );

    const [item_p] = await con.execute(
      ` select price from item_record where item_id= ? order by date_added desc limit 1;
        `,
      [itemSelect]
    )

    if (itemData.length === 0) {
      return res.status(400).send("out of stock");
    }
    console.log(itemData[0].stock_added);
    if (itemData[0].stock< quantity) {
      return res.status(400).send("out of stock");
    }

    const price = item_p[0].price;
    const total = price * quantity;
    console.log(total);

    // updating stock
    while(quantity > 0) {
      const [rows] = await con.execute(
        `SELECT stock_added, id FROM item_record WHERE stock_added > 0 AND item_id = ? LIMIT 1`,
        [itemSelect]
      );
      if (!rows.length) break;

      const { stock_added, id } = rows[0];

      if (quantity >= stock_added) {
        quantity -= stock_added;
        await con.execute(`UPDATE item_record SET stock_added = 0 WHERE id = ?`, [id]);
      } 
      else {

        await con.execute(`UPDATE item_record SET stock_added = ? WHERE id = ?`, [stock_added - quantity, id]);
        quantity = 0;
      }
    }

     console.log(quantity);
    await con.execute(
      "INSERT INTO sales (customer_id,item_id,quantity,price) VALUES (?, ?, ?, ?)",
      [customer_id, itemSelect, quan, total]
    );


    res.redirect("/sales");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
