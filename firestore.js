const admin = require('firebase-admin');
const serviceAccount = require('./mangkatsystem-firebase.json');  // Ganti dengan path ke file JSON Anda

// Inisialisasi Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://mangkatsystem-default-rtdb.asia-southeast1.firebasedatabase.app"  // Ganti dengan URL database Anda
});

// Referensi ke Realtime Database
const db = admin.database();

// Menambahkan data ke jalur 'Detections', 'DriverConditions', 'Users', dll.
const dataDetections = {
  detection_id_1: {
    detected: true,
    timestamp: "2024-12-02T08:30:00Z",
    location: "Area A"
  }
};

const dataDriverConditions = {
  driver_id_1: {
    condition: "Good",
    timestamp: "2024-12-02T08:30:00Z"
  }
};

const dataUsers = {
  user_id_1: {
    name: "John Doe",
    age: 30,
    active: true
  }
};

const dataWarnings = {
  warning_id_1: {
    message: "Low battery",
    level: "High"
  }
};

const dataDriverActivities = {
  activity_id_1: {
    type: "Driving",
    timestamp: "2024-12-02T08:30:00Z"
  }
};

const dataImages = {
  image_id_1: {
    url: "https://example.com/image1.jpg",
    uploaded_at: "2024-12-02T08:30:00Z"
  }
};

const dataUserRecords = {
  record_id_1: {
    user_id: "user_id_1",
    action: "Login",
    timestamp: "2024-12-02T08:30:00Z"
  }
};

// Menyimpan data ke setiap jalur
db.ref('Detections').push(dataDetections)
  .then(() => console.log("Data berhasil ditambahkan ke Detections"))
  .catch((error) => console.log("Error menambahkan data ke Detections: ", error));

db.ref('DriverConditions').push(dataDriverConditions)
  .then(() => console.log("Data berhasil ditambahkan ke DriverConditions"))
  .catch((error) => console.log("Error menambahkan data ke DriverConditions: ", error));

db.ref('Users').push(dataUsers)
  .then(() => console.log("Data berhasil ditambahkan ke Users"))
  .catch((error) => console.log("Error menambahkan data ke Users: ", error));

db.ref('Warnings').push(dataWarnings)
  .then(() => console.log("Data berhasil ditambahkan ke Warnings"))
  .catch((error) => console.log("Error menambahkan data ke Warnings: ", error));

db.ref('driverActivities').push(dataDriverActivities)
  .then(() => console.log("Data berhasil ditambahkan ke driverActivities"))
  .catch((error) => console.log("Error menambahkan data ke driverActivities: ", error));

db.ref('images').push(dataImages)
  .then(() => console.log("Data berhasil ditambahkan ke images"))
  .catch((error) => console.log("Error menambahkan data ke images: ", error));

db.ref('userRecords').push(dataUserRecords)
  .then(() => console.log("Data berhasil ditambahkan ke userRecords"))
  .catch((error) => console.log("Error menambahkan data ke userRecords: ", error));
