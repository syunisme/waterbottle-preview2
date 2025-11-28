// draw.js (最終修正版：修正 Path 數據和縮放邏輯)

// --------------------------------------------------------
// 1. 初始化 Fabric.js Canvas 與 DOM 元素
// --------------------------------------------------------
const canvas = new fabric.Canvas('designCanvas');
const bottleImg = document.getElementById("bottle");
let capMask, bodyMask, handleMask; // Fabric.js 遮罩物件

// 取得控制項
const colorBody = document.getElementById("colorBody");
const colorCap = document.getElementById("colorCap");
const colorHandle = document.getElementById("colorHandle");
const imgUpload = document.getElementById("imgUpload");
const textInput = document.getElementById("textInput");
const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn"); // 下載按鈕

// --------------------------------------------------------
// 2. 曲線 Path Data (針對您的 3D 線稿圖估算)
//    Path 數據是基於畫布尺寸 400x600 估算的。
// --------------------------------------------------------
function getFabricPath(type) {
    switch (type) {
        case 'cap':
            // 瓶蓋 (上半部分): 寬度約 140px，高度約 70px
            return 'M 130 50 Q 200 10, 270 50 L 270 120 C 250 140, 150 140, 130 120 Z';

        case 'body':
            // 瓶身主體：可客製化區域 (圓柱體部分)
            // 寬度約 120px，高度約 400px
            return 'M 140 140 L 140 550 C 140 560, 150 570, 200 570 C 250 570, 260 560, 260 550 L 260 140 Z';
            
        case 'strap':
            // 提帶形狀：長條部分和底部的圓環
            // 長條寬度約 15px
            return 'M 190 145 L 205 145 L 205 530 L 190 530 Z ' + 
                   // 底部圓環 (簡單圓形)
                   'M 197 545 A 15 15 0 1 1 197 545';
        default:
            return '';
    }
}

// --------------------------------------------------------
// 3. 初始化 Canvas 尺寸與 Mask 物件
// --------------------------------------------------------
function resizeAndInitialize() {
    const rect = bottleImg.getBoundingClientRect();
    canvas.setWidth(rect.width);
    canvas.setHeight(rect.height);
    
    canvas.clear(); 

    // ★ 修正縮放比例：由於 Path 數據現在是基於 400px 寬度估算的，所以以此為基準
    const scale = rect.width / 400; // 以前是 / 300
    
    // ======================================
    // A. 創建瓶身裁剪路徑 (用於用戶圖案 Clipping)
    // ======================================
    const clipPathData = getFabricPath('body');
    const clipPath = new fabric.Path(clipPathData);
    clipPath.set({
        absolutePosition: true, 
        scaleX: scale, scaleY: scale,
        selectable: false, evented: false, fill: 'transparent'
    });
    canvas.clipPath = clipPath; 

    // ======================================
    // B. 創建顏色遮罩
    // ======================================
    
    // 瓶身顏色遮罩 (透明度 70%)
    bodyMask = new fabric.Path(getFabricPath('body'));
    bodyMask.set({ fill: colorBody.value, scaleX: scale, scaleY: scale, selectable: false, opacity: 0.7 });
    
    // 瓶蓋顏色遮罩 (透明度 80%)
    capMask = new fabric.Path(getFabricPath('cap'));
    capMask.set({ fill: colorCap.value, scaleX: scale, scaleY: scale, selectable: false, opacity: 0.8 });
    
    // 提帶顏色遮罩 (透明度 90%)
    handleMask = new fabric.Path(getFabricPath('strap'));
    handleMask.set({ fill: colorHandle.value, scaleX: scale, scaleY: scale, selectable: false, opacity: 0.9 });
    
    // ======================================
    // C. 添加並排序圖層
    // ======================================
    canvas.add(bodyMask, capMask, handleMask);
    
    // 確保圖層順序：瓶身顏色在最底，瓶蓋/提帶在其上
    bodyMask.sendToBack(); 
    capMask.bringToFront();
    handleMask.bringToFront();
    
    canvas.renderAll();
}

// --------------------------------------------------------
// 4. 綁定事件：顏色切換 (保持不變)
// --------------------------------------------------------
function updateMaskColor() {
    if (capMask) capMask.set('fill', colorCap.value);
    if (bodyMask) bodyMask.set('fill', colorBody.value);
    if (handleMask) handleMask.set('fill', colorHandle.value);
    canvas.renderAll();
}

