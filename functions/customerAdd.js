const express = require("express");
const router = express.Router();
const connection = require("../database_connection/connection");

router.post("/cust", async (req, res) => {
  const { name, contact } = req.body;
  const con = await connection();

  try {
    
    const [existing] = await con.execute(
      "SELECT * FROM customer WHERE name = ? AND mobile = ?",
      [name, contact]
    );

    if (existing.length > 0) {
    
      return res.status(400).json({ message: "Customer already exists" });
    }

   
    const [result] = await con.execute(
      "INSERT INTO customer(name, mobile) VALUES(?, ?)",
      [name, contact]
    );

    
    res.redirect("/customers");

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


module.exports = router;