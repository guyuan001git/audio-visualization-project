# 音频可视化项目

![可视化演示](https://via.placeholder.com/800x400.png?text=Audio+Visualization+Demo)

基于Web Audio API实现的实时音频分析系统，支持波形与频谱可视化。

## 功能特性
- 实时音频波形渲染
- FFT频谱分析（柱状图/粒子系统）
- 麦克风输入支持
- 音频文件拖拽解析
- 可视化样式调节面板

## 技术架构
```
└── 音频可视化项目/
    ├── audio-visualizer.html  # 主界面
    ├── styles.css            # 可视化样式
    ├── app.js                # 音频处理逻辑
    └── assets/               # 静态资源
```

## 快速启动
```bash
git clone https://github.com/guyuan001git/audio-visualization-project.git
cd audio-visualization-project
python -m http.server 8000
```