import { MutableRefObject, useEffect, useRef, useState } from 'react';
import './Scanner.css';
import { DetectedQuadResultItem } from 'dynamsoft-document-normalizer'
import { CameraEnhancer, CaptureVisionRouter, CameraView, DCEFrame } from 'dynamsoft-capture-vision-bundle';
import SVGOverlay from './SVGOverlay';
import { intersectionOverUnion } from '@/utils';


export interface ScannerProps {
  onScanned?: (blob:Blob) => void;
  onStopped?: () => void;
}

const Scanner: React.FC<ScannerProps> = (props:ScannerProps) => {
  const [quadResultItem,setQuadResultItem] = useState<DetectedQuadResultItem|undefined>()
  let container: MutableRefObject<HTMLDivElement | null> = useRef(null);
  let router: MutableRefObject<CaptureVisionRouter | null> = useRef(null);
  let dce: MutableRefObject<CameraEnhancer | null> = useRef(null);
  let view: MutableRefObject<CameraView | null> = useRef(null);
  let interval = useRef<any>();
  const [viewBox,setViewBox] = useState("0 0 720 1280");
  const detecting = useRef(false);
  const previousResults = useRef<DetectedQuadResultItem[]>([])
  let initializing = useRef(false);
  useEffect((): any => {
    const init = async () => {
      if (initializing.current) {
        return;
      }
      try {
        view.current = await CameraView.createInstance(container.current!);
        dce.current = await CameraEnhancer.createInstance(view.current);
        dce.current.setResolution({width:1920,height:1080});
        dce.current.on("played",async function(){
          await updateViewBox();
          startScanning();  
        })
        router.current = await CaptureVisionRouter.createInstance();
        await dce.current.open();
      } catch (ex: any) {
        let errMsg = ex.message || ex;
        console.error(errMsg);
        alert(errMsg);
      }
    }
    
    init();
    initializing.current = true;

    return async () => {
      stopScanning();
      router.current?.dispose();
      dce.current?.dispose();
      console.log('Scanner Component Unmount');
    }
  }, []);

  const updateViewBox = async () => {
    let res = dce.current?.getResolution();
    let box = "0 0 "+res?.width+" "+res?.height;
    console.log(box);
    setViewBox(box);
  }

  const startScanning = () => {
    stopScanning();
    if (!interval.current) {
      interval.current = setInterval(captureAndDetect,150);
    }
  }
  
  const stopScanning = () => {
    clearInterval(interval.current);
    interval.current = null;
  }
  
  const captureAndDetect = async () => {
    if (detecting.current === true) {
      return;
    }
    if (!router.current || !dce.current) {
      return;
    } 
    console.log("capture and decode");
    let results:DetectedQuadResultItem[] = [];
    detecting.current = true;
    try {
      let image = dce.current.fetchImage();
      let capturedResult = await router.current?.capture(image,"DetectDocumentBoundaries_Default");
      console.log(capturedResult);
      if (capturedResult.detectedQuadResultItems) {
        results = results.concat(capturedResult.detectedQuadResultItems);
      }
      console.log(results);
      if (results.length>0) {
        setQuadResultItem(results[0]);
        checkIfSteady(results,image);
      }else{
        setQuadResultItem(undefined);
      }
    } catch (error) {
      console.log(error);
    }
    detecting.current = false;
  }

  const checkIfSteady = async (results:DetectedQuadResultItem[],image:DCEFrame) => {
    console.log(results);
    if (results.length>0) {
      let result = results[0];
      if (previousResults.current.length >= 3) {
        if (steady() == true) {
          console.log("steady");
          let result = await router.current?.capture(image,"NormalizeDocument_Default");
          if (result?.normalizedImageResultItems) {
            if (props.onScanned) {
              let blob = await result?.normalizedImageResultItems[0].toBlob("image/png");
              props.onScanned(blob);
            }
          }
        }else{
          console.log("shift and add result");
          previousResults.current.shift();
          previousResults.current.push(result);
        }
      }else{
        console.log("add result");
        previousResults.current.push(result);
      }
    }
  }

  const steady = () => {
    if (previousResults.current[0] && previousResults.current[1] && previousResults.current[2]) {
      let iou1 = intersectionOverUnion(previousResults.current[0].location.points,previousResults.current[1].location.points);
      let iou2 = intersectionOverUnion(previousResults.current[1].location.points,previousResults.current[2].location.points);
      let iou3 = intersectionOverUnion(previousResults.current[2].location.points,previousResults.current[0].location.points);
      if (iou1>0.9 && iou2>0.9 && iou3>0.9) {
        return true;
      }else{
        return false;
      }
    }
    return false;
  }

  const switchCamera = async () => {
    if (dce.current) {
      let currentCamera = dce.current.getSelectedCamera();
      let cameras = await dce.current.getAllCameras();
      let currentCameraIndex = cameras.indexOf(currentCamera);
      let desiredIndex = 0
      if (currentCameraIndex < cameras.length - 1) {
        desiredIndex = currentCameraIndex + 1;
      }
      await dce.current.selectCamera(cameras[desiredIndex]);
    }
  }

  const close = async () => {
    stopScanning();
    if (props.onStopped) {
      props.onStopped();
    }
  }

  return (
    <div className="container" ref={container}>
      <div className="dce-video-container"></div>
      {quadResultItem &&
        <SVGOverlay viewBox={viewBox} quad={quadResultItem}></SVGOverlay>
      }
      <div className="header">
        <div className="switchButton" onClick={switchCamera}>
          <img className="icon" src="/switch.svg" alt="switch"/>
        </div>
        <div className="closeButton" onClick={close}>
          <img className="icon" src="/cross.svg" alt="close"/>
        </div>
      </div>
    </div>
  );
};

export default Scanner;
