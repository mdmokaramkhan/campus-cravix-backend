import app from "./app.js";
import connectDB from "./config/db.js";

const PORT = process.env.PORT || 3000;

// Connect MongoDB
connectDB()

app.listen(PORT, () => {
    console.log(`✅ Server started and running on PORT : ${PORT}`)
})

