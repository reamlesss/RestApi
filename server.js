const express = require("express");
const mysql = require("mysql2");
const bodyParser = require("body-parser");
const path = require("path");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(bodyParser.json());

// Serve static files from the "public" directory
app.use(express.static(path.join(__dirname, "public")));

// JWT secret key
const JWT_SECRET = "0Wg11ndyhI+WpHVYSCT6jxrcC2OPabIcMf/4A8Ip7ug="; // Make this secure in production

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "trapovejgulas",
  database: "blog_db",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL Database!");
});

// User Registration
app.post("/register", async (req, res) => {
  console.log("Registeing");
  const { username, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);

  const sql = "INSERT INTO users (username, password) VALUES (?, ?)";
  db.query(sql, [username, hashedPassword], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).send({ message: "User registered" });
  });
});

// User Login and generate JWT token
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  const sql = "SELECT * FROM users WHERE username = ?";
  db.query(sql, [username], async (err, result) => {
    if (err || result.length === 0)
      return res.status(401).send({ message: "Invalid credentials" });

    const user = result[0];
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      return res.status(401).send({ message: "Invalid credentials" });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.send({ message: "Logged in successfully", token });
  });
});

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(401).send({ message: "No token provided" });

  // Verify token
  jwt.verify(token.split(" ")[1], JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).send({ message: "Invalid token" });
    req.user = decoded;
    next();
  });
};

// Protected route example
app.get("/protected", verifyToken, (req, res) => {
  res.send({
    message: `Welcome, ${req.user.username}. You are authenticated!`,
  });
});

// Blog APIs (only protected routes are restricted to authenticated users)
app.post("/blog", verifyToken, (req, res) => {
  const { content, author } = req.body;
  const date = new Date();
  const sql =
    "INSERT INTO blog_posts (content, author, created_at) VALUES (?, ?, ?)";
  db.query(sql, [content, author, date], (err, result) => {
    if (err) return res.status(500).send(err);
    res.status(201).send({ id: result.insertId });
  });
});

app.get("/blog", verifyToken, (req, res) => {
  const sql = "SELECT * FROM blog_posts";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).send(err);
    res.send(results);
  });
});

app.get("/blog/:id", (req, res) => {
  const { id } = req.params;
  const sql = "SELECT * FROM blog_posts WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.length === 0)
      return res.status(404).send({ error: "Post not found" });
    res.send(result[0]);
  });
});

app.delete("/blog/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM blog_posts WHERE id = ?";
  db.query(sql, [id], (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.affectedRows === 0)
      return res.status(404).send({ error: "Post not found" });
    res.send({ message: "Post deleted" });
  });
});

app.patch("/blog/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const fields = [];
  const values = [];
  for (let [key, value] of Object.entries(req.body)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  const sql = `UPDATE blog_posts SET ${fields.join(", ")} WHERE id = ?`;
  values.push(id);
  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).send(err);
    if (result.affectedRows === 0)
      return res.status(404).send({ error: "Post not found" });
    res.send({ message: "Post updated" });
  });
});

// Start the server
app.listen(3001, () => {
  console.log("Website and API are running on http