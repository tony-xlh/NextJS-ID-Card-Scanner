import { MutableRefObject, useEffect, useRef, useState } from 'react';
import './Scanner.css';
import { DetectedQuadResultItem } from 'dynamsoft-document-normalizer'
import { CameraEnhancer, CaptureVisionRouter, CameraView, ImageEditorView, EnumCapturedResultItemType, CapturedResultReceiver, CapturedResultItem, OriginalImageResultItem } from 'dynamsoft-capture-vision-bundle';
import image from 'next/image';


export interface ScannerProps {
  onScanned?: (blob:Blob,detectionResults:DetectedQuadResultItem[]) => void;
  onStopped?: () => void;
}

const Scanner: React.FC<ScannerProps> = (props:ScannerProps) => {
  let container: MutableRefObject<HTMLDivElement | null> = useRef(null);
  let router: MutableRefObject<CaptureVisionRouter | null> = useRef(null);
  let dce: MutableRefObject<CameraEnhancer | null> = useRef(null);
  let view: MutableRefObject<CameraView | null> = useRef(null);
  let initializing = useRef(false);
  useEffect((): any => {
    const init = async () => {
      if (initializing.current) {
        return;
      }
      try {
        view.current = await CameraView.createInstance(container.current!);
        dce.current = await CameraEnhancer.createInstance(view.current);
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
      router.current?.dispose();
      dce.current?.dispose();
      console.log('Scanner Component Unmount');
    }
  }, []);
  
  return (
    <div className="container" ref={container}>
      <div className="dce-video-container"></div>
    </div>
  );
};

export default Scanner;
