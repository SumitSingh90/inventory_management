const express = require("express");
const path = require("path");
const bodyParser = require('body-parser');
const connection = require("./database_connection/connection");
const app = express();

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(express.static(path.join(__dirname, "static")));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

//database connection

// importing routes
const items_add = require("./functions/itemAdd");
const customer_add = require("./functions/customerAdd");
const sales_add = require("./functions/salesAdd");

app.use("/add-items", items_add);
app.use("/add-customer", customer_add);
app.use("/add-sale", sales_add);

app.get("/", async (req, res) => {

  const con = await connection();
  const [sales] = await con.execute(`
  SELECT 
      s.sale_id,
      s.s_date AS date,
      c.name AS customer,
      i.item_name AS item,
      s.quantity,
      s.price AS total
  FROM sales s
  LEFT JOIN customer c ON s.customer_id = c.customer_id
  LEFT JOIN item i ON s.item_id = i.item_id
  ORDER BY s.s_date DESC limit 10;

`);


  let [total] = await con.execute(`
                  SELECT sum(price) as month_total
                  FROM sales
                  WHERE YEAR(s_date) = YEAR(CURDATE())
                  AND MONTH(s_date) = MONTH(CURDATE());
  `);

  let [today] = await con.execute(`
SELECT COALESCE(SUM(price), 0) AS today_sale
FROM sales
WHERE DATE(s_date) = CURDATE();  `);

  let [customer] = await con.execute(`
      select  name ,sum(price)
       from sales left join customer 
       on sales.customer_id = customer.customer_id
       group by name order by sum(price) desc limit 1 ;
  `);
  if(customer.length ==0) cus_name= "---";
  else cus_name = customer[0].name;


  res.render("home", { sales, total, today,cus_name });
})



app.get("/items", async (req, res) => {
  const con = await connection();
  const [result] = await con.execute(`
  WITH total_stock AS (
    SELECT item_id, SUM(stock_added) AS total_stock
    FROM item_record
    GROUP BY item_id
),
latest_record AS (
    SELECT ir1.item_id, ir1.price AS latest_price, ir1.date_added AS latest_date
    FROM item_record ir1
    INNER JOIN (
        SELECT item_id, MAX(date_added) AS max_date
        FROM item_record
        GROUP BY item_id
    ) AS t ON ir1.item_id = t.item_id AND ir1.date_added = t.max_date
)
SELECT 
    i.item_id,
    i.item_name,
    i.category,
    IFNULL(ts.total_stock, 0) AS total_stock,
    lr.latest_price,
    lr.latest_date
FROM item i
LEFT JOIN total_stock ts ON i.item_id = ts.item_id
LEFT JOIN latest_record lr ON i.item_id = lr.item_id
ORDER BY i.item_name;

`);

  res.render("items", { items: result });

})

app.get("/sales", async (req, res) => {
  const con = await connection();

  try {
    // Fetch items
    const [items] = await con.execute("SELECT item_name, item_id FROM item");

    // Fetch customers (id and name)
    const [customers] = await con.execute(
      "SELECT customer_id, name FROM customer"
    );

    const [sales] = await con.execute(`
  SELECT 
      s.sale_id,
      s.s_date AS date,
      c.name AS customer,
      i.item_name AS item,
      s.quantity,
      s.price AS total
  FROM sales s
  LEFT JOIN customer c ON s.customer_id = c.customer_id
  LEFT JOIN item i ON s.item_id = i.item_id
  ORDER BY s.s_date DESC;
`);
      console.log(sales);
    // Render the sales page with items and customers
    res.render("sales", { items, customers, sales });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});




app.get("/customers", async (req, res) => {
  const con = await connection();

  try {
    const [customers] = await con.execute(
      "SELECT customer_id, name, mobile FROM customer"
    );

    // Render EJS view and pass customers
    res.render('customer', { customers });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
})

app.get("/report", (req, res) => {
  res.render("report");
})

app.post('/report/data', async (req, res) => {
  const con = await connection();
  try {
    const { fromDate, toDate } = req.body;

    if (!fromDate || !toDate) {
      return res.status(400).json({ error: 'Missing date range' });
    }

    // Run all your queries
    const [totalSalesResult] = await con.query(
      `SELECT SUM(price) AS totalSales 
       FROM sales 
       WHERE s_date BETWEEN ? AND ?`, [fromDate, toDate]
    );

    const [topProductResult] = await con.query(
      `SELECT item_name 
       FROM (
         SELECT SUM(quantity) AS q, sales.item_id, item_name 
         FROM sales 
         INNER JOIN item ON sales.item_id = item.item_id
         WHERE s_date BETWEEN ? AND ?
         GROUP BY sales.item_id
       ) AS s 
       ORDER BY q DESC 
       LIMIT 1`, [fromDate, toDate]
    );

    const [topCustomerResult] = await con.query(
      `SELECT name 
       FROM (
         SELECT SUM(price) AS p, sales.customer_id, name 
         FROM sales 
         INNER JOIN customer ON sales.customer_id = customer.customer_id
         WHERE s_date BETWEEN ? AND ?
         GROUP BY sales.customer_id
       ) AS s 
       ORDER BY p DESC 
       LIMIT 1`, [fromDate, toDate]
    );

    const [productInfo] = await con.query(
      `SELECT item_name AS "Product Name", 
              SUM(quantity) AS "Quantity Sold", 
              SUM(price) AS "Total Value"
       FROM sales 
       INNER JOIN item ON sales.item_id = item.item_id
       WHERE s_date BETWEEN ? AND ?
       GROUP BY item_name`, [fromDate, toDate]
    );

    res.json({
      totalSales: totalSalesResult[0]?.totalSales || 0,
      topProduct: topProductResult[0]?.item_name || null,
      topCustomer: topCustomerResult[0]?.name || null,
      productInfo
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database query failed' });
  }
});



app.listen(5000, "0.0.0.0", (err) => {
  console.log("server is running at http//localhost:5000");
});
