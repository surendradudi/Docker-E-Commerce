
const API = "/api";

let cart = [];

async function loadProducts() {
    const search = document.getElementById("search").value;

    const response = await fetch(
        `${API}/products?search=${encodeURIComponent(search)}`
    );

    const products = await response.json();

    document.getElementById("products").innerHTML =
        products.map(product => `
            <div class="product">
                <h3>${escapeHTML(product.name)}</h3>
                <p>${escapeHTML(product.description || "")}</p>
                <p>Price: ₹${Number(product.price).toFixed(2)}</p>
                <button onclick="addToCart(${product.id})">
                    Add to Cart
                </button>
            </div>
        `).join("");
}

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

async function addToCart(id) {
    const response = await fetch(`${API}/products`);
    const products = await response.json();
    const product = products.find(p => p.id === id);

    if (!product) return;

    const existing = cart.find(item => item.id === id);

    if (existing) {
        existing.quantity++;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    renderCart();
}

function renderCart() {
    document.getElementById("cartCount").textContent =
        cart.reduce((sum, item) => sum + item.quantity, 0);

    document.getElementById("cart").innerHTML =
        cart.map(item => `
            <p>${escapeHTML(item.name)} x ${item.quantity}
            = ₹${(item.price * item.quantity).toFixed(2)}</p>
        `).join("");
}

async function checkout() {
    if (!cart.length) {
        alert("Your cart is empty");
        return;
    }

    const response = await fetch(`${API}/orders`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            items: cart.map(item => ({
                productId: item.id,
                quantity: item.quantity
            }))
        })
    });

    const result = await response.json();

    if (!response.ok) {
        document.getElementById("message").textContent =
            result.error || "Order failed";
        return;
    }

    document.getElementById("message").textContent =
        `Order placed successfully! Order ID: ${result.orderId}`;

    cart = [];
    renderCart();
}

loadProducts();

