import { android, on, uncaughtErrorEvent } from 'tns-core-modules/application';
import { ad } from 'tns-core-modules/utils/utils';
import { WebRTC as Common } from './webrtc.common';

const {
    PeerConnectionFactory,
    PeerConnection,
    MediaConstraints,
    Camera1Enumerator,
    EglBase,
    DataChannel,
    SdpObserver,

} = org.webrtc;

declare const byte;

let localPeer: org.webrtc.PeerConnection;
let remotePeer: org.webrtc.PeerConnection;

const executor: java.util.concurrent.ExecutorService = java.util.concurrent.Executors.newSingleThreadExecutor();

on(uncaughtErrorEvent, function (args) {
    if (args.android) {
        // For Android applications, args.android is an NativeScriptError.
        console.log("NativeScriptError: " + args.android);
    } else if (args.ios) {
        // For iOS applications, args.ios is NativeScriptError.
        console.log("NativeScriptError: " + args.ios);
    }
});

export class WebRTC extends Common {

    public constraints: org.webrtc.MediaConstraints;
    public dataChannel: org.webrtc.DataChannel;

    public static constraints = new MediaConstraints();
    public static config: any = {
        iceServers: [
            {urls: 'stun:stun.l.google.com:19302'},
            {urls: 'stun:stun1.l.google.com:19302'},
            {urls: 'stun:stun2.l.google.com:19302'},
            {urls: 'stun:stun3.l.google.com:19302'},
            {urls: 'stun:stun4.l.google.com:19302'},
            {urls: 'stun:global.stun.twilio.com:3478?transport=udp'}
        ]
    };

    public peerConnection: org.webrtc.PeerConnection;
    public peerConnectionFactory: org.webrtc.PeerConnectionFactory;

    constructor(option?) {
        option = (!option)? {} : option;

        option.config = option.config || {}

        if(!option.config.iceServers){
            option.config.iceServers = [
                new org.webrtc.PeerConnection.IceServer('stun:stun.l.google.com:19302'),
                new org.webrtc.PeerConnection.IceServer('stun:stun1.l.google.com:19302'),
                new org.webrtc.PeerConnection.IceServer('stun:stun2.l.google.com:19302'),
                new org.webrtc.PeerConnection.IceServer('stun:stun3.l.google.com:19302'),
                new org.webrtc.PeerConnection.IceServer('stun:stun4.l.google.com:19302'),
                new org.webrtc.PeerConnection.IceServer('stun:global.stun.twilio.com:3478?transport=udp'),
            ]
        }

        option.constraints = option.constraints || new MediaConstraints()
        option.channelConfig = option.channelConfig || new DataChannel.Init();
        super(option); //automatically calls startConnection()
    }

    startConnection(): org.webrtc.PeerConnection {
        console.log("Attempting connection creation......");

        let iceServers: any = java.util.Arrays.asList(this.config.iceServers);

        PeerConnectionFactory.initialize(
            PeerConnectionFactory.InitializationOptions.builder(ad.getApplicationContext())
            .setEnableVideoHwAcceleration(this.videoAccelerationEnabled)
            .setFieldTrials(PeerConnectionFactory.VIDEO_FRAME_EMIT_TRIAL + "/" + PeerConnectionFactory.TRIAL_ENABLED + "/")
            .createInitializationOptions()
        );

        const connectionOption = new PeerConnectionFactory.Options();
        this.peerConnectionFactory = PeerConnectionFactory.builder()
                        .setOptions(connectionOption)
                        .createPeerConnectionFactory();

        // const c = (org as any).webrtc.EglBase.extend({});
        // const rootEglBase = c.create();
        // this.peerConnectionFactory.setVideoHwAccelerationOptions(rootEglBase.getEglBaseContext(), rootEglBase.getEglBaseContext())


        // //Now create a VideoCapturer instance. Callback methods are there if you want to do something! Duh!
        const videoCapturerAndroid = this.createVideoCapturer();

        // // //Create a VideoSource instance
        const videoSource: org.webrtc.VideoSource = this.peerConnectionFactory.createVideoSource(true);
        const localVideoTrack: org.webrtc.VideoTrack = this.peerConnectionFactory.createVideoTrack("VideoTrack_" + this._id, videoSource);

        //create an AudioSource instance
        const audioSource: org.webrtc.AudioSource = this.peerConnectionFactory.createAudioSource(this.constraints);
        const localAudioTrack = this.peerConnectionFactory.createAudioTrack("AudioTrack_" + this._id, audioSource);

        // let iceServers: any = java.util.Arrays.asList([]);
        
        this.constraints.mandatory.add(new MediaConstraints.KeyValuePair("offerToReceiveAudio", "false"));
        this.constraints.mandatory.add(new MediaConstraints.KeyValuePair("offerToReceiveVideo", "false"));

        const localStream = this.peerConnectionFactory.createLocalMediaStream("localStream_" + this._id);
        localStream.addTrack(localVideoTrack);
        localStream.addTrack(localAudioTrack);

        

        //we will start capturing the video from the camera
        //width,height and fps
        //videoCapturerAndroid.startCapture(1000, 1000, 30);

        //create surface renderer, init it and add the renderer to the track
        //
        //
        // const videoView = <org.webrtc.SurfaceViewRenderer> android.context().findViewById();
        // videoView.setMirror(true);

        // const rootEglBase = EglBase.create();
        // videoView.init(rootEglBase.getEglBaseContext(), null);

        // localVideoTrack.addRenderer(new VideoRenderer(videoView));

        console.log("**************** done");

        localPeer = this.createPeerConnection(this.peerConnectionFactory, true);
        if(this.initiator){
            this.setupData({
                channel: localPeer.createDataChannel(this.channelName, this.channelConfig),
            });
        }

        return this.peerConnection = localPeer;
    }

