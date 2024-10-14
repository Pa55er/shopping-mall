import express from "express";
import path from "path";
import { fileURLToPath } from "url";
const app = express();
import cors from "cors";
import connectDB from "./config/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 4000;
// const HOST = "0.0.0.0";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "../uploads")));

async function start() {
    const client = await connectDB();
    app.listen(PORT, () => {
        console.log(`${PORT}번에서 실행이 되었습니다.`);
    });

    process.on("SIGINT", async () => {
        try {
            await client.close();
            console.log("정상 DB 연결 종료");
            process.exit(0);
        } catch (err) {
            console.error("오류에 의한 DB 연결 종료", err);
            process.exit(1);
        }
    });
}
start();

app.get("/", (req, res) => {
    res.send("Hello World!222");
});

app.post("/", (req, res) => {
    console.log(req.body);
    res.json(req.body);
});
