import React, { useEffect, useState } from 'react';
import axios from "axios";
import './style.css';
import { ReactMediaRecorder, useReactMediaRecorder } from 'react-media-recorder';
import Button from 'react-bootstrap/Button';

function App() {
  const { status, startRecording, stopRecording, mediaBlobUrl } = useReactMediaRecorder({
    screen: true,
    mimeType: "video/mp4"
  });

  const [isUploading, setIsUploading] = useState(false);
  const [recordedData, setRecordedData] = useState([]);

  const config = {
    headers: {
      "content-type": "multipart/form-data"
    },
    withCredentials: true
  }

  const uploadToS3 = async () => {
    setIsUploading(true);

    try {
      // stopRecording();
      // // // const blob = await fetch(mediaBlobUrl).then(res => res.blob());
      // const blob = new Blob([mediaBlobUrl], { type: "video/mp4" });
      // const formData = new FormData();
      // formData.append('recorded_data', blob,  'recorded-video.mp4');

      // const response = await axios.post('http://localhost:4000/PostRecordedVideos', formData, config);

      if (status === 'recording') {
        stopRecording();
      }

      // Convert mediaBlobUrl to Blob
      const blob = await fetch(mediaBlobUrl).then(res => res.blob());

      // Create FormData and append the blob with a unique filename
      const formData = new FormData();
      formData.append('recorded_data', blob, `recorded-video-${Date.now()}.mp4`);

      // Send the formData to the server
      const response = await axios.post('http://localhost:4000/PostRecordedVideos', formData, config);

      if (response.status === 200) {
        console.log('Video uploaded successfully', response);
        setRecordedData(prevData => [...prevData, { recorded_data: response.data.recorded_data }]);
      } else {
        console.error('Failed to upload video:', response.data);
      }
    }
    catch (error) {
      console.error('Error uploading video:', error.response.data);
    }
    finally {
      setIsUploading(false);
    }
  };

  const getRecordedData = async () => {
    try {
      const response = await axios.get("http://localhost:4000/GetRecordedVideos");
      const extractedData = response.data.map(item => ({ recorded_data: item.recorded_data }));
      setRecordedData(extractedData);
      console.log("Data retrieved successfully", extractedData)
    } catch (error) {
      console.log("Error retrieving data:", error);
    }
  }

  useEffect(() => {
    getRecordedData();
  }, []);

  return (
    <div>
      <div className='status mt-4'><h4>Status  :  </h4>  <h5 className='mt-1'>{status}</h5></div>
      <div>
        <div className='buttons ml-2 mt-4 gap-5'>
          <Button variant="primary" size="lg" active onClick={startRecording} >
            Start Recording
          </Button>
          <Button variant="primary" size="lg" active onClick={stopRecording}>
            Stop Recording
          </Button>
          <Button variant="primary" size="lg" active onClick={uploadToS3} disabled={!mediaBlobUrl || isUploading}>
            Save Video
          </Button>
        </div>

        <br />
        {isUploading && <p>Uploading...</p>}
        {/* Recent Video */}
        <h3>Recent Video</h3>
        <video src={mediaBlobUrl} autoPlay loop controls style={{ height: "20rem", width: "20rem", margin: "2rem" }}></video>
      </div>

      {/*Recorded videos*/}
      <div style={{ marginTop: "20px" }}>
        <h2>Recorded videos</h2>
        <div style={{ display: "flex", width: "100vw", flexWrap: "wrap" }}>
          {recordedData.map((record, id) => (
            <div key={id}>
              <div style={{ height: "20rem", width: "20rem", margin: "2rem" }}>
                {/* <video src={record.recorded_data} controls style={{ height: "100%", width: "100%" }}></video> */}
                <video controls style={{ height: "100%", width: "100%" }}>
                  <source src={record.recorded_data} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
                <h5>{record.RecordingDate}</h5>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;