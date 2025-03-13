const startButton = document.getElementById('startButton');
const stopButton = document.getElementById('stopButton');
const video = document.querySelector('video');
const socket = io('http://localhost:3000'); // Подключение к вашему серверу


const peer = new RTCPeerConnection({
  // iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
  bundlePolicy: 'max-bundle',   // Для уменьшения количества потоков
  rtcpMuxPolicy: 'require',     // Использование multiplexing для уменьшения ресурсов
  iceCandidatePoolSize: 0,      // Минимизировать обработку кандидатов
});

peer.onicecandidate = event => {
  if (event.candidate) {
    socket.emit("candidate", event.candidate);
  }
};

startButton.addEventListener('click', () => {
  navigator.mediaDevices.getDisplayMedia({
    audio: false,
    video: {
      width: 1920,
      height: 1080,
      frameRate: 30
    }
  }).then(stream => {
    video.srcObject = stream;
    video.onloadedmetadata = (e) => video.play();

    stream.getTracks().forEach(track => peer.addTrack(track, stream));

    peer.createOffer().then(offer => {
      peer.setLocalDescription(offer);
      socket.emit("offer", { sdp: offer });
    });
  }).catch(e => console.log("Failed in getDisplayMedia", e));
});

stopButton.addEventListener('click', () => {
  video.srcObject.getTracks().forEach(track => track.stop());
});

// Принимаем ответ (answer)
socket.on("answer", async data => {
  await peer.setRemoteDescription(new RTCSessionDescription(data.sdp));
});

// Принимаем ICE-кандидатов
socket.on("candidate", async data => {
  await peer.addIceCandidate(new RTCIceCandidate(data));
});