    setupData (event:{channel: org.webrtc.DataChannel}) {
        if (!event.channel) {
          // In some situations `pc.createDataChannel()` returns `undefined` (in wrtc),
          // which is invalid behavior. Handle it gracefully.
          // See: https://github.com/feross/simple-peer/issues/163
          throw this.makeError('Data channel event is missing `channel` property', 'ERR_DATA_CHANNEL')
        }

        console.log("setting up channel data .... ");
      
        let channel = event.channel
        this.channelName = channel.label();
        
        channel.registerObserver(new org.webrtc.DataChannel.Observer({
            onMessage: (buffer: org.webrtc.DataChannel.Buffer) => {
                //self._onChannelMessage(event)
                if(buffer.data.hasArray()){
                    var bytes = buffer.data.array();
                } else {
                    bytes = new byte[buffer.data.remaining()];
                    buffer.data.get(bytes);
                }
                console.log((new java.lang.String(bytes, java.nio.charset.Charset.defaultCharset())).toString());

                //self.push(data)
            },

            onBufferedAmountChange: (param0: number): void => {
                this._debug('onBufferedAmountChange : ending backpressure: bufferedAmount %d' + param0)
            },

			onStateChange: (): void => {
                console.log(`channel onStateChange: ${channel.state()}`)
                android.startActivity.runOnUiThread(new java.lang.Runnable({run: () => {
                    if (channel.state() == DataChannel.State.OPEN) {
                        console.log("+++++++++++++++++++++++ channel good to go")
                    } else {
                        console.log("xxxxxxxxxxxxxxxxxxxxx channel NOT good to go")
                    }
                }}));
            },
        }));
        // channel.binaryType = 'arraybuffer'
      
        // if (typeof channel.bufferedAmountLowThreshold === 'number') {
        //   self._channel.bufferedAmountLowThreshold = MAX_BUFFERED_AMOUNT
        // }
      
        // self.channelName = self._channel.label
      
        // self._channel.onmessage = function (event) {
        //   self._onChannelMessage(event)
        // }
        // self._channel.onbufferedamountlow = function () {
        //   self._onChannelBufferedAmountLow()
        // }
        // self._channel.onopen = function () {
        //   self._onChannelOpen()
        // }
        // self._channel.onclose = function () {
        //   self._onChannelClose()
        // }
        // self._channel.onerror = function (err) {
        //   self.destroy(makeError(err, 'ERR_DATA_CHANNEL'))
        // }
      }

    startCall(){
        // to test setLocalDescription failure
        setInterval(()=>{ console.log((new Date).toISOString())}, 1000);

        console.log('creating offer');
        this.peerConnection.createOffer(this.createSdpObserver(), this.constraints);

    }

    createVideoCapturer(): org.webrtc.VideoCapturer {
        let videoCapturer: org.webrtc.VideoCapturer;
        console.log("Creating capturer using camera1 API.");
        videoCapturer = this.createCameraCapturer(new Camera1Enumerator(this.videoAccelerationEnabled));

        return videoCapturer;
    }

    createCameraCapturer(enumerator: org.webrtc.CameraEnumerator): org.webrtc.VideoCapturer | null {
        const deviceNames: Array<string> = <any>enumerator.getDeviceNames();

        // First, try to find front facing camera
        console.log("Looking for front facing cameras.");
        for (const deviceName of deviceNames) {
            if (enumerator.isFrontFacing(deviceName)) {
                console.log("Creating front facing camera capturer.");
                let videoCapturer: org.webrtc.VideoCapturer = enumerator.createCapturer(deviceName, null);

                if (videoCapturer != null) {
                    return videoCapturer;
                }
            }
        }

        // Front facing camera not found, try something else
        console.log("Looking for other cameras.");
        for (const deviceName of deviceNames) {
            if (!enumerator.isFrontFacing(deviceName)) {
                console.log("Creating other camera capturer.");
                let videoCapturer: org.webrtc.VideoCapturer = enumerator.createCapturer(deviceName, null);

                if (videoCapturer != null) {
                    return videoCapturer;
                }
            }
        };

        return null;
    }

