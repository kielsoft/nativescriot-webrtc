import { Observable } from 'tns-core-modules/data/observable';

export const MAX_BUFFERED_AMOUNT = 64 * 1024;

export class WebRTC extends Observable {

    public initiator: boolean;
    public channelConfig: any;
    public config: any;
    public constraints: any;
    public offerConstraints: any;
    public answerConstraints: any;
    public sdpTransform: Function
    public streams: Array<any>;
    public trickle: Boolean;

    public destroyed: boolean
    public connected: boolean

    public remoteAddress: any;
    public remoteFamily: any;
    public remotePort: any;
    public localAddress: any;
    public localPort: any;

    public static channelConfig: any = {};
    public static constraints: any = {};
    public static config: any = {
        iceServers: [
            {
                urls: 'stun:stun.l.google.com:19302'
            },
            {
                urls: 'stun:global.stun.twilio.com:3478?transport=udp'
            }
        ]
    };

    public allowHalfOpen: boolean;
    public channelName: string;

    public peerConnection: any;
    public _id: string;
    public _wrtc: any;

    public videoAccelerationEnabled = true;
   
    public _pcReady = false
    public _channelReady = false
    public _iceComplete = false // ice candidate trickle done (got null candidate)
    public _channel = null
    public _pendingCandidates = []

    public _isNegotiating: boolean
    public _batchedNegotiation = false // batch synchronous negotiations
    public _queuedNegotiation = false // is there a queued negotiation request?
    public _sendersAwaitingStable = []
    public _senderMap: WeakMap<object, any>

    public _remoteTracks = []
    public _remoteStreams = []

    public _chunk = null
    public _cb = null
    public _interval = null

    constructor(option?: any) {
        super();

        option = (!option) ? {} : option;

        this._id = this.makeTimeId(8)
        this._debug('new peer %o', option)

        this.allowHalfOpen = false

        this.channelName = option.initiator
            ? option.channelName || this.makeTimeId(20)
            : null

        this.initiator = option.initiator || false
        this.channelConfig = option.channelConfig || WebRTC.channelConfig
        this.config = option.config || WebRTC.config
        this.constraints = option.constraints || WebRTC.constraints
        this.offerConstraints = option.offerConstraints || {}
        this.answerConstraints = option.answerConstraints || {}
        this.sdpTransform = option.sdpTransform || function (sdp) { return sdp }
        this.streams = option.streams || (option.stream ? [option.stream] : []) // support old "stream" option
        this.trickle = option.trickle !== undefined ? option.trickle : true

        this.destroyed = false
        this.connected = false

        this.remoteAddress = undefined
        this.remoteFamily = undefined
        this.remotePort = undefined
        this.localAddress = undefined
        this.localPort = undefined

        this._wrtc = (option.wrtc && typeof option.wrtc === 'object')
            ? option.wrtc
            : ((typeof org.webrtc !== 'undefined') ? org.webrtc : null)

        if (!this._wrtc) {
            throw this.makeError('No WebRTC support: Not a supported browser', 'ERR_WEBRTC_SUPPORT')
        }

        this._pcReady = false
        this._channelReady = false
        this._iceComplete = false // ice candidate trickle done (got null candidate)
        this._channel = null
        this._pendingCandidates = []

        this._isNegotiating = !this.initiator // is this peer waiting for negotiation to complete?
        this._batchedNegotiation = false // batch synchronous negotiations
        this._queuedNegotiation = false // is there a queued negotiation request?
        this._sendersAwaitingStable = []
        this._senderMap = new WeakMap()

        this._remoteTracks = []
        this._remoteStreams = []

        this._chunk = null
        this._cb = null
        this._interval = null
    }

    public makeError(message: string, code: string) {
        let err = new Error(message)
        err.name = code
        return err
    }

    public _debug(...args) {
        args[0] = '[' + this._id + '] ' + args[0]
        console.log(args);
    }

    public setConstraints(constraints: any) {
        if (this.initiator) {
            this.offerConstraints = constraints
        } else {
            this.answerConstraints = constraints
        }
    }

    startConnection(): void {
        console.log("Implementation coming soon ......");
    }

    startCall(): any {}

    makeTimeId(afterTime: number = 5) {

        afterTime = parseInt(afterTime + '') || 5;
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

        for (var i = 0; i < afterTime; i++)
            text += possible.charAt(Math.floor(Math.random() * possible.length));

        return text;
    }
}
