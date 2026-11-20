
const express = require("express");
const { Pool } = require("pg");
const helmet = require("helmet");

const app = express();

app.use(helmet());
app.use(express.json());

const pool = new Pool({
    host: process.env.DB_HOST || "database",
    port: 5432,
    database: process.env.DB_NAME || "ecommerce",
    user: process.env.DB_USER || "shopuser",
    password: process.env.DB_PASSWORD
});

app.get("/health", async (req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ status: "healthy" });
    } catch {
        res.status(503).json({ status: "database unavailable" });
    }
});

app.get("/api/products", async (req, res) => {
    try {
        const search = `%${req.query.search || ""}%`;

        const result = await pool.query(
            `SELECT id, name, description, price
             FROM products
             WHERE name ILIKE $1
             ORDER BY id`,
            [search]
        );

        res.json(result.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Unable to fetch products" });
    }
});

app.post("/api/orders", async (req, res) => {
    const { items } = req.body;

    if (!Array.isArray(items) || !items.length ||
        items.length > 50) {
        return res.status(400).json({ error: "Invalid order items" });
    }

    const client = await pool.connect();

    try {
        await client.query("BEGIN");

        let total = 0;
        const orderItems = [];

        for (const item of items) {
            const id = Number(item.productId);
            const quantity = Number(item.quantity);

            if (!Number.isInteger(id) ||
                !Number.isInteger(quantity) ||
                quantity < 1 || quantity > 100) {
                throw new Error("Invalid product or quantity");
            }

            const product = await client.query(
                "SELECT id, price FROM products WHERE id = $1",
                [id]
            );

            if (!product.rowCount) {
                throw new Error("Product not found");
            }

            const price = Number(product.rows[0].price);
            total += price * quantity;

            orderItems.push({
                id,
                quantity,
                price
            });
        }

        const order = await client.query(
            "INSERT INTO orders(total) VALUES($1) RETURNING id",
            [total]
        );

        for (const item of orderItems) {
            await client.query(
                `INSERT INTO order_items
                 (order_id, product_id, quantity, price)
                 VALUES($1, $2, $3, $4)`,
                [order.rows[0].id, item.id,
                 item.quantity, item.price]
            );
        }

        await client.query("COMMIT");

        res.status(201).json({
            message: "Order created",
            orderId: order.rows[0].id,
            total
        });

    } catch (error) {
        await client.query("ROLLBACK");
        res.status(400).json({ error: error.message });
    } finally {
        client.release();
    }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, "0.0.0.0", () => {
    console.log(`Backend running on port ${PORT}`);
});

