import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import bodyParser from 'body-parser'; 
import cors from 'cors';
  
dotenv.config(); 
import connectDB from './Config/db.js';
import { notFound, errorHandler } from './Middleware/errorMiddleware.js';
import studentRoutes from './Routes/studentRoute.js';
import adminRoutes from './Routes/adminRoute.js';
import instructorRoutes from './Routes/instructorRoute.js';
import { socketServer } from './Socket/socket.io.js'; 
connectDB();
const port = 5000;

const app = express();
 
// CORS Configuration
const corsOptions = { 
  origin: 'http://localhost:3000', // Allow requests from your frontend
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Allowed HTTP methods
  credentials: true, // Allow cookies to be sent
  optionsSuccessStatus: 204 // Response status for successful preflight requests
};

app.use(cors(corsOptions));



socketServer.listen(4000,()=>{
  console.log("socket server  connected")
})

// Stripe webhook middleware
app.post('/api/users/webhook', bodyParser.raw({ type: 'application/json' }));

 app.use(cookieParser());
 app.use(express.json());   
 app.use(express.urlencoded({ extended: true }));

 

app.use('/api/users', studentRoutes);
app.use('/api/instructor', instructorRoutes);
app.use('/api/admin', adminRoutes);

app.get("/", (req, res) => { res.send("Server is connected"); });

app.use(notFound);
app.use(errorHandler);

app.listen(port, () => { console.log(`Server is running on http://localhost:5000`); });
