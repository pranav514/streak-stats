import express from "express";
import dotenv from "dotenv"
import streakRoute from "./routes/streakRoute";
import { config } from "./config/envConfig";
config();


const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use('/api/v1' , streakRoute)
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

