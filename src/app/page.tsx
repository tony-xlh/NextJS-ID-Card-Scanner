'use client';
import { useEffect, useState } from "react";
import "./page.css";
import Scanner, { HolderInfo } from "./components/Scanner";
import { init } from "./dcv";
import Modal from "./components/Modal";



export default function Home() {
  const [scanning,setScanning] = useState(false);
  const [initialized,setInitialized] = useState(false);
  const [dataURL,setDataURL] = useState("");
  const [info,setInfo] = useState<HolderInfo|undefined>();
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

  const onScanned = (blob:Blob,info?:HolderInfo) => {
    console.log(blob);
    console.log(info);
    setScanning(false);
  }
  
  const onStopped = () => {
    setScanning(false);
  }

  return (
    <div className="container">
      {scanning && (
        <div className="fullscreen">
          <Scanner onScanned={onScanned} onStopped={onStopped}/>
        </div>
      )}
      {(dataURL && info) && (
        <div className="card">
          <div>
            Image:
            <img src={dataURL} alt="idcard"/>
          </div>
          <div>
            Name:
            <div></div>
          </div>
          <div>
            Name:
            <div></div>
          </div>
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
