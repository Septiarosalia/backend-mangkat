const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

exports.scheduledDeleteOldRecords = functions.pubsub
    .schedule("every 1 hours")
    .onRun(async (context) => {
      try {
        // Mendapatkan timestamp saat ini
        const now = admin.firestore.Timestamp.now();

        // Menghitung waktu satu jam yang lalu
        const oneHourAgo = new Date(now.toDate().getTime() - 60 * 60 * 1000);

        // Query untuk mengambil data yang sudah lebih dari 1 jam
        const snapshot = await db
            .collection("userRecords")
            .where(
                "createdAt",
                "<",
                admin.firestore.Timestamp.fromDate(oneHourAgo),
            )
            .get();

        // Mengecek jika tidak ada data yang perlu dihapus
        if (snapshot.empty) {
          console.log("No records to delete.");
          return null;
        }

        // Menghapus data menggunakan batch
        const batch = db.batch();
        snapshot.forEach((doc) => {
          batch.delete(doc.ref);
        });

        await batch.commit();
        console.log(`${snapshot.size} records deleted successfully.`);
      } catch (error) {
        console.error("Error deleting old records:", error);
      }
    });

    // Sinkronisasi data pengguna dari Firestore ke Realtime Database
exports.syncUserToRealtimeDB = functions.firestore
.document('users/{userId}')
.onWrite((change, context) => {
  const userId = context.params.userId;
  const userData = change.after.exists ? change.after.data() : null;

  // Jika ada data pengguna baru atau data pengguna diupdate, sinkronkan dengan Realtime Database
  if (userData) {
    return admin.database().ref(`users/${userId}`).set(userData);
  }

  // Jika dokumen dihapus dari Firestore, hapus data dari Realtime Database
  return admin.database().ref(`users/${userId}`).remove();
});

exports.addDriverCondition = functions.https.onRequest((req, res) => {
  const { userId, condition } = req.body;
  const db = admin.firestore();

  // Menambahkan kondisi pengemudi ke Firestore
  db.collection('driverConditions').add({
    userId: db.collection('users').doc(userId),
    condition,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  })
  .then((docRef) => {
    res.status(200).send(`Driver condition added with ID: ${docRef.id}`);
  })
  .catch((error) => {
    res.status(500).send(`Error adding condition: ${error}`);
  });
});

exports.addWarning = functions.https.onRequest((req, res) => {
  const { userId, warningMessage, severity } = req.body;
  const db = admin.firestore();

  // Menambahkan peringatan ke Firestore
  db.collection('warnings').add({
    userId: db.collection('users').doc(userId),
    warningMessage,
    severity,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  })
  .then((docRef) => {
    res.status(200).send(`Warning added with ID: ${docRef.id}`);
  })
  .catch((error) => {
    res.status(500).send(`Error adding warning: ${error}`);
  });
});

exports.addDriverActivity = functions.https.onRequest((req, res) => {
  const { userId, activityType } = req.body;
  const db = admin.firestore();

  // Menambahkan aktivitas pengemudi ke Firestore
  db.collection('driverActivities').add({
    userId: db.collection('users').doc(userId),
    activityType,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  })
  .then((docRef) => {
    res.status(200).send(`Driver activity added with ID: ${docRef.id}`);
  })
  .catch((error) => {
    res.status(500).send(`Error adding activity: ${error}`);
  });
});

const multer = require('multer');
const path = require('path');
const storage = multer.memoryStorage(); // Menggunakan memory storage
const upload = multer({ storage: storage });

exports.uploadImage = functions.https.onRequest((req, res) => {
  const busboy = require('busboy');
  const bb = busboy({ headers: req.headers });

  const file = req.body.file;
  const bucket = admin.storage().bucket();

  const imagePath = `images/${file.originalname}`;
  const fileUpload = bucket.file(imagePath);

  const blobStream = fileUpload.createWriteStream({
    metadata: {
      contentType: file.mimetype
    }
  });

  blobStream.on('finish', () => {
    // Dapatkan URL gambar setelah berhasil di-upload
    const imageUrl = `https://storage.googleapis.com/${bucket.name}/${imagePath}`;
    const db = admin.firestore();

    // Menyimpan data gambar di Firestore
    db.collection('images').add({
      userId: db.collection('users').doc(req.body.userId),
      imageUrl,
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    })
    .then(() => {
      res.status(200).send(`Image uploaded successfully: ${imageUrl}`);
    })
    .catch((error) => {
      res.status(500).send(`Error saving image data: ${error}`);
    });
  });

  blobStream.end(file.buffer);
});

exports.addUserRecord = functions.https.onRequest((req, res) => {
  const { userId, recordType, details } = req.body;
  const db = admin.firestore();

  // Menambahkan catatan pengguna ke Firestore
  db.collection('userRecords').add({
    userId: db.collection('users').doc(userId),
    recordType,
    details,
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  })
  .then((docRef) => {
    res.status(200).send(`User record added with ID: ${docRef.id}`);
  })
  .catch((error) => {
    res.status(500).send(`Error adding record: ${error}`);
  });
});