colorBody.addEventListener("input", updateMaskColor);
colorCap.addEventListener("input", updateMaskColor);
colorHandle.addEventListener("input", updateMaskColor);


// --------------------------------------------------------
// 5. 綁定事件：圖片上傳 (實作圖片裁剪) (保持不變)
// --------------------------------------------------------
imgUpload.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(f) {
        const dataURL = f.target.result;

        fabric.Image.fromURL(dataURL, function(img) {
            // 移除所有舊的圖片物件
            canvas.getObjects().filter(obj => obj.uploaded).forEach(obj => canvas.remove(obj));
            
            // 設定圖片的初始大小、位置和控制項
            img.set({
                uploaded: true, 
                scaleX: 0.25, scaleY: 0.25,
                left: canvas.getWidth() * 0.2, 
                top: canvas.getHeight() * 0.35,
                hasControls: true, 
                // 應用裁剪模具
                clipPath: canvas.clipPath 
            });

            canvas.add(img);
            
            // 圖層排序：確保圖片在顏色遮罩下方
            img.sendToBack(); 
            bodyMask.sendToBack(); 

            canvas.renderAll();
        });
    };
    reader.readAsDataURL(file);
});

// --------------------------------------------------------
// 6. 綁定事件：文字輸入 (實作文字裁剪) (保持不變)
// --------------------------------------------------------
textInput.addEventListener("input", () => {
    // 移除所有舊的文字物件
    canvas.getObjects().filter(obj => obj.textObject).forEach(obj => canvas.remove(obj));
    
    if (textInput.value) {
        const textObj = new fabric.Text(textInput.value, {
            textObject: true, 
            fontSize: 40,
            fill: 'black',
            left: canvas.getWidth() * 0.3,
            top: canvas.getHeight() * 0.55,
            hasControls: true,
            // 應用裁剪模具
            clipPath: canvas.clipPath 
        });
        canvas.add(textObj);
        textObj.sendToBack();
        bodyMask.sendToBack();
    }
    canvas.renderAll();
});


// --------------------------------------------------------
// 7. 修正：下載設計圖功能 (配合 Z-Index 對調) (保持不變)
// --------------------------------------------------------
saveBtn.addEventListener('click', () => {
    // 1. 為了下載，我們必須臨時將 HTML 的線稿圖片作為 Fabric Canvas 的背景
    
    // 臨時將 HTML 圖片設為 Canvas 背景 (使用 bottleImg.src)
    canvas.setBackgroundImage(bottleImg.src, canvas.renderAll.bind(canvas), {
        // 使用圖片的自然寬高來計算比例，確保不失真
        scaleX: canvas.getWidth() / bottleImg.naturalWidth,
        scaleY: canvas.getHeight() / bottleImg.naturalHeight,
        // 確保背景圖片在下載時能完全覆蓋 Canvas 區域
        top: 0,
        left: 0
    });
    
    // 隱藏所有用戶可編輯的控制項
    canvas.discardActiveObject();
    canvas.renderAll();
    
    // 等待背景圖片被繪製完成 (重要！因為 setBackgroundImage 是異步的)
    setTimeout(() => {
        
        // 2. 將 Canvas 轉為 Data URL (現在包含線稿背景、顏色、圖案、文字)
        const dataURL = canvas.toDataURL({
            format: 'png',
            quality: 1.0 
        });
        
        // 3. 執行下載
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = 'waterbottle_design.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        // 4. 下載完成後，移除臨時設定的背景圖 (恢復 Canvas 原始狀態)
        canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
        
    }, 100); // 給予短暫的時間讓 Fabric.js 處理背景圖片
});


// --------------------------------------------------------
// 8. 清除按鈕 (保持不變)
// --------------------------------------------------------
clearBtn.addEventListener("click", () => {
    // 移除所有用戶上傳的圖片和文字
    canvas.getObjects().forEach(obj => {
        if (obj.uploaded || obj.textObject) {
            canvas.remove(obj);
        }
    });
    textInput.value = "";
    canvas.renderAll();
});

// --------------------------------------------------------
// 9. 首次初始化 (保持不變)
// --------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // 確保圖片載入完成後才執行初始化 (用於計算比例和尺寸)
    if (bottleImg.complete) {
        resizeAndInitialize();
    } else {
        // 如果圖片還沒載入，等待載入完成
        bottleImg.onload = resizeAndInitialize;
    }
    window.addEventListener("resize", resizeAndInitialize);
});
