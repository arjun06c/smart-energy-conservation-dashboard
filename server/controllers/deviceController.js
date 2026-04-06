const Device = require('../models/Device');
const EnergyUsage = require('../models/EnergyUsage');

exports.addDevice = async (req, res) => {
  try {
    const { name, voltage, current, autoOffThreshold, schedule } = req.body;
    const newDevice = new Device({
      name,
      voltage,
      current,
      user: req.user.id,
      status: 'OFF',
      autoOffThreshold: autoOffThreshold || 0,
      schedule: schedule || { enabled: false, startTime: '', endTime: '' }
    });

    const device = await newDevice.save();
    res.json(device);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

exports.getDevices = async (req, res) => {
  try {
    const devices = await Device.find({ user: req.user.id });
    res.json(devices);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

exports.updateDevice = async (req, res) => {
  try {
    const { name, voltage, current, autoOffThreshold, schedule } = req.body;
    let device = await Device.findById(req.params.id);
    if (!device) return res.status(404).json({ message: 'Device not found' });
    if (device.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    device.name = name || device.name;
    device.voltage = voltage || device.voltage;
    device.current = current || device.current;
    device.autoOffThreshold = autoOffThreshold !== undefined ? autoOffThreshold : device.autoOffThreshold;
    device.schedule = schedule || device.schedule;

    await device.save();
    res.json(device);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

exports.deleteDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) return res.status(404).json({ message: 'Device not found' });
    if (device.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    await device.deleteOne();
    res.json({ message: 'Device removed' });
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

exports.toggleDevice = async (req, res) => {
  try {
    const device = await Device.findById(req.params.id);
    if (!device) return res.status(404).json({ message: 'Device not found' });
    if (device.user.toString() !== req.user.id) return res.status(401).json({ message: 'Not authorized' });

    device.status = device.status === 'ON' ? 'OFF' : 'ON';
    
    if (device.status === 'ON') {
      device.lastTurnedOn = new Date();
    } else {
      // Calculate energy for the period it was on
      if (device.lastTurnedOn) {
        const endTime = new Date();
        const durationHours = (endTime - device.lastTurnedOn) / (1000 * 60 * 60);
        // Energy = Voltage * Current * duration (Watt-hours) -> kWh
        // Assuming Current is in Amperes, Voltage in Volts. Power = V * I (Watts). 
        // Energy = Power * durationHours / 1000
        const powerInWatts = device.voltage * device.current;
        const energyKwh = (powerInWatts * durationHours) / 1000;

        const usage = new EnergyUsage({
          device: device._id,
          user: req.user.id,
          startTime: device.lastTurnedOn,
          endTime,
          energyKwh
        });
        await usage.save();
        device.lastTurnedOn = null;
      }
    }

    await device.save();
    res.json(device);
  } catch (error) {
    console.error(error.message);
    res.status(500).send('Server Error');
  }
};

exports.optimizeUsage = async (req, res) => {
  try {
    const activeDevices = await Device.find({ user: req.user.id, status: 'ON' });
    let throttled = 0;
    let list = [];

    for (const dev of activeDevices) {
      const powerKw = (dev.voltage * dev.current) / 1000;
      // If device is heavy load (> 1.5kW) or named AC/Heater
      if (powerKw > 1.5 || dev.name.toLowerCase().includes('ac') || dev.name.toLowerCase().includes('heater')) {
        dev.status = 'OFF';
        dev.lastTurnedOn = null; // Simplified: stop current session
        await dev.save();
        throttled++;
        list.push(dev.name);
      }
    }

    res.json({
      success: true,
      message: throttled > 0 ? `Optimization complete. Restricted ${throttled} high-load nodes.` : "Grid topology is already optimal.",
      affected: list
    });
  } catch (error) {
    console.error(error);
    res.status(500).send('Optimization calculation failed.');
  }
};
