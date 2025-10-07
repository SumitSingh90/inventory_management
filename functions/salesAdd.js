const express = require("express");
const router = express.Router();
const connection = require("../database_connection/connection");

router.post("/sl", async (req, res) => {
  let { customer_id, itemSelect, quantity } = req.body;
  const con = await connection();
  const quan = Number(quantity);

  try {
    // Check available stock
    const [itemData] = await con.execute(
      `SELECT item_id, SUM(stock_added) AS stock 
       FROM item_record 
       WHERE item_id = ? 
       GROUP BY item_id 
       HAVING SUM(stock_added) > 0`,
      [itemSelect]
    );


    if (itemData.length === 0) {
      return res.status(400).json({ error: "Out of stock" });
    }

    const stockAvailable = Number(itemData[0].stock);

    if (stockAvailable < quan) {
      return res.status(400).json({ error: "Out of stock" });
    }

    // Get latest price
    const [item_p] = await con.execute(
      `SELECT price FROM item_record 
       WHERE item_id = ? 
       ORDER BY date_added DESC LIMIT 1`,
      [itemSelect]
    );

    const price = Number(item_p[0].price);
    const total = price * quan;
total[0].month_total
    // Deduct stock
    let remaining = quan;
    while (remaining > 0) {
      const [rows] = await con.execute(
        `SELECT stock_added, id 
         FROM item_record 
         WHERE stock_added > 0 AND item_id = ? 
         ORDER BY date_added ASC
         LIMIT 1`,
        [itemSelect]
      );

      if (!rows.length) break;

      let stockNum = Number(rows[0].stock_added);
      const id = rows[0].id;

      if (remaining >= stockNum) {
        remaining -= stockNum;
        await con.execute(`UPDATE item_record SET stock_added = 0 WHERE id = ?`, [id]);
      } else {
        await con.execute(
          `UPDATE item_record SET stock_added = ? WHERE id = ?`,
          [stockNum - remaining, id]
        );
        remaining = 0;
      }
    }

    // Insert sale record
    await con.execute(
      "INSERT INTO sales (customer_id, item_id, quantity, price) VALUES (?, ?, ?, ?)",
      [customer_id, itemSelect, quan, total]
    );

    res.json({ success: true });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
});

module.exports = router;