    createSdpObserver() {
        return new SdpObserver(
            {
                onCreateSuccess: (sessionDescription: org.webrtc.SessionDescription): void => {
                    console.log(`${this._id} onCreateSuccess() called with: sessionDescription = [ ${sessionDescription.description} ]`);
                    
                    try {
                        if (this.peerConnection) {
                            console.log("about to set ........")
                            android.startActivity.runOnUiThread(new java.lang.Runnable({run: () => {
                                console.log("setting LocalDescription ........")
                                this.peerConnection.setLocalDescription(this.createSdpObserver(), this.sdpTransform(sessionDescription));
                                // wont get here
                                console.log(sessionDescription.description + '---------------- xxxxxxxxxxx');
                                console.log(JSON.stringify(this.peerConnection.getLocalDescription()));
                            }}));
                            
                        }
                    } catch (error) {
                        console.log('error has occured ', error)
                    }
            
                    console.log("set now....");
            
                },
                onSetSuccess: (): void => {
                    console.log(`onSetSuccess() is called`);
                },
                onCreateFailure: (errorMessage: string): void => {
                    console.log(`onCreateFailure() called with: ${errorMessage}`);
                },

                onSetFailure: (failureMessage: string): void => {
                    console.log(`onSetFailure() called with: ${failureMessage}`);
                }
            }
        );
    }

    createPeerConnection(factory: org.webrtc.PeerConnectionFactory,  isLocal:boolean) {
        //const rtcConfig: org.webrtc.PeerConnection.RTCConfiguration = new PeerConnection.RTCConfiguration(java.util.Arrays.asList(this.config.iceServers));
        const rtcConfig: org.webrtc.PeerConnection.RTCConfiguration = new PeerConnection.RTCConfiguration(java.util.Arrays.asList([]));
        const pcConstraints: org.webrtc.MediaConstraints = new MediaConstraints();

        const pcObserver: org.webrtc.PeerConnection.Observer = new org.webrtc.PeerConnection.Observer({

            onSignalingChange : (state: org.webrtc.PeerConnection.SignalingState) => {
                console.log(`onSignalingChange: ${state}`);
            },

            onIceConnectionChange: (state: org.webrtc.PeerConnection.IceConnectionState): void => {
                console.log(`onIceConnectionChange: ${state}`);
            },
        
            onIceConnectionReceivingChange : (status: boolean): void => {
                console.log(`onIceConnectionReceivingChange: ${status}`);
            },
        
            onIceGatheringChange : (state: org.webrtc.PeerConnection.IceGatheringState): void => {
                console.log(`onIceGatheringChange: ${state}`);
            },
        
            onIceCandidate: (iceCandidate: org.webrtc.IceCandidate): void => {
                console.log("onIceCandidate: " + isLocal);
                if (isLocal) {
                    //remotePeer.addIceCandidate(iceCandidate);
                } else {
                    localPeer.addIceCandidate(iceCandidate);
                }
            },
        
            onIceCandidatesRemoved : (iceCandidate: native.Array<org.webrtc.IceCandidate>): void => {
                console.log(`onIceCandidatesRemoved: ${iceCandidate}`);
            },
        
            onAddStream : (stream: org.webrtc.MediaStream): void => {
                console.log(`onAddStream: ${stream.getId()}: ${stream.videoTracks.size()}`);
                //VideoTrack remoteVideoTrack = mediaStream.videoTracks.get(0);
                //remoteVideoTrack.setEnabled(true);
                //remoteVideoTrack.addRenderer(new VideoRenderer(binding.surfaceView2));
            },
        
            onRemoveStream: (stream: org.webrtc.MediaStream): void => {
                console.log(`onRemoveStream: ${stream.getId()}`);
            },
        
            onDataChannel: (dataChannel: org.webrtc.DataChannel): void => {
                console.log(`onDataChannel: ${dataChannel}`);

            },
        
            onRenegotiationNeeded : (): void => {
                console.log(`onRenegotiationNeeded: called`);
            },
        
            onAddTrack : (receiver: org.webrtc.RtpReceiver, streams: native.Array<org.webrtc.MediaStream>): void => {
                console.log(`onAddTrack: ${receiver.id} ${streams.length}`);
            },

            onTrack: (transceiver: org.webrtc.RtpTransceiver): void => {
                console.log(`onTrack: ${transceiver}`);
            }
    
        });

        //return factory.createPeerConnection(rtcConfig, this.constraints, pcObserver);
        return factory.createPeerConnection(java.util.Arrays.asList([]), pcConstraints, pcObserver);
    }
}

