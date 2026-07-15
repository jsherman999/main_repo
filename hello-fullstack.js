// A complete full stack app: database → backend API → frontend SPA. Run: node hello-fullstack.js
import { DatabaseSync } from "node:sqlite";
import { createServer } from "node:http";
const db = new DatabaseSync(":memory:");
db.exec("CREATE TABLE greetings(text); INSERT INTO greetings VALUES('hello world')");
createServer((req, res) => res.end(req.url === "/api"
  ? db.prepare("SELECT text FROM greetings").get().text
  : "<script>fetch('/api').then(r => r.text()).then(t => document.body.textContent = t)</script>"
)).listen(3000, () => console.log("full stack deployed at http://localhost:3000"));
