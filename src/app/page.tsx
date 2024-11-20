'use client';
import { useEffect, useState } from "react";
import "./page.css";
import Scanner from "./components/Scanner";
import { init } from "./dcv";
import Modal from "./components/Modal";

export default function Home() {
  const [scanning,setScanning] = useState(false);
  const [initialized,setInitialized] = useState(false);
  const startScanning = () => {
    setScanning(true);
  }

  useEffect(()=>{
    const initDynamsoft = async () => {
      try {
        const result = await init();
        if (result) {
          setInitialized(true);
        }  
      } catch (error) {
        alert(error);
      }
    }
    initDynamsoft();
  },[])

  return (
    <div className="container">
      {scanning && (
        <div className="fullscreen">
          <Scanner/>
        </div>
      )}
      <div className="footer">
        <button className="shutter-button round" onClick={()=>{startScanning();}}>Scan</button>
      </div>
      {!initialized &&(
        <Modal info="Initializing..."></Modal>
      )}
    </div>
  );
}
