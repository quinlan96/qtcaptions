import {
    retry,
    handleAll,
    ExponentialBackoff,
} from 'cockatiel';
// Shim library to insulate apps from spec changes and browser differences in WebRTC
import adapter from 'webrtc-adapter';
import { SrsRtcWhipWhepAsync } from './lib/srs.sdk';
import './lib/winlin.utility';

const STREAM_URL = 'http://192.168.100.2:2022/rtc/v1/whep/?app=live&stream=livestream';
let sdk = null;

const initStream = async () => {
    // Close RTCPeerConnection if open
    if (sdk) {
        sdk.close();
    }

    // Initialize RTCPeerConnection and return stream SDK
    sdk = SrsRtcWhipWhepAsync();

    sdk.pc.addEventListener('iceconnectionstatechange', (e) => {
        // Listen for ICE connection state failed event and attempt to reconnect stream 
        if (sdk.pc.iceConnectionState === 'failed') {
            setTimeout(async () => {
                await initStream();
            }, 2000);
        }
    });

    // User should set the stream when publish is done, @see https://webrtc.org/getting-started/media-devices
    // However SRS SDK provides a consist API like https://webrtc.org/getting-started/remote-streams
    document.getElementById('rtc_media_player').srcObject = sdk.stream;

    // Optional callback, SDK will add track to stream.
    // sdk.ontrack = function (event) { console.log('Got track', event); sdk.stream.addTrack(event.track); };

    // For example: webrtc://r.ossrs.net/live/livestream
    const session = await sdk.play(STREAM_URL);

    console.log(`SRS session established [${session.sessionid}]`);
};

// window.online event is triggered when the browser reconnects to the internet
window.addEventListener('online', async () => {
    console.log('Browser back online')

    // Retry policy will execute a section of code and handle all errors until max attempts is reached
    const retryPolicy = retry(handleAll, {
        maxAttempts: 30,
        // Backoff defines delay between retries, which increases exponentially between initial and max
        backoff: new ExponentialBackoff({
            initialDelay: 500,
            maxDelay: 120000,
        }),
    });

    // Error will be swallowed if not explicitly logged
    retryPolicy.onRetry(console.error);

    await retryPolicy.execute(async () => {
        // Don't attempt to re-initialise healthy stream
        if (!sdk || sdk.pc.iceConnectionState !== 'connected') {
            console.log('Reconnecting to stream');
            await initStream();
        }
    });
});

// Load the stream on the initial page load
window.addEventListener('load', async () => {
    await initStream()
});
