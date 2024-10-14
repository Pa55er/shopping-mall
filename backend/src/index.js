const express = require("express");
const path = require("path");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();

const PORT = 4000;
// const HOST = "0.0.0.0";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../uploads")));

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("연결 완료");
    })
    .catch((error) => {
        console.dir(error);
    });

app.get("/", (req, res) => {
    res.send("Hello World!222");
});

app.post("/", (req, res) => {
    console.log(req.body);
    res.json(req.body);
});

app.listen(PORT, () => {
    console.log(`${PORT}번에서 실행이 되었습니다.`);
});
