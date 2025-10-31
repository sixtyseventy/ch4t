import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import session from "express-session";
import bodyParser from "body-parser";
import fs from "fs-extra";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);
const dataPath = path.join(__dirname, "../data.json");

let data = { users: [], posts: [], announcements: [] };
if (fs.existsSync(dataPath)) data = fs.readJsonSync(dataPath);

app.use(express.static(path.join(__dirname, "../public")));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(
  session({
    secret: "coolchat-secret",
    resave: false,
    saveUninitialized: true
  })
);

function save() {
  fs.writeJsonSync(dataPath, data, { spaces: 2 });
}

// ---------- ROUTES ----------
app.get("/", (req, res) =>
  res.sendFile(path.join(__dirname, "../public/index.html"))
);
app.get("/forum", (req, res) =>
  res.sendFile(path.join(__dirname, "../public/forum.html"))
);

// signup / login / logout
app.post("/signup", (req, res) => {
  const { username, password } = req.body;
  if (data.users.find(u => u.username === username))
    return res.send("Username already exists!");
  data.users.push({ username, password });
  save();
  req.session.user = username;
  res.redirect("/");
});

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = data.users.find(
    u => u.username === username && u.password === password
  );
  if (!user) return res.send("Invalid login!");
  req.session.user = username;
  res.redirect("/");
});

app.post("/logout", (req, res) => {
  req.session.destroy(() => res.redirect("/"));
});

// forum posts
app.post("/forum-post", (req, res) => {
  if (!req.session.user) return res.redirect("/");
  data.posts.push({ author: req.session.user, content: req.body.content });
  save();
  res.redirect("/forum");
});

// announcements
app.post("/announcement", (req, res) => {
  if (req.session.user !== "vorpbleh") return res.send("You can’t do that!");
  data.announcements.push({ author: "vorpbleh", content: req.body.content });
  save();
  res.redirect("/forum");
});

// ---------- SOCKET.IO ----------
io.on("connection", socket => {
  socket.on("chat", msg => io.emit("chat", msg));
});

const port = process.env.PORT || 3000;
httpServer.listen(port, () =>
  console.log(`🔥 CoolChat running on port ${port}`)
);
