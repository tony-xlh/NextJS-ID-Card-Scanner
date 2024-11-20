'use client';
import "./page.css";

export default function Home() {

  const startScanning = () => {

  }
  
  return (
    <div className="container">
      <div className="footer">
        <button className="shutter-button round" onClick={()=>{startScanning();}}>Scan</button>
      </div>
    </div>
  );
}
