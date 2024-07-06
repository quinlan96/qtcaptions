import {
    retry,
    handleAll,
    ConstantBackoff,
    ExponentialBackoff,
} from 'cockatiel';

const STREAM_URL = 'http://10.0.0.67:2022/rtc/v1/whep/?app=live&stream=livestream';
let sdk = null;

const initStream = async () => {
    // Close RTCPeerConnection if open
    if (sdk) {
        sdk.close();
    }

    sdk = SrsRtcWhipWhepAsync();

    // User should set the stream when publish is done, @see https://webrtc.org/getting-started/media-devices
    // However SRS SDK provides a consist API like https://webrtc.org/getting-started/remote-streams
    document.getElementById('rtc_media_player').srcObject = sdk.stream;

    // Optional callback, SDK will add track to stream.
    // sdk.ontrack = function (event) { console.log('Got track', event); sdk.stream.addTrack(event.track); };

    // For example: webrtc://r.ossrs.net/live/livestream
    const session = await sdk.play(STREAM_URL);

    console.log(`SRS session established [${session.sessionid}]`);
};

window.addEventListener('online', async () => {
    console.log('Browser back online')
    const retryPolicy = retry(handleAll, {
        maxAttempts: 20,
        backoff: new ExponentialBackoff({
            initialDelay: 500,
            maxDelay: 120000,
        }),
    });

    retryPolicy.onRetry((reason) => {
        console.error(reason);
    });

    await retryPolicy.execute(async () => {
        if (!sdk || sdk.pc.iceConnectionState !== 'connected') {
            console.log('Reconnecting to stream');
            await initStream();
        }
    });
});

window.addEventListener('load', async () => {
    await initStream()
});
