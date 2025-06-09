const canvas = document.getElementById('visualizer');
const ctx = canvas.getContext('2d');
canvas.width = 800;
canvas.height = 400;

let audioContext, analyser, source, animationId, audioElement = null;
const bufferLength = 256;
const dataArray = new Uint8Array(bufferLength);

// 初始化音频上下文
function initAudioContext() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        analyser = audioContext.createAnalyser();
        analyser.fftSize = 512;
    }
}

// 处理麦克风输入
async function startMicrophone() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        initAudioContext();
        source = audioContext.createMediaStreamSource(stream);
        source.connect(analyser);
        visualize();
        updateStatus('正在录制麦克风输入...');
    } catch (err) {
        updateStatus('需要麦克风权限');
    }
}

// 处理文件上传
function handleFileUpload(file) {
    // 清理之前的音频资源
    if(audioElement) {
        audioElement.pause();
        URL.revokeObjectURL(audioElement.src);
    }
    cancelAnimationFrame(animationId);
    // 初始化音频元素（使用全局变量）
    audioElement = new Audio();
    audioElement.src = URL.createObjectURL(file);

    // 时间格式化函数
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // 获取进度条元素
    const progressBar = document.getElementById('progressBar');
    const currentTimeEl = document.getElementById('currentTime');
    const durationEl = document.getElementById('duration');

    // 播放时间更新
    audioElement.addEventListener('timeupdate', () => {
        progressBar.value = (audioElement.currentTime / audioElement.duration) * 100;
        currentTimeEl.textContent = formatTime(audioElement.currentTime);
    });

    // 进度条拖动
    progressBar.addEventListener('input', () => {
        audioElement.currentTime = (progressBar.value * audioElement.duration) / 100;
    });

    // 加载元数据
    audioElement.addEventListener('loadedmetadata', () => {
        progressBar.max = 100;
        durationEl.textContent = formatTime(audioElement.duration);
    });

    // 用户交互后恢复音频上下文
    document.addEventListener('click', () => {
        if(audioContext && audioContext.state === 'suspended') {
            audioContext.resume();
        }
    }, { once: true });

    // 文件加载完成后播放
    audioElement.addEventListener('canplay', () => {
        initAudioContext();
        const source = audioContext.createMediaElementSource(audioElement);
        source.connect(analyser);
        source.connect(audioContext.destination);
        audioElement.play().catch(() => {
            alert('点击页面任意位置开始播放');
        });
        visualize();
        updateStatus('正在播放上传的音频...');
    });
}

// 可视化动画
let isWaveformMode = false;

function toggleVisualizationMode() {
  isWaveformMode = !isWaveformMode;
  modeBtn.textContent = isWaveformMode ? '频谱模式' : '波形模式';
}

function visualize() {
    analyser.getByteFrequencyData(dataArray);
    
    if (isWaveformMode) {
        analyser.getByteTimeDomainData(dataArray);
    } else {
        analyser.getByteFrequencyData(dataArray);
    }

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 绘制频谱柱状图
    const barWidth = (canvas.width / bufferLength) * 2.5;
    let x = 0;
    
    for(let i = 0; i < bufferLength; i++) {
        const dynamicFactor = 1.5 + (i / bufferLength) * 0.3; // 低频0.7高频1.0
         const barHeight = (dataArray[i] * 1.5) / dynamicFactor; // 整体系数1.5
        const baseHue = (i * 3 + Date.now() * 0.1) % 360;
const gradient = ctx.createLinearGradient(x, canvas.height - barHeight, x, canvas.height);
gradient.addColorStop(0, `hsl(${baseHue}, 100%, 50%)`);
gradient.addColorStop(0.5, `hsl(${(baseHue + 30) % 360}, 90%, 45%)`);
gradient.addColorStop(1, `hsl(${(baseHue + 60) % 360}, 80%, 40%)`);
        
        ctx.fillStyle = gradient;
ctx.shadowColor = `hsla(${baseHue}, 100%, 50%, ${0.3 + dataArray[i]/255 * 0.2})`;
ctx.shadowBlur = 8 + dataArray[i]/255 * 10;
ctx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
ctx.shadowColor = null;
ctx.shadowBlur = 0;
        x += barWidth + 2;
    }

    animationId = requestAnimationFrame(visualize);
}

// 更新状态提示
function updateStatus(text) {
    document.getElementById('status').textContent = text;
}

// 事件监听
document.getElementById('micBtn').addEventListener('click', () => {
    if (!source) {
        startMicrophone();
    } else {
        source.disconnect();
        cancelAnimationFrame(animationId);
        source = null;
        updateStatus('');
    }
});

document.getElementById('fileInput').addEventListener('change', (e) => {
    if (e.target.files[0]) {
        handleFileUpload(e.target.files[0]);
    }
});

const modeBtn = document.createElement('button');
modeBtn.textContent = '波形模式';
modeBtn.className = 'mode-btn';
document.querySelector('.controls').appendChild(modeBtn);

modeBtn.addEventListener('click', toggleVisualizationMode);

document.getElementById('resetBtn').addEventListener('click', () => {
    // 停止所有音频源
    if(audioElement) {
        audioElement.pause();
        audioElement.currentTime = 0;
        URL.revokeObjectURL(audioElement.src);
        audioElement = null;
        
        // 重置进度条
        document.getElementById('progressBar').value = 0;
        document.getElementById('currentTime').textContent = '0:00';
        document.getElementById('duration').textContent = '0:00';
    }
    
    // 完全释放音频资源
    if(audioContext) {
        audioContext.close().then(() => {
            // 清空所有音频节点引用
            analyser = null;
            source = null;
            audioContext = null;
            
            // 重新初始化AnalyserNode为新的实例
            initAudioContext();
        });
    }
    
    // 停止可视化
    cancelAnimationFrame(animationId);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    updateStatus('');
    
    // 强制刷新文件输入框
    document.getElementById('fileInput').value = '';
});
