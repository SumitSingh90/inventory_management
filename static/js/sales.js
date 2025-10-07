document.getElementById("saleForm").addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;
  const data = {
    customer_id: form.customer_id.value,
    itemSelect: form.itemSelect.value,
    quantity: form.quantity.value,
  };

  try {
    const res = await fetch("/add-sale/sl", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const result = await res.json();

    if (!res.ok) {
      alert(result.error || "Something went wrong!");
      return;
    }

    alert("Sale added successfully!");
    window.location.reload();

  } catch (err) {
    console.error(err);
    alert("Server Error");
  }
});
