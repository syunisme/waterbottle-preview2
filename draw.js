// draw.js (使用 Fabric.js 實現分區著色與圖片裁剪)

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

// --------------------------------------------------------
// 2. Path 原始定義 (保留，用於座標參考和 Path 字串生成)
// --------------------------------------------------------
// 這些函數不再直接繪製，只作為 path 字串生成的參考。
// 座標基於您提供的原始數據 (寬度約 300px)

// ① 瓶蓋 Path
function pathCap(ctx) {
    // M 90 40 Q 150 -10, 210 40 Q 230 90, 210 130 L 90 130 Q 70 90, 90 40 Z
}
// ② 瓶身 Path
function pathBody(ctx) {
    // M 70 140 Q 55 170, 55 210 L 55 500 Q 55 540, 90 560 L 215 560 Q 245 540, 245 500 L 245 210 Q 245 170, 230 140 Z
}
// ③ 提帶 + 圓環 Path
function pathStrap(ctx) {
    // M 150 180 L 172 180 L 172 430 L 150 430 Z ... (組合 Path)
}

// --------------------------------------------------------
// 3. 根據 Path 類型返回 Fabric.js Path Data 字串
// --------------------------------------------------------
function getFabricPath(type) {
    switch (type) {
        case 'cap':
            return 'M 90 40 Q 150 -10, 210 40 Q 230 90, 210 130 L 90 130 Q 70 90, 90 40 Z';
        case 'body':
            return 'M 70 140 Q 55 170, 55 210 L 55 500 Q 55 540, 90 560 L 215 560 Q 245 540, 245 500 L 245 210 Q 245 170, 230 140 Z';
        case 'strap':
            // 組合 Path: 直條帶子 + 上下兩個圓環
            return 'M 150 180 L 172 180 L 172 430 L 150 430 Z ' + 
                   'M 186 460 A 25 25 0 1 1 136 460 A 25 25 0 1 1 186 460 Z ' + 
                   'M 196 515 A 35 35 0 1 1 126 515 A 35 35 0 1 1 196 515 Z';
        default:
            return '';
    }
}

// --------------------------------------------------------
// 4. 初始化 Canvas 尺寸與 Mask 物件
// --------------------------------------------------------
function resizeAndInitialize() {
    const rect = bottleImg.getBoundingClientRect();
    canvas.setWidth(rect.width);
    canvas.setHeight(rect.height);
    canvas.clear(); // 清除所有舊物件

    // 縮放比例 (基於您的 Path 座標寬度 300px)
    const scale = rect.width / 300; 
    
    // ======================================
    // A. 創建瓶身裁剪路徑 (用於用戶圖案 Clipping)
    // ======================================
    const clipPathData = getFabricPath('body');
    const clipPath = new fabric.Path(clipPathData);
    clipPath.set({
        absolutePosition: true, 
        scaleX: scale, scaleY: scale,
        selectable: false,
        evented: false, 
        fill: 'transparent'
    });
    canvas.clipPath = clipPath; // 儲存為 Canvas 屬性，供圖片上傳使用

    // ======================================
    // B. 創建顏色遮罩 (用於分區著色)
    // ======================================
    
    // 瓶身顏色遮罩
    bodyMask = new fabric.Path(getFabricPath('body'));
    bodyMask.set({ fill: colorBody.value, scaleX: scale, scaleY: scale, selectable: false, opacity: 0.7 });
    
    // 瓶蓋顏色遮罩
    capMask = new fabric.Path(getFabricPath('cap'));
    capMask.set({ fill: colorCap.value, scaleX: scale, scaleY: scale, selectable: false, opacity: 0.8 });
    
    // 提帶顏色遮罩
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

    // 重新應用裁剪路徑和 Z-index 到現有用戶圖案和文字
    canvas.getObjects().forEach(obj => {
        if (obj.uploaded) {
            obj.set({ clipPath: canvas.clipPath });
            obj.sendToBack();
            bodyMask.sendToBack();
        }
        if (obj.textObject) {
            obj.sendToBack();
            bodyMask.sendToBack();
        }
    });

    canvas.renderAll();
}

// --------------------------------------------------------
// 5. 綁定事件：顏色切換
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
// 6. 綁定事件：圖片上傳 (實作圖片裁剪)
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
            
            // 調整圖片的初始大小和位置
            img.set({
                uploaded: true, // 標記為上傳的物件
                scaleX: 0.25, scaleY: 0.25,
                left: canvas.getWidth() * 0.2, // 預設位置在瓶身範圍內
                top: canvas.getHeight() * 0.35,
                hasControls: true, 
                // ★ 應用裁剪模具
                clipPath: canvas.clipPath 
            });

            canvas.add(img);
            
            // 確保圖片在瓶身顏色層的下方，這樣顏色會像是半透明的瓶身蓋在圖片上
            img.sendToBack(); 
            bodyMask.sendToBack(); // 讓瓶身顏色層在圖片的下面

            canvas.renderAll();
        });
    };
    reader.readAsDataURL(file);
});

// --------------------------------------------------------
// 7. 綁定事件：文字輸入
// --------------------------------------------------------
textInput.addEventListener("input", () => {
    // 移除所有舊的文字物件
    canvas.getObjects().filter(obj => obj.textObject).forEach(obj => canvas.remove(obj));
    
    if (textInput.value) {
        const textObj = new fabric.Text(textInput.value, {
            textObject: true, // 標記為文字物件
            fontSize: 40,
            fill: 'black',
            left: canvas.getWidth() * 0.3,
            top: canvas.getHeight() * 0.55,
            hasControls: true,
            // ★ 文字也應用裁剪模具
            clipPath: canvas.clipPath 
        });
        canvas.add(textObj);
        textObj.sendToBack();
        bodyMask.sendToBack();
    }
    canvas.renderAll();
});


// --------------------------------------------------------
// 8. 清除按鈕
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
// 9. 首次初始化
// --------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // 確保圖片載入完成後才執行初始化 (用於計算比例)
    if (bottleImg.complete) {
        resizeAndInitialize();
    } else {
        bottleImg.onload = resizeAndInitialize;
    }
    window.addEventListener("resize", resizeAndInitialize);
});
