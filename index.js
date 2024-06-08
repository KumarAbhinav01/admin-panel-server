const express = require('express');
const bodyParser = require('body-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Disable caching for all responses
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Admin login
app.post('/api/signin', async (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = await prisma.admin.findUnique({
      where: { email: username },
    });

    if (!admin) {
      return res.status(400).json("Admin Doesn't exist");
    }

    if (password !== admin.password) {
      return res.status(400).json("Password incorrect, please check");
    }

    res.status(200).json("Login Successfully");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Fetch or insert admin data
app.get('/api/signup', async (req, res) => {
  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Admin" (
        id SERIAL PRIMARY KEY,
        NAME varchar(255),
        EMAIL varchar(255) UNIQUE,
        PASSWORD varchar(255),
        STATUS varchar(255)
      );
    `;

    const existingUser = await prisma.admin.findUnique({
      where: { email: 'chinmay@123' },
    });

    if (!existingUser) {
      await prisma.admin.create({
        data: {
          name: 'Chinmay',
          email: 'chinmay@123',
          password: '12345678',
          status: 'true',
        },
      });
    }

    const users = await prisma.admin.findMany();
    res.status(200).json({ users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

// Admin signup
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "Admin" (
        id SERIAL PRIMARY KEY,
        NAME varchar(255),
        EMAIL varchar(255) UNIQUE,
        PASSWORD varchar(255),
        STATUS varchar(255)
      );
    `;

    const newUser = await prisma.admin.create({
      data: { name, email, password, status: 'active' },
    });

    res.status(200).json({ message: 'Signup Successful', user: newUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/savedata', async (req, res) => {
    try {
      const { data } = req.body; // Expecting an array of data objects
  
      // Validate the data format
      if (!Array.isArray(data) || !data.every(item => item.time && item.size && item.count)) {
        return res.status(400).json({ error: 'Invalid data format. Expecting an array of objects with time, size, and count properties.' });
      }
  
      // Ensure the table exists
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "AllData" (
          id SERIAL PRIMARY KEY,
          TIME varchar(255),
          SIZE varchar(255),
          COUNT varchar(255),
          SUM varchar(255),
          CREATED_AT timestamp DEFAULT CURRENT_TIMESTAMP
        );
      `;
  
      // Insert multiple data entries
      const insertPromises = data.map(item => prisma.allData.create({
        data: {
          time: item.time,
          size: item.size,
          count: item.count,
          sum: item.sum || null,
          createdAt: new Date().toISOString(),
        },
      }));
  
      const newData = await Promise.all(insertPromises);
  
      res.status(200).json({ message: 'Data added successfully', data: newData });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });  

// Fetch data from AllData
app.get('/api/getdata', async (req, res) => {
  try {
    await prisma.$executeRaw`
      CREATE TABLE IF NOT EXISTS "AllData" (
        id SERIAL PRIMARY KEY,
        TIME varchar(255),
        SIZE varchar(255),
        COUNT varchar(255),
        SUM varchar(255),
        CREATED_AT timestamp DEFAULT CURRENT_TIMESTAMP
      );
    `;

    const data = await prisma.allData.findMany();
    res.status(200).json({ data });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/timeupdate', async (req, res) => {
    try {
      const { time } = req.body;
  
      // Ensure the table exists
      await prisma.$executeRaw`
        CREATE TABLE IF NOT EXISTS "TimeSprint" (
          id SERIAL PRIMARY KEY,
          userid INT,
          time varchar(255) NOT NULL,
          status varchar(255),
          createdAt timestamp DEFAULT CURRENT_TIMESTAMP,
          updatedAt timestamp DEFAULT CURRENT_TIMESTAMP
        );
      `;
  
      // Insert or update time
      await prisma.timeSprint.upsert({
        where: { id: 1 },
        update: { time, updatedAt: new Date() },
        create: { userid: 1, time, status: 'updated' },
      });
  
      res.status(200).json({ message: 'Time updated successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });
  
  // Fetch time from TimeSprint
  app.get('/api/time', async (req, res) => {
    try {
      const timeSprint = await prisma.timeSprint.findUnique({ where: { id: 1 } });
      if (!timeSprint) {
        return res.status(404).json({ error: 'Time not found' });
      }
      res.status(200).json({ time: timeSprint.time });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: error.message });
    }
  });

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});