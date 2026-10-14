/* =========================================================
   GIỎ HÀNG - CART DRAWER
   ========================================================= */

// Dữ liệu mẫu giỏ hàng
let cartState = [
  {
    id: 1,
    name: 'Bóng Cao Su Phát Tiếng Kêu Cho Cún',
    price: 30000,
    qty: 1,
    selected: true
  },
  {
    id: 2,
    name: 'Bàn Cào Móng Mèo Bằng Bìa Carton',
    price: 75000,
    qty: 1,
    selected: true
  }
];


/* =========================================================
   RENDER GIỎ HÀNG
   ========================================================= */

function renderCart() {
  const cartList = document.getElementById('cartList');
  const selectAllInput = document.getElementById('selectAllCart');

  if (!cartList) return;

  // Nếu giỏ hàng trống
  if (cartState.length === 0) {
    cartList.innerHTML = `
      <div class="empty-cart">
        🛒 Giỏ hàng đang trống
      </div>
    `;

    if (selectAllInput) {
      selectAllInput.checked = false;
    }

    updateCartSummary();
    return;
  }

  // Kiểm tra xem tất cả sản phẩm đã được chọn chưa
  const isAllChecked =
    cartState.length > 0 &&
    cartState.every(item => item.selected);

  if (selectAllInput) {
    selectAllInput.checked = isAllChecked;
  }

  // Render danh sách sản phẩm
  cartList.innerHTML = cartState.map(item => `
    <div class="cart-item ${item.selected ? 'selected' : ''}">

      <input
        type="checkbox"
        class="cart-item-checkbox"
        ${item.selected ? 'checked' : ''}
        onchange="toggleSelectItem(${item.id}, this.checked)"
      >

      <div class="cart-item-info">

        <div class="cart-item-title">
          ${escapeHtml(item.name)}
        </div>

        <div class="cart-item-price">
          ${money(item.price)}
        </div>

        <div class="quantity-control">

          <button
            type="button"
            onclick="changeQuantity(${item.id}, -1)"
            aria-label="Giảm số lượng"
          >
            −
          </button>

          <span>${item.qty}</span>

          <button
            type="button"
            onclick="changeQuantity(${item.id}, 1)"
            aria-label="Tăng số lượng"
          >
            +
          </button>

        </div>

        <div class="item-subtotal">
          Thành tiền:
          <strong>${money(item.price * item.qty)}</strong>
        </div>

      </div>

      <button
        type="button"
        class="remove-cart-item"
        onclick="removeCartItem(${item.id})"
        aria-label="Xóa sản phẩm"
        title="Xóa sản phẩm"
      >
        🗑️
      </button>

    </div>
  `).join('');

  updateCartSummary();
}


/* =========================================================
   CHỌN / BỎ CHỌN SẢN PHẨM
   ========================================================= */

window.toggleSelectItem = function(id, isChecked) {

  const item = cartState.find(i => i.id === id);

  if (!item) return;

  item.selected = isChecked;

  renderCart();
};


/* =========================================================
   CHỌN TẤT CẢ
   ========================================================= */

window.toggleSelectAllCart = function(isChecked) {

  cartState.forEach(item => {
    item.selected = isChecked;
  });

  renderCart();
};


/* =========================================================
   TĂNG / GIẢM SỐ LƯỢNG
   ========================================================= */

window.changeQuantity = function(id, change) {

  const item = cartState.find(i => i.id === id);

  if (!item) return;

  item.qty += change;

  // Không cho số lượng nhỏ hơn 1
  if (item.qty < 1) {
    item.qty = 1;
  }

  renderCart();
};


/* =========================================================
   XÓA SẢN PHẨM
   ========================================================= */

window.removeCartItem = function(id) {

  const item = cartState.find(i => i.id === id);

  if (!item) return;

  const confirmDelete = confirm(
    `Bạn có chắc muốn xóa "${item.name}" khỏi giỏ hàng?`
  );

  if (!confirmDelete) return;

  cartState = cartState.filter(item => item.id !== id);

  renderCart();

  toast('Đã xóa sản phẩm khỏi giỏ hàng.');
};


/* =========================================================
   CẬP NHẬT TỔNG TIỀN
   ========================================================= */

function updateCartSummary() {

  const selectedItems =
    cartState.filter(item => item.selected);

  const total = selectedItems.reduce(
    (sum, item) =>
      sum + (Number(item.price) * Number(item.qty)),
    0
  );

  const totalPriceEl =
    document.getElementById('cartTotalPrice');

  const countEl =
    document.getElementById('selectedCount');

  const checkoutBtn =
    document.getElementById('checkoutBtn');


  // Tổng tiền
  if (totalPriceEl) {
    totalPriceEl.textContent = money(total);
  }


  // Số sản phẩm được chọn
  if (countEl) {
    countEl.textContent = selectedItems.length;
  }


  // Trạng thái nút thanh toán
  if (checkoutBtn) {

    const disabled =
      selectedItems.length === 0;

    checkoutBtn.disabled = disabled;

    checkoutBtn.classList.toggle(
      'disabled',
      disabled
    );
  }
}


/* =========================================================
   MỞ GIỎ HÀNG
   ========================================================= */

window.openCart = function() {

  const cartDrawer =
    document.getElementById('cartDrawer');

  if (!cartDrawer) return;

  // Render lại giỏ hàng trước khi mở
  renderCart();

  cartDrawer.classList.add('open');


  // Overlay
  const overlay =
    document.getElementById('cartOverlay');

  if (overlay) {
    overlay.classList.add('show');
  }
};


/* =========================================================
   ĐÓNG GIỎ HÀNG
   ========================================================= */

window.closeCart = function() {

  const cartDrawer =
    document.getElementById('cartDrawer');

  if (cartDrawer) {
    cartDrawer.classList.remove('open');
  }


  // Overlay
  const overlay =
    document.getElementById('cartOverlay');

  if (overlay) {
    overlay.classList.remove('show');
  }
};


/* =========================================================
   THANH TOÁN
   ========================================================= */

window.processCheckout = function() {

  const selectedItems =
    cartState.filter(item => item.selected);


  // Không có sản phẩm
  if (selectedItems.length === 0) {

    toast(
      'Vui lòng chọn ít nhất 1 sản phẩm để thanh toán!'
    );

    return;
  }


  // Tính tổng tiền
  const total = selectedItems.reduce(
    (sum, item) =>
      sum + (Number(item.price) * Number(item.qty)),
    0
  );


  console.log(
    'Sản phẩm thanh toán:',
    selectedItems
  );

  console.log(
    'Tổng tiền:',
    total
  );


  toast(
    `Đã chọn ${selectedItems.length} sản phẩm. Tổng tiền: ${money(total)}`
  );


  // Sau này nếu có trang thanh toán:
  // window.location.href = 'checkout.html';
};


/* =========================================================
   KHỞI TẠO GIỎ HÀNG
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  renderCart();


  // Click vào overlay để đóng giỏ hàng
  const overlay =
    document.getElementById('cartOverlay');

  if (overlay) {
    overlay.addEventListener(
      'click',
      closeCart
    );
  }

});