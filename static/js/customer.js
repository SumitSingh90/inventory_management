// /js/customers.js

document.addEventListener('DOMContentLoaded', () => {
  const customerForm = document.getElementById('customerForm');

  customerForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent default form submission

    // Get form data
    const customerData = {
      name: document.getElementById('customerName').value,
      contact: document.getElementById('customerContact').value,
    };

    try {
      // Send data to server
      const response = await fetch('http://localhost:3000/add-customers/cust', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(customerData)
      });

      if (!response.ok) throw new Error('Failed to add customer');

      const result = await response.json();
      console.log('Customer added:', result);

      // Optionally clear the form
      customerForm.reset();
    } catch (err) {
      console.error('Error submitting form:', err);
      alert('Failed to add customer.');
    }
  });
});
