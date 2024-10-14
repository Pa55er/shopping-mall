import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const uri = process.env.MONGO_URI;
const client = new MongoClient(uri);

async function connectDB() {
    try {
        await client.connect();
        console.log("DB 연결 성공");
        return client;
    } catch (err) {
        console.error("DB 연결 실패", err);
        process.exit(1);
    }
}

export default connectDB;
