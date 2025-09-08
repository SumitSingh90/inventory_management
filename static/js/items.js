document.getElementById("itemForm").addEventListener("submit", async (e) => {
    
    const item_id= document.getElementById("itemId").value;
    const item_name = document.getElementById("itemName").value;
    const category = document.getElementById("itemCategory").value;
    const price = parseInt(document.getElementById("itemPrice").value);
    const stock_add = parseInt(document.getElementById("stockAdded").value);
    try {
        const response = await fetch("http://localhost:3000/add-items/product", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({item_id,item_name,category,price,stock_add})
        });

        const data = await response.json();
        console.log(data);
    } catch (error) {
        console.error("Error:", error);
    }
  });

