document.addEventListener('DOMContentLoaded', function() {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get('product');
  if (!productId) return;

  fetch(`http://localhost:8000/api/products/${productId}/`)
    .then(res => res.json())
    .then(product => {
      // Main image
      document.getElementById('ProductImg').src = product.cover_image;

      // Details
      document.getElementById('productCategory').textContent = `Home / ${product.category_name || ''}`;
      document.getElementById('productTitle').textContent = product.title;
      document.getElementById('productPrice').textContent = `$${product.price}`;
      document.getElementById('productDescription').innerHTML = product.details || '';

      // Populate size and color dropdowns from sub_products
      const sizeSet = new Set();
      const colorSet = new Set();
      if (product.sub_products && product.sub_products.length) {
        product.sub_products.forEach(sub => {
          if (sub.size) sizeSet.add(sub.size);
          if (sub.color) colorSet.add(sub.color);
        });
      }
      const sizeSelect = document.getElementById('sizeSelect');
      sizeSelect.innerHTML = '<option>Select Size</option>';
      sizeSet.forEach(size => {
        sizeSelect.innerHTML += `<option>${size}</option>`;
      });

      const colorSelect = document.getElementById('colorSelect');
      colorSelect.innerHTML = '<option>Select Color</option>';
      colorSet.forEach(color => {
        colorSelect.innerHTML += `<option>${color}</option>`;
      });

      // Show subproduct images as thumbnails
      const thumbContainer = document.getElementById('productThumbnails');
      thumbContainer.innerHTML = '';
      if (product.sub_products && product.sub_products.length) {
        product.sub_products.forEach(sub => {
          [sub.image1, sub.image2, sub.image3].forEach(img => {
            if (img) {
              const thumbDiv = document.createElement('div');
              thumbDiv.className = 'small-img-col';
              thumbDiv.innerHTML = `<img src="${img}" class="small-img" style="cursor:pointer;">`;
              thumbDiv.querySelector('img').onclick = function() {
                document.getElementById('ProductImg').src = img;
              };
              thumbContainer.appendChild(thumbDiv);
            }
          });
        });
      }
    });
});

document.getElementById('addToCartBtn').onclick = function() {
  const productId = new URLSearchParams(window.location.search).get('product');
  const size = document.getElementById('sizeSelect').value;
  const color = document.getElementById('colorSelect').value;
  const qty = parseInt(document.getElementById('quantityInput').value, 10) || 1;

  if (size === "Select Size" || color === "Select Color") {
    alert("Please select size and color.");
    return;
  }

  let cart = JSON.parse(localStorage.getItem('cart')) || [];
  const existing = cart.find(item => item.id == productId && item.size === size && item.color === color);
  if (existing) {
    existing.qty += qty;
  } else {
    cart.push({ id: productId, size, color, qty });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  window.location.href = "cart.html";
};