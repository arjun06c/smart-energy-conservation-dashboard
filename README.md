# Smart Energy Conservation Dashboard

A full-stack web application built using the MERN stack (MongoDB, Express.js, React.js, Node.js) to simulate and manage smart devices, monitor energy consumption in real-time, and provide insights into energy usage and carbon footprint.

## Features

*   **User Authentication**: JWT-based secure login and registration.
*   **Device Management**: Add, edit, delete, and control simulated smart devices.
*   **Real-time Energy Simulation**: Real-time energy increase calculation when a device is turned ON. Uses `Socket.io` to update the dashboard instantly without refreshing.
*   **Dashboard UI**: Visually appealing dashboard showing:
    *   Total energy consumption (kWh)
    *   Active/running devices
    *   Estimated running bill (based on $0.12/kWh)
    *   Carbon footprint estimation
*   **Reports & Analytics**: Recharts visualizations for daily energy consumption (Line and Bar charts).
*   **Smart Suggestions & Alerts**: Basic notification alerts if usage goes high, and suggestions to turn off idling devices.
*   **Modern Responsive UI**: Fully responsive frontend built with Tailwind CSS.

## Project Structure

```
Smart_energy/
├── client/          # React.js Frontend (Vite)
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── context/     # React Context for state management
│   │   ├── pages/       # Page components (Dashboard, Devices, etc.)
│   │   └── api.js       # Axios instance for backend calls
│   └── ...
└── server/          # Node.js + Express.js Backend
    ├── controllers/ # Route logic handlers
    ├── middleware/  # Custom middlewares (auth)
    ├── models/      # Mongoose Schemas (User, Device, EnergyUsage)
    ├── routes/      # Express API routes
    └── server.js    # Entry point & Socket.io setup
```

## Prerequisites

*   Node.js (v16+ recommended)
*   MongoDB (Local instance or MongoDB Atlas)

## Setup Instructions

### 1. Backend Setup

1. Open a terminal and navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the `server` directory and add the following:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/smart_energy
   JWT_SECRET=super_secret_jwt_key
   ```
4. Start the backend server:
   ```bash
   node server.js
   ```
   *(Server should run on `http://localhost:5000`)*

### 2. Frontend Setup

1. Open a new terminal and navigate to the `client` directory:
   ```bash
   cd client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
   *(App should run, usually on `http://localhost:5173`)*

## Usage

1. Open your browser and navigate to the frontend URL (e.g., `http://localhost:5173`).
2. **Register** a new account and log in.
3. Go to the **Devices** tab and add virtual devices (e.g., AC, Fan, Light) with their Voltage and Current.
4. Toggle the devices ON/OFF.
5. Watch the **Dashboard** animate and update your usage and carbon footprint in real-time as devices are left ON.
6. Check your **Reports** to visualize historical usage data.
