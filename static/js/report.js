async function generateReport() {
  const fromDate = document.getElementById('fromDate').value;
  const toDate = document.getElementById('toDate').value;

  if (!fromDate || !toDate) {
    alert('Please select both From and To dates.');
    return;
  }

  try {
    const response = await fetch('/report/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fromDate, toDate })
    });

    if (!response.ok) {
      throw new Error('Network response was not ok');
    }

    const data = await response.json();
    console.log('Report Data:', data);

    // Handle case where backend returns no results
    if (!data || data.productInfo.length === 0) {
      alert('No sales data found for this period.');
      document.getElementById('reportSummary').style.display = 'none';
      return;
    }

    // Update summary
    document.getElementById('reportSummary').style.display = 'block';
    document.getElementById('totalSales').innerText = `$${(data.totalSales || 0).toLocaleString()}`;
    document.getElementById('topProduct').innerText = data.topProduct || '-';
    document.getElementById('topCustomer').innerText = data.topCustomer || '-';

    // Fill product table
    const productTable = document.getElementById('productTable');
    productTable.innerHTML = '';

    data.productInfo.forEach(prod => {
      productTable.innerHTML += `
        <tr>
          <td>${prod["Product Name"]}</td>
          <td>${prod["Quantity Sold"]}</td>
          <td>$${Number(prod["Total Value"]).toLocaleString()}</td>
        </tr>
      `;
    });

  } catch (err) {
    console.error('Fetch error:', err);
    alert('Error fetching report data.');
  }
}
