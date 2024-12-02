const express = require('express');
const admin = require('firebase-admin');
const bodyParser = require('body-parser');
const moment = require('moment');  // Mengimpor moment.js
const cron = require('node-cron');

// Inisialisasi Firebase Admin SDK
const serviceAccount = require('./mangkatsystem-firebase.json');
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();
const app = express();

// Middleware untuk parsing JSON
app.use(bodyParser.json());

// Endpoint untuk memeriksa apakah server berjalan
app.get('/', (req, res) => {
    res.send('Server is running!');
});

// Endpoint untuk login menggunakan Firebase Authentication
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).send({ message: 'Email and password are required.' });
    }

    try {
        const userRecord = await admin.auth().getUserByEmail(email);
        
        if (userRecord) {
            res.status(200).send({
                message: 'Login successful',
                userId: userRecord.uid,
                email: userRecord.email,
            });
        } else {
            res.status(401).send({ message: 'Authentication failed. User not found.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error during login', error });
    }
});

// Endpoint untuk menambah data aktivitas pengemudi
app.post('/add-driver-activity', async (req, res) => {
  const { driverId, status, timestamp } = req.body;

  // Validasi input
  if (!driverId || !status || !timestamp) {
      return res.status(400).send({ message: 'Invalid request. Fields are missing.' });
  }

  // Menambahkan data aktivitas pengemudi ke Firestore
  try {
      const result = await db.collection('driverActivities').add({
          driverId,
          status,
          timestamp,
      });

      res.status(200).send({ message: 'Data added successfully', id: result.id });
  } catch (error) {
      console.error('Error adding data:', error);
      res.status(500).send({ message: 'Failed to add data', error: error.message });
  }
});

// Endpoint untuk mendapatkan semua data dari koleksi driverActivities
app.get('/get-driver-activities', async (req, res) => {
  try {
      const snapshot = await db.collection('driverActivities').get();

      // Jika tidak ada data
      if (snapshot.empty) {
          return res.status(404).send({ message: 'No data found' });
      }

      // Format data menjadi array
      const data = [];
      snapshot.forEach(doc => {
          data.push({ id: doc.id, ...doc.data() });
      });

      // Kirim data sebagai respons
      res.status(200).send(data);
  } catch (error) {
      console.error('Error fetching data:', error);
      res.status(500).send({ message: 'Failed to fetch data', error: error.message });
  }
});

// Endpoint untuk registrasi pengguna baru
app.post('/register', async (req, res) => {
  const { email, password, name } = req.body;

  // Validasi input
  if (!email || !password || !name) {
      return res.status(400).send({ message: 'All fields (email, password, name) are required.' });
  }

  try {
      // Membuat pengguna baru dengan Firebase Authentication
      const userRecord = await admin.auth().createUser({
          email,
          password,
          displayName: name,
      });

      // Menyimpan data pengguna tambahan ke Firestore
      await db.collection('users').doc(userRecord.uid).set({
          name,
          email,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      res.status(201).send({
          message: 'User registered successfully',
          userId: userRecord.uid,
      });
  } catch (error) {
      console.error('Error during user registration:', error);
      res.status(500).send({ message: 'Failed to register user', error: error.message });
  }
});

// Fungsi untuk menghapus data dari Firestore berdasarkan kondisi
async function deleteInactiveRecords() {
  try {
      const now = admin.firestore.Timestamp.now();
      const oneHourAgo = admin.firestore.Timestamp.fromDate(new Date(now.toDate().getTime() - 60 * 60 * 1000));

      // Ambil dokumen dari koleksi "userRecords" di mana kondisi "sleepy" = false dan dibuat lebih dari 1 jam yang lalu
      const snapshot = await db.collection('userRecords')
          .where('sleepy', '==', false)
          .where('createdAt', '<=', oneHourAgo)
          .get();

      if (snapshot.empty) {
          console.log('No records to delete.');
          return;
      }

      // Hapus semua dokumen yang sesuai
      const batch = db.batch();
      snapshot.forEach(doc => {
          batch.delete(doc.ref);
      });
      await batch.commit();

      console.log(`${snapshot.size} records deleted successfully.`);
  } catch (error) {
      console.error('Error deleting inactive records:', error);
  }
}

// Menjadwalkan tugas cron untuk dijalankan setiap jam
cron.schedule('0 * * * *', () => {
  console.log('Running scheduled task: deleteInactiveRecords');
  deleteInactiveRecords();
});

// Endpoint untuk menambahkan data user ke Firestore
app.post('/add-user-record', async (req, res) => {
  const { userId, sleepy } = req.body;

  // Validasi input
  if (!userId || sleepy === undefined) {
      return res.status(400).send({ message: 'Invalid input. userId and sleepy are required.' });
  }

  try {
      // Tambahkan data ke koleksi Firestore
      await db.collection('userRecords').add({
          userId,
          sleepy,
          createdAt: admin.firestore.FieldValue.serverTimestamp(), // Menambahkan properti createdAt
      });

      res.status(200).send({ message: 'User record added successfully' });
  } catch (error) {
      console.error('Error adding user record:', error);
      res.status(500).send({ message: 'Failed to add user record', error: error.message });
  }
});

// Fungsi untuk menghapus dokumen lama
const deleteOldRecords = async () => {
    try {
        const now = admin.firestore.Timestamp.now();
        const oneHourAgo = new Date(now.toDate().getTime() - 60 * 60 * 1000);

        // Ambil dokumen dengan createdAt lebih kecil dari 1 jam yang lalu
        const snapshot = await db.collection('userRecords')
            .where('createdAt', '<', admin.firestore.Timestamp.fromDate(oneHourAgo))
            .get();

        // Hapus dokumen yang ditemukan
        const batch = db.batch();
        snapshot.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();
        console.log(`${snapshot.size} records deleted successfully.`);
    } catch (error) {
        console.error('Error deleting old records:', error);
    }
};

// Jalankan cron job setiap jam
cron.schedule('0 * * * *', deleteOldRecords); // Menjalankan setiap jam pada menit ke-0


// Menjalankan server di port 5000
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
