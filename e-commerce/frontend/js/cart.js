document.addEventListener('DOMContentLoaded', function() {
  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const cartBody = document.getElementById('cartBody');
  const subtotalAmount = document.getElementById('subtotalAmount');
  const taxAmount = document.getElementById('taxAmount');
  const totalAmount = document.getElementById('totalAmount');
  if (cart.length === 0) {
    cartBody.innerHTML = `<tr><td colspan="4">Your cart is empty.</td></tr>`;
    subtotalAmount.textContent = "$0.00";
    taxAmount.textContent = "$0.00";
    totalAmount.textContent = "$0.00";
    return;
  }

  Promise.all(cart.map(item =>
    fetch(`http://localhost:8000/api/products/${item.id}/`).then(res => res.json())
  )).then(products => {
    let subtotal = 0;
    cartBody.innerHTML = products.map((product, idx) => {
      const item = cart[idx];
      const price = parseFloat(product.price);
      const itemSubtotal = price * item.qty;
      subtotal += itemSubtotal;
      return `
        <tr data-index="${idx}">
          <td>
            <div class="cart-info">
              <img src="${product.cover_image}" width="80" />
              <div>
                <p>${product.title}</p>
                <small>Price: $${price.toFixed(2)}</small><br />
                <span>Size: ${item.size || '-'}</span><br />
                <span>Color: ${item.color || '-'}</span>
              </div>
            </div>
          </td>
          <td>
            <input type="number" min="1" value="${item.qty}" class="cart-qty" style="width:50px;">
          </td>
          <td>$${itemSubtotal.toFixed(2)}</td>
          <td>
            <button class="remove-btn">Remove</button>
          </td>
        </tr>
      `;
    }).join('');

    // Update totals
    const tax = subtotal * 0.02; // 2% tax
    const total = subtotal + tax;
    subtotalAmount.textContent = `$${subtotal.toFixed(2)}`;
    taxAmount.textContent = `$${tax.toFixed(2)}`;
    totalAmount.textContent = `$${total.toFixed(2)}`;

    // Save tax to localStorage immediately
    localStorage.setItem('cart_tax', tax);

    // Remove item
    cartBody.querySelectorAll('.remove-btn').forEach((btn, idx) => {
      btn.onclick = function() {
        cart.splice(idx, 1);
        localStorage.setItem('cart', JSON.stringify(cart));
        location.reload();
      };
    });

    // Update quantity
    cartBody.querySelectorAll('.cart-qty').forEach((input, idx) => {
      input.onchange = function() {
        cart[idx].qty = parseInt(this.value, 10) || 1;
        localStorage.setItem('cart', JSON.stringify(cart));
        location.reload();
      };
    });

    // Place order
    document.getElementById('placeOrderBtn').onclick = function() {
      localStorage.setItem('cart_tax', tax); // Save tax to localStorage
      window.location.href = "payment-methods.html";
    };
  });
});