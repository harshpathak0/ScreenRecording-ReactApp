const express = require('express');
const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client} = require('@aws-sdk/client-s3');
const mysql = require('mysql');
const {config} = require("dotenv");
config({path: "./config/.env"})

const app = express();
app.use(express.json());

var cors = require('cors');
app.use(
  cors({
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH'],
    credentials: true,
    httpOnly: true,
  })
);

const port = 4000;

// Configure AWS SDK with your credentials
const s3 = new S3Client({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: process.env.AWS-ACCESS-KEY,
    secretAccessKey: process.env.AWS-SECRET-KEY ,
  },
});

const Connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'recoder',
  port: '3306',
});

Connection.connect(function (err) {
  if (err) {
    console.log('error', err.sqlMessage);
  } else {
    console.log('Connection Established...');
  }
});

// Storage Configuration for AWS S3 bucket
let storage = multerS3({
  s3: s3,
  bucket: 'myscreen-recorder',
  acl: 'public-read',
  metadata: (req, file, cb) => {
    cb(null, {fieldname: file.fieldname});
  },
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const uniqueIdentifier = Date.now(); // or use any method to generate a unique identifier
    const originalFileName = file.originalname;
    const newFileName = `${uniqueIdentifier}_${originalFileName}`;
    console.log(newFileName)
    cb(null, newFileName);
  },
});

let upload = multer({ storage: storage });

// Upload the video to S3
app.post('/PostRecordedVideos', upload.single('recorded_data'), (req, res) => {

  if (!req.file) {
    console.error('No file uploaded'); 
    return res.status(400).json({ error: 'No file uploaded' });
  }

  let videodata = {
    recorded_data: req.file.location,
  };

  let sqlQuery = 'INSERT INTO tbl_recording_data SET ?';
  Connection.query(sqlQuery, videodata, (err, result) => {
    if (err) {
      console.error('Error storing video metadata:', err);
      return res.status(500).json({ error: 'Failed to store video metadata' });
    }

    console.log(result);
    return res.json({ message: 'Video uploaded successfully', recorded_data: req.file.location });
  });
});

// API to get video from the database
app.get('/GetRecordedVideos', (req, res) => {
  const sqlQuery = 'SELECT * FROM tbl_recording_data';
  Connection.query(sqlQuery, (err, results) => {
    if (err) {
      console.error('Error fetching video:', err);
      return res.status(500).json({ error: 'Failed to fetch video' });
    }

    return res.json(results);
  });
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

