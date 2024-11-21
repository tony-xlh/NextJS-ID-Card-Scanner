import { MutableRefObject, useEffect, useRef, useState } from 'react';
import './Scanner.css';
import { DetectedQuadResultItem } from 'dynamsoft-document-normalizer'
import { CameraEnhancer, CaptureVisionRouter, CameraView, DCEFrame, CodeParser, EnumBarcodeFormat } from 'dynamsoft-capture-vision-bundle';
import SVGOverlay from './SVGOverlay';
import { intersectionOverUnion } from '@/utils';
import { mrzTemplate } from '../dcv';

export interface HolderInfo {
  lastName:string;
  firstName:string;
  birthDate:string;
  sex:string;
  docNumber:string;
}

export interface ScannerProps {
  onScanned?: (blob:Blob,info?:HolderInfo) => void;
  onStopped?: () => void;
}

const Scanner: React.FC<ScannerProps> = (props:ScannerProps) => {
  const [quadResultItem,setQuadResultItem] = useState<DetectedQuadResultItem|undefined>()
  let container: MutableRefObject<HTMLDivElement | null> = useRef(null);
  let router: MutableRefObject<CaptureVisionRouter | null> = useRef(null);
  let dce: MutableRefObject<CameraEnhancer | null> = useRef(null);
  let view: MutableRefObject<CameraView | null> = useRef(null);
  let interval = useRef<any>();
  let isSteady = useRef(false);
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

  const startScanning = async () => {
    stopScanning();
    await router.current?.initSettings("{\"CaptureVisionTemplates\": [{\"Name\": \"Default\"},{\"Name\": \"DetectDocumentBoundaries_Default\",\"ImageROIProcessingNameArray\": [\"roi-detect-document-boundaries\"]},{\"Name\": \"DetectAndNormalizeDocument_Default\",\"ImageROIProcessingNameArray\": [\"roi-detect-and-normalize-document\"]},{\"Name\": \"NormalizeDocument_Binary\",\"ImageROIProcessingNameArray\": [\"roi-normalize-document-binary\"]},  {\"Name\": \"NormalizeDocument_Gray\",\"ImageROIProcessingNameArray\": [\"roi-normalize-document-gray\"]},  {\"Name\": \"NormalizeDocument_Color\",\"ImageROIProcessingNameArray\": [\"roi-normalize-document-color\"]}],\"TargetROIDefOptions\": [{\"Name\": \"roi-detect-document-boundaries\",\"TaskSettingNameArray\": [\"task-detect-document-boundaries\"]},{\"Name\": \"roi-detect-and-normalize-document\",\"TaskSettingNameArray\": [\"task-detect-and-normalize-document\"]},{\"Name\": \"roi-normalize-document-binary\",\"TaskSettingNameArray\": [\"task-normalize-document-binary\"]},  {\"Name\": \"roi-normalize-document-gray\",\"TaskSettingNameArray\": [\"task-normalize-document-gray\"]},  {\"Name\": \"roi-normalize-document-color\",\"TaskSettingNameArray\": [\"task-normalize-document-color\"]}],\"DocumentNormalizerTaskSettingOptions\": [{\"Name\": \"task-detect-and-normalize-document\",\"SectionImageParameterArray\": [{\"Section\": \"ST_REGION_PREDETECTION\",\"ImageParameterName\": \"ip-detect-and-normalize\"},{\"Section\": \"ST_DOCUMENT_DETECTION\",\"ImageParameterName\": \"ip-detect-and-normalize\"},{\"Section\": \"ST_DOCUMENT_NORMALIZATION\",\"ImageParameterName\": \"ip-detect-and-normalize\"}]},{\"Name\": \"task-detect-document-boundaries\",\"TerminateSetting\": {\"Section\": \"ST_DOCUMENT_DETECTION\"},\"SectionImageParameterArray\": [{\"Section\": \"ST_REGION_PREDETECTION\",\"ImageParameterName\": \"ip-detect\"},{\"Section\": \"ST_DOCUMENT_DETECTION\",\"ImageParameterName\": \"ip-detect\"},{\"Section\": \"ST_DOCUMENT_NORMALIZATION\",\"ImageParameterName\": \"ip-detect\"}]},{\"Name\": \"task-normalize-document-binary\",\"StartSection\": \"ST_DOCUMENT_NORMALIZATION\",   \"ColourMode\": \"ICM_BINARY\",\"SectionImageParameterArray\": [{\"Section\": \"ST_REGION_PREDETECTION\",\"ImageParameterName\": \"ip-normalize\"},{\"Section\": \"ST_DOCUMENT_DETECTION\",\"ImageParameterName\": \"ip-normalize\"},{\"Section\": \"ST_DOCUMENT_NORMALIZATION\",\"ImageParameterName\": \"ip-normalize\"}]},  {\"Name\": \"task-normalize-document-gray\",   \"ColourMode\": \"ICM_GRAYSCALE\",\"StartSection\": \"ST_DOCUMENT_NORMALIZATION\",\"SectionImageParameterArray\": [{\"Section\": \"ST_REGION_PREDETECTION\",\"ImageParameterName\": \"ip-normalize\"},{\"Section\": \"ST_DOCUMENT_DETECTION\",\"ImageParameterName\": \"ip-normalize\"},{\"Section\": \"ST_DOCUMENT_NORMALIZATION\",\"ImageParameterName\": \"ip-normalize\"}]},  {\"Name\": \"task-normalize-document-color\",   \"ColourMode\": \"ICM_COLOUR\",\"StartSection\": \"ST_DOCUMENT_NORMALIZATION\",\"SectionImageParameterArray\": [{\"Section\": \"ST_REGION_PREDETECTION\",\"ImageParameterName\": \"ip-normalize\"},{\"Section\": \"ST_DOCUMENT_DETECTION\",\"ImageParameterName\": \"ip-normalize\"},{\"Section\": \"ST_DOCUMENT_NORMALIZATION\",\"ImageParameterName\": \"ip-normalize\"}]}],\"ImageParameterOptions\": [{\"Name\": \"ip-detect-and-normalize\",\"BinarizationModes\": [{\"Mode\": \"BM_LOCAL_BLOCK\",\"BlockSizeX\": 0,\"BlockSizeY\": 0,\"EnableFillBinaryVacancy\": 0}],\"TextDetectionMode\": {\"Mode\": \"TTDM_WORD\",\"Direction\": \"HORIZONTAL\",\"Sensitivity\": 7}},{\"Name\": \"ip-detect\",\"BinarizationModes\": [{\"Mode\": \"BM_LOCAL_BLOCK\",\"BlockSizeX\": 0,\"BlockSizeY\": 0,\"EnableFillBinaryVacancy\": 0,\"ThresholdCompensation\" : 7}],\"TextDetectionMode\": {\"Mode\": \"TTDM_WORD\",\"Direction\": \"HORIZONTAL\",\"Sensitivity\": 7},\"ScaleDownThreshold\" : 512},{\"Name\": \"ip-normalize\",\"BinarizationModes\": [{\"Mode\": \"BM_LOCAL_BLOCK\",\"BlockSizeX\": 0,\"BlockSizeY\": 0,\"EnableFillBinaryVacancy\": 0}],\"TextDetectionMode\": {\"Mode\": \"TTDM_WORD\",\"Direction\": \"HORIZONTAL\",\"Sensitivity\": 7}}]}");
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
    if (isSteady.current) {
      return;
    }
    console.log("capture and detect");
    let results:DetectedQuadResultItem[] = [];
    detecting.current = true;
    try {
      let image = dce.current.fetchImage();
      let capturedResult = await router.current?.capture(image,"DetectDocumentBoundaries_Default");
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
    if (results.length>0 && router.current) {
      let result = results[0];
      if (previousResults.current.length >= 3) {
        if (steady() == true) {
          console.log("steady");
          isSteady.current = true;
          let result = await router.current.capture(image,"NormalizeDocument_Color");
          if (result.normalizedImageResultItems) {
            if (props.onScanned) {
              stopScanning();
              let blob = await result.normalizedImageResultItems[0].toBlob("image/png");
              let info = await extractInfo(blob);
              props.onScanned(blob,info);
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

  const extractInfo = async (blob:Blob) => {
    let parser = await CodeParser.createInstance();
    await router.current?.resetSettings();
    let result = await router.current?.capture(blob,"ReadBarcodes_Balance");
    console.log(result);
    if (result && result.barcodeResultItems) {
      for (let index = 0; index < result.barcodeResultItems.length; index++) {
        const item = result.barcodeResultItems[index];
        if (item.format != EnumBarcodeFormat.BF_PDF417) {
          continue;
        }
        let parsedItem = await parser.parse(item.text);
        console.log(parsedItem);
        if (parsedItem.codeType === "AAMVA_DL_ID") {
          let number = parsedItem.getFieldValue("licenseNumber");
          let firstName = parsedItem.getFieldValue("firstName");
          let lastName = parsedItem.getFieldValue("lastName");
          let birthDate = parsedItem.getFieldValue("birthDate");
          let sex = parsedItem.getFieldValue("sex");
          let info:HolderInfo = {
            firstName:firstName,
            lastName:lastName,
            docNumber:number,
            birthDate:birthDate,
            sex:sex
          };
          return info;
        }
      }
    }else{
      await router.current?.initSettings(JSON.parse(mrzTemplate));
      let result = await router.current?.capture(blob,"ReadPassportAndId");
      if (result && result.textLineResultItems) {
        let parsedItem = await parser.parse(result.textLineResultItems[0].text);
        console.log(parsedItem);
        if (parsedItem.codeType.indexOf("MRTD") != -1) {
          let number = parsedItem.getFieldValue("documentNumber");
          if (!number) {
            number = parsedItem.getFieldValue("passportNumber");
          }
          let firstName = parsedItem.getFieldValue("primaryIdentifier");
          let lastName = parsedItem.getFieldValue("secondaryIdentifier");
          let birthDate = parsedItem.getFieldValue("dateOfBirth");
          let sex = parsedItem.getFieldValue("sex");
          let info:HolderInfo = {
            firstName:firstName,
            lastName:lastName,
            docNumber:number,
            birthDate:birthDate,
            sex:sex
          };
          return info;
        }
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
    <div className="scanner-container" ref={container}>
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
