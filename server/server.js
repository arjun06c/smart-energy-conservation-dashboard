const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const socketIo = require('socket.io');

const authRoutes = require('./routes/authRoutes');
const deviceRoutes = require('./routes/deviceRoutes');
const reportRoutes = require('./routes/reportRoutes');
const Device = require('./models/Device');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'PUT', 'DELETE'] }
});

app.use(express.json());
app.use(cors({ origin: '*' }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/reports', reportRoutes);

app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'online', 
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' 
  });
});

// Socket.io real-time simulation
io.on('connection', (socket) => {
  console.log('New client connected', socket.id);

  // Send real-time energy updates every 3 seconds for connected users
  // Note: in a real app, users would authenticate their socket and we would only send their data.
  // Here we do a broadcast of all active devices just for demonstration or filter by a simple room.
  
  socket.on('join', (userId) => {
    socket.join(userId);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected', socket.id);
  });
});

// Periodic task to simulate real-time energy usage and broadcast to clients
setInterval(async () => {
  try {
    const activeDevices = await Device.find({ status: 'ON' }).populate('user');
    
    // Group running devices by user
    const userEnergyData = {};
    const now = new Date();

    for (const device of activeDevices) {
      if (!device.lastTurnedOn) continue;
      
      const userId = device.user._id.toString();
      const durationHours = (now - device.lastTurnedOn) / (1000 * 60 * 60);
      const powerInWatts = device.voltage * device.current;
      const energyKwh = (powerInWatts * durationHours) / 1000;
      
      if (!userEnergyData[userId]) {
        userEnergyData[userId] = { liveEnergy: 0, runningDevices: 0 };
      }
      
      userEnergyData[userId].liveEnergy += energyKwh;
      userEnergyData[userId].runningDevices += 1;

      // --- AUTO-OFF LOGIC ---
      if (device.autoOffThreshold > 0) {
        const uptimeMinutes = (now - device.lastTurnedOn) / 60000;
        if (uptimeMinutes >= device.autoOffThreshold) {
          await Device.findByIdAndUpdate(device._id, { status: 'OFF' });
          io.to(userId).emit('deviceStatusUpdate', { id: device._id, status: 'OFF' });
          io.to(userId).emit('automationEvent', { 
            message: `${device.name} auto-turned OFF after ${device.autoOffThreshold}m to save energy.`,
            type: 'success'
          });
        }
      }
    }

    // --- SCHEDULING LOGIC ---
    const allDevices = await Device.find({ 'schedule.enabled': true });
    const currentHHmm = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false });

    for (const dev of allDevices) {
      const { startTime, endTime } = dev.schedule;
      const userId = dev.user.toString();

      if (startTime === currentHHmm && dev.status === 'OFF') {
        await Device.findByIdAndUpdate(dev._id, { status: 'ON', lastTurnedOn: now });
        io.to(userId).emit('deviceStatusUpdate', { id: dev._id, status: 'ON' });
        io.to(userId).emit('automationEvent', { message: `${dev.name} turned ON via schedule.`, type: 'info' });
      } else if (endTime === currentHHmm && dev.status === 'ON') {
        await Device.findByIdAndUpdate(dev._id, { status: 'OFF' });
        io.to(userId).emit('deviceStatusUpdate', { id: dev._id, status: 'OFF' });
        io.to(userId).emit('automationEvent', { message: `${dev.name} turned OFF via schedule.`, type: 'info' });
      }
    }

    // Broadcast live energy to users
    for (const [userId, data] of Object.entries(userEnergyData)) {
      io.to(userId).emit('energyUpdate', data);
    }

  } catch (error) {
    console.error('Interval error:', error.message);
  }
}, 1000); // Updated to 1s for real-time interactivity


const PORT = process.env.PORT || 5000;
const defaultMongoURI = 'mongodb://127.0.0.1:27017/smart_energy';

mongoose.connect(process.env.MONGO_URI || defaultMongoURI)
.then(() => {
  console.log('MongoDB Connected');
  server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
.catch(err => console.log(err));
