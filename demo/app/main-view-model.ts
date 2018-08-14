import { Observable } from 'tns-core-modules/data/observable';
import { WebRTC } from 'nativescript-webrtc';

export class HelloWorldModel extends Observable {
  private webrtc: WebRTC;

  public message: string;
  public btnLabel: string = "Click Now";

  constructor() {
    super();
    console.log("app started.......");
    this.message = "Welcome to {N} :)";

    this.webrtc = new WebRTC();
  }

  public buttonClicked(): void  {

    if(this.btnLabel == 'Click Now'){
      this.set('btnLabel', "Click Again");
    } else {
      this.set('btnLabel', "Click Now");
    }

    if(!this.webrtc){
        this.webrtc = new WebRTC();
    }

    console.log('starting offers..............');
    this.webrtc.startCall();  
    console.log("Initializing.......");
  }
}
