const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const glob = require('glob');  // Untuk mencari file di folder

// Inisialisasi Firebase Admin SDK
const serviceAccount = require('./mangkatsystem-firebase.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'mangkatsystem.firebasestorage.app', // Ganti dengan nama bucket Anda yang benar
});

const bucket = admin.storage().bucket();

// Fungsi untuk meng-upload gambar
const uploadImage = async (imagePath, imageName) => {
  try {
    const file = bucket.file(imageName);
    await file.save(fs.readFileSync(imagePath), {
      contentType: 'image/jpeg', // Sesuaikan dengan tipe gambar Anda (jpg, png, dll.)
    });

    console.log(`${imageName} berhasil di-upload ke Firebase Storage`);
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${imageName}`;

    // Menyimpan metadata gambar ke Firestore (opsional)
    const db = admin.firestore();
    await db.collection('images').add({
      name: imageName,
      url: imageUrl,
      uploadedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`Metadata untuk ${imageName} berhasil disimpan ke Firestore`);
  } catch (error) {
    console.error('Terjadi kesalahan saat meng-upload gambar:', error);
  }
};

// Fungsi untuk meng-upload seluruh gambar dari folder
const uploadAllImages = async (folderPaths) => {
  for (const folderPath of folderPaths) {
    // Cari semua file gambar di folder
    const imageFiles = glob.sync(`${folderPath}/*.{jpg,jpeg,png,gif}`);  // Menyesuaikan ekstensi gambar Anda

    for (const imagePath of imageFiles) {
      const imageName = path.basename(imagePath);
      await uploadImage(imagePath, imageName);
    }
  }
};

// Daftar folder yang berisi gambar-gambar yang akan di-upload
const folderPaths = [
  './dataset/on_phonecell',  // Folder 1
  './dataset/mobile_usage',  // Folder 2
  './dataset/forward',       // Folder 3
  './dataset/sleepy',        // Folder 4
  './dataset/rotated'        // Folder 5
];

// Panggil fungsi untuk meng-upload gambar
uploadAllImages(folderPaths);

// Verifikasi koneksi ke Firebase Storage
const bucketVerification = admin.storage().bucket();

// Cek apakah kita bisa mengambil daftar file dari bucket
bucketVerification.getFiles()
  .then(files => {
    console.log('Files in the bucket:', files);
    // Menampilkan nama file yang ada di bucket
    files[0].forEach(file => {
      console.log(file.name);
    });
  })
  .catch(err => {
    console.error('Error accessing bucket:', err);
  });
