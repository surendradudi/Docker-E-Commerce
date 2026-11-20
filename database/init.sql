
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    price NUMERIC(10,2) NOT NULL CHECK(price >= 0),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    total NUMERIC(12,2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS order_items (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    product_id INTEGER REFERENCES products(id),
    quantity INTEGER NOT NULL CHECK(quantity > 0),
    price NUMERIC(10,2) NOT NULL
);

INSERT INTO products(name, description, price)
VALUES
('Laptop', 'High performance laptop', 55000),
('Mobile Phone', 'Android smartphone', 18000),
('Headphones', 'Wireless headphones', 2500),
('Keyboard', 'Mechanical keyboard', 1500)
ON CONFLICT DO NOTHING;

