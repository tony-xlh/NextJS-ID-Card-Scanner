import "dynamsoft-license";

import "dynamsoft-barcode-reader";
import "dynamsoft-document-normalizer";
import "dynamsoft-label-recognizer";
import "dynamsoft-capture-vision-router";

import { CoreModule } from "dynamsoft-core";
import { LicenseManager } from "dynamsoft-license";

let initiazlied = false;

export async function init(){
  if (initiazlied === false) {
    console.log("Initializing...");
    await LicenseManager.initLicense("DLS2eyJvcmdhbml6YXRpb25JRCI6IjIwMDAwMSJ9");
    CoreModule.engineResourcePaths.rootDirectory = "https://cdn.jsdelivr.net/npm/";
    await CoreModule.loadWasm(["DDN","DLR","DBR"]).catch((ex: any) => {
      let errMsg = ex.message || ex;
      console.error(errMsg);
      alert(errMsg);
    });
  }
  initiazlied = true;
  return true;
}
