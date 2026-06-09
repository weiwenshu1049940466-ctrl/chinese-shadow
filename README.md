# Chinese Shadow Puppet Interactive Web App

## 한국어

### 프로젝트 소개

이 프로젝트는 중국 전통 그림자극(皮影戏)을 바탕으로 만든 인터랙티브 웹 작품입니다. 웹캠으로 손의 움직임을 인식하고, 손가락 위치에 따라 무대 위의 인형이 움직이도록 구성했습니다.

작품에는 무대 배경, 산수 이미지, 구름 애니메이션, 깃발 흔들림 효과, 청석 바닥, 배경 음악이 포함되어 있습니다. 전체 화면에서 실행되도록 설계되었으며, 브라우저에서 바로 체험할 수 있습니다.

### 주요 기능

- ml5.js HandPose를 이용한 손 인식
- p5.js와 p5play 기반의 물리 인형 움직임
- 손가락 좌표를 이용한 그림자 인형 제어
- 반복 이동하는 구름 애니메이션
- 바람에 흔들리는 깃발 애니메이션
- 무대 조명처럼 보이는 중심 확산형 배경 효과
- GitHub Pages를 통한 웹 배포

### 실행 방법

브라우저에서 아래 링크를 열면 바로 실행할 수 있습니다.

[https://weiwenshu1049940466-ctrl.github.io/chinese-shadow/](https://weiwenshu1049940466-ctrl.github.io/chinese-shadow/)

로컬에서 실행하려면 프로젝트 폴더에서 간단한 HTTP 서버를 실행한 뒤 `index.html`을 열면 됩니다.

```bash
python3 -m http.server 8000
```

그 다음 브라우저에서 접속합니다.

```text
http://localhost:8000
```

### 사용 기술

- HTML / CSS / JavaScript
- p5.js
- p5.sound
- p5play
- ml5.js HandPose
- MediaPipe runtime

---

## 中文

### 项目介绍

这个项目是一个基于中国传统皮影戏的互动网页作品。作品通过摄像头识别手部动作，并根据手指关键点的位置控制舞台上的皮影人物运动。

项目中包含舞台背景、山水图层、云朵循环动画、旗帜随风飘动效果、青石板地面和背景音乐。页面适合全屏展示，可以直接在浏览器中体验。

### 核心功能

- 使用 ml5.js HandPose 进行手部识别
- 使用 p5.js 和 p5play 实现物理皮影运动
- 使用手指坐标控制皮影角色
- 云朵从右向左循环移动
- 旗帜和穗子随风飘动
- 模拟舞台灯光的中心扩散背景效果
- 通过 GitHub Pages 发布网页

### 运行方式

可以直接打开以下 GitHub Pages 链接体验：

[https://weiwenshu1049940466-ctrl.github.io/chinese-shadow/](https://weiwenshu1049940466-ctrl.github.io/chinese-shadow/)

如果在本地运行，可以在项目文件夹中启动一个简单的 HTTP 服务器：

```bash
python3 -m http.server 8000
```

然后在浏览器中打开：

```text
http://localhost:8000
```

### 使用技术

- HTML / CSS / JavaScript
- p5.js
- p5.sound
- p5play
- ml5.js HandPose
- MediaPipe runtime
