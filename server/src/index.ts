import express, { Express, Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';


dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5001;

app.use(cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    credentials: true,
}));

app.use(express.json());


const mongoUri = process.env.MONGO_URI;

if (!mongoUri) {
  console.error("FATAL ERROR: MONGO_URI is not defined in the .env file.");
  process.exit(1);
}

mongoose.connect(mongoUri)
  .then(() => console.log("MongoDB connected successfully."))
  .catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });


app.get('/', (req: Request, res: Response) => {
  res.status(200).json({ message: 'Note-Taking API is running smoothly!' });
});


app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


app.listen(port, () => {
  console.log(`Server is listening on http://localhost:${port}`);
});
