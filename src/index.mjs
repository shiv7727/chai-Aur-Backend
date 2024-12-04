import dotenv from "dotenv";
dotenv.config();
import connectDB from "./db/index.mjs";
import { app } from "./app.mjs";

connectDB()
  .then(() => {
    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.log("Error in connecting to database", err);
  });
