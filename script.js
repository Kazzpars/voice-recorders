// === DOM ELEMENTS ===
const recordBtn = document.getElementById("recordBtn");
const uploadBtn = document.getElementById("uploadBtn");
const recordingsList = document.getElementById("recordingsList");

// === GLOBAL VARS ===
let mediaRecorder, audioChunks = [], audioBlob;
let recordings = []; // Simpan recording sementara di browser
let audioContext, analyser, dataArrayTime, dataArrayFreq, bufferLength;
let canvasWave = document.getElementById("canvasWave");
let ctxWave = canvasWave.getContext("2d");
let canvasWaterfall = document.getElementById("canvasWaterfall");
let ctxWaterfall = canvasWaterfall.getContext("2d");

// === LOAD RECORDINGS ===
function loadRecordings() {
    recordingsList.innerHTML = "";
    recordings.forEach((rec, index) => {
        const li = document.createElement("li");
        li.innerHTML = `
        <strong>${index + 1}. ${rec.name}</strong>
        <audio controls src="${rec.url}"></audio>
        <br>
        <button class="preview" data-index="${index}">Preview</button>
        <a href="${rec.url}" download="${rec.name}">Download</a>
        <button class="delete" data-index="${index}">Delete</button>
        `;
        recordingsList.appendChild(li);
    });
}

// === EVENT LISTENER DELETE ===
recordingsList.addEventListener("click", (e) => {
    const index = e.target.dataset.index;
    if (!index) return;

    if (e.target.classList.contains("preview")) {
        const li = e.target.closest("li");
        const audio = li.querySelector("audio");
        if (audio) {
            audio.currentTime = 0;
            audio.play();
        }

    }

    if (e.target.classList.contains("delete")) {
        recordings.splice(index, 1);
        loadRecordings();
    }
});

async function convertToMp3(blob) {
    const arrayBuffer = await blob.arrayBuffer();
    const localAudioContext = new AudioContext();
    const audioBuffer = await localAudioContext.decodeAudioData(arrayBuffer);
    const samples = audioBuffer.getChannelData(0);
    const mp3Encoder = new lamejs.Mp3Encoder(1, audioBuffer.sampleRate, 128);
    const sampleBlockSize = 1152;
    let mp3Data = [];

    for (let i = 0; i < samples.length; i += sampleBlockSize) {
        const sampleChunk = samples.subarray(i, i + sampleBlockSize);
        const mp3buf = mp3Encoder.encodeBuffer(sampleChunk);
        if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
        }
    }

    const mp3buf = mp3Encoder.flush();
    if (mp3buf.length > 0) 
        mp3Data.push(mp3buf);

    localAudioContext.close();
    return new Blob(mp3Data, { type: 'audio/mp3' });
}

// === RECORDING ===

let visualizerActive = true;

async function startRecording() {
    visualizerActive = true;
    animateWave();
    recordBtn.textContent = "Stop Recording";
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    mimeType: "audio/webm;codecs=opus"
    audioChunks = [];

    mediaRecorder.ondataavailable = e => audioChunks.push(e.data);
    mediaRecorder.onstop = () => {
        audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        console.log("Audio size:", audioBlob.size);
        uploadBtn.disabled = false;
    };

    mediaRecorder.start();

    // Audio visualizer
    audioContext = new AudioContext();
    analyser = audioContext.createAnalyser();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(analyser);

    analyser.fftSize = 2048;
    bufferLength = analyser.frequencyBinCount;
    dataArrayTime = new Uint8Array(bufferLength);
    dataArrayFreq = new Uint8Array(bufferLength);

    animateWave();

    recordBtn.textContent = "Stop Recording";
}

function stopRecording() {
    mediaRecorder.stop();
    recordBtn.textContent = "Start Recording";
    // visualizerActive = true;
    // if (audioContext) {
    //     audioContext.close();
    //     audioContext = null;
    
}

// === BUTTON HANDLERS ===
recordBtn.onclick = async () => {
    if (!mediaRecorder || mediaRecorder.state === "inactive") {
        await startRecording();
    } else {
        stopRecording();
    }
};

uploadBtn.onclick = async () => {
    if (!audioBlob) return;

    const mp3Blob = await convertToMp3(audioBlob);
    const timestamp = new Date();
    const filename = `recording_${timestamp.getFullYear()}${(timestamp.getMonth()+1).toString().padStart(2,'0')}${timestamp.getDate().toString().padStart(2,'0')}_${timestamp.getHours().toString().padStart(2,'0')}${timestamp.getMinutes().toString().padStart(2,'0')}${timestamp.getSeconds().toString().padStart(2,'0')}.mp3`;

    const url = URL.createObjectURL(audioBlob);
    recordings.push({ name: filename, url });

    audioBlob = null;
    uploadBtn.disabled = true;
    loadRecordings();
};

// === VISUALIZER ===
function animateWave() {
    // if (!visualizerActive) return;
    requestAnimationFrame(animateWave);
    drawWaveform();
    drawWaterfall();
}

function drawWaveform() {
    if (!analyser) return;
    analyser.getByteTimeDomainData(dataArrayTime);

    ctxWave.fillStyle = "#111";
    ctxWave.fillRect(0, 0, canvasWave.width, canvasWave.height);

    ctxWave.lineWidth = 2;
    ctxWave.strokeStyle = "#4CAF50";
    ctxWave.beginPath();

    const sliceWidth = canvasWave.width * 1.0 / bufferLength;
    let x = 0;

    for (let i = 0; i < bufferLength; i++) {
        const v = dataArrayTime[i] / 128.0;
        const y = v * canvasWave.height / 2;
        if (i === 0) ctxWave.moveTo(x, y);
        else ctxWave.lineTo(x, y);
        x += sliceWidth;
    }

    ctxWave.lineTo(canvasWave.width, canvasWave.height / 2);
    ctxWave.stroke();
}

function drawWaterfall() {
    if (!analyser) return;
    const existingImageData = ctxWaterfall.getImageData(0, 0, canvasWaterfall.width, canvasWaterfall.height - 1);
    ctxWaterfall.putImageData(existingImageData, 0, 1);

    analyser.getByteFrequencyData(dataArrayFreq);

    for (let i = 0; i < canvasWaterfall.width; i++) {
        const freqIndex = Math.floor(i * bufferLength / canvasWaterfall.width);
        const intensity = dataArrayFreq[freqIndex];

        const blue = Math.max(0, 255 - intensity * 2);
        const green = Math.max(0, intensity > 128 ? 255 - (intensity - 128) * 2 : intensity * 2);
        const red = Math.max(0, (intensity - 128) * 2);

        ctxWaterfall.fillStyle = `rgb(${red}, ${green}, ${blue})`;
        ctxWaterfall.fillRect(i, 0, 1, 1);
    }
}
