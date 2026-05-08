const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();

// Middleware setup: allow cross-origin requests and parse JSON bodies
app.use(cors());
app.use(express.json());

// connect routers
const userRoutes = require('./routes/user.routes');
const authRoutes = require('./routes/auth.routes');
const workspaceRoutes = require('./routes/workspace.routes');

app.use('/api/users', userRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/workspaces', workspaceRoutes);


// Health check endpoint to verify the server is running
app.get('/api/health', (req, res) => {
  res.status(200).json({ message: 'OmniDash API is running smoothly!' });
});

// Define the port and start listening for requests
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});