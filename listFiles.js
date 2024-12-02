const admin = require('firebase-admin');

// Inisialisasi Firebase Admin SDK
const serviceAccount = require('./mangkatsystem-firebase.json'); // Ganti dengan file kunci Anda
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'mangkatsystem.firebasestorage.app', // Ganti dengan nama bucket Firebase Anda
});

const bucket = admin.storage().bucket();

// Verifikasi daftar file di bucket
bucket.getFiles()
  .then(([files]) => {
    console.log('Daftar file di bucket:');
    files.forEach(file => console.log(file.name));
  })
  .catch(err => {
    console.error('Gagal mengambil daftar file:', err);
  });
