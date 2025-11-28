// draw.js (最終零縮放版：內部畫布固定 1024x1024，座標直接對應 Inkscape)

// --------------------------------------------------------
// 1. 定義 SVG 路徑字串 (保持不變)
// --------------------------------------------------------

const capPathString = "m 435.51402,305.60748 86.91589,3.73831 -0.93458,-12.14953 h 67.28972 l -0.93458,12.14953 17.75701,1.86916 -3.73832,-88.78504 -18.69159,-9.3458 -0.93458,-20.56075 -5.60748,-5.60747 h -11.21495 l -8.41121,-37.38318 -31.77571,-8.41121 -44.85981,2.80373 -14.95327,16.82243 -3.73832,35.51402 -13.08411,6.54206 -0.93458,10.28037 -10.28037,7.47664 v 48.59813 z";
const bodyPathString = "m 434.63497,309.4601 -25.20882,13.90832 v 554.59423 l 26.07809,23.47029 73.01868,8.6927 81.71138,-4.34635 32.16298,-17.3854 4.34635,-16.51613 0.86927,-546.7708 -20.86248,-15.64686 h -19.12393 l 13.03904,450.28184 4.34635,16.51612 -25.20882,24.33956 2.60781,13.90832 15.64685,12.16978 v 26.0781 l -14.77758,13.90832 -22.60102,-0.86927 -19.12394,-29.55518 23.47029,-27.81664 v -7.82343 l -19.99321,-18.25467 -1.73854,-18.25466 9.56197,-3.47708 -4.34635,-445.06622 z";
const handlePathString = "m 546.72897,296.26168 -27.1028,2.80374 3.73832,10.28037 23.36448,2.80374 1.86916,449.53271 -8.41121,14.95327 24.29906,22.42991 0.93458,10.28037 -20.56075,21.49533 5.60748,27.10281 22.42991,11.21495 22.4299,-11.21495 3.73832,-24.29907 -5.60748,-15.88785 -12.14953,-6.54206 -2.80374,-13.08411 22.42991,-14.95327 1.86916,-18.69159 -7.47664,-6.54205 5.60748,-87.85047 -2.80374,-82.24299 -3.73832,-105.60748 -1.86916,-96.26168 -6.54205,-73.83178 3.73832,-7.47663 1.86916,-0.93458 -14.0187,-7.47664 z";
const designAreaPathString = "m 447.66355,338.31776 -13.08411,528.97196 88.78505,-4.6729 15.88785,-523.36448 z"; 


// --------------------------------------------------------
// 2. 初始化 Fabric.js Canvas 與 DOM 元素
// --------------------------------------------------------
const canvas = new fabric.Canvas('designCanvas');
const bottleImg = document.getElementById("bottle"); 
let bodyColorPath, capColorPath, handleColorPath; 
let designAreaClipPath; 

// DOM 元素 (保持不變)
const colorBody = document.getElementById("colorBody");
const colorCap = document.getElementById("colorCap");
const colorHandle = document.getElementById("colorHandle");
const imgUpload = document.getElementById("imgUpload");
const textInput = document.getElementById("textInput");
const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn"); 


// --------------------------------------------------------
// 3. 初始化 Canvas 尺寸與顏色層 (核心：使用 fabric.Path)
// --------------------------------------------------------
function resizeAndInitialize() {
    // 圖片原始尺寸 (Inkscape 畫布尺寸)
    const ACTUAL_SIZE = 1024; 
    
    // ★★★ 關鍵修正：將 Fabric.js 內部畫布尺寸固定為 1024x1024 ★★★
    canvas.setWidth(ACTUAL_SIZE);
    canvas.setHeight(ACTUAL_SIZE);
    canvas.clear(); 
    
    const scaleFactor = 1; // 縮放因子永遠是 1
    
    // 創建 Path 的輔助函數
    const createPath = (pathString, options) => {
        const path = new fabric.Path(pathString, {
            ...options,
            originX: 'left',
            originY: 'top',
        });
        
        // 由於畫布尺寸與 Path 座標一致，所以無需縮放
        path.set({
            scaleX: scaleFactor,
            scaleY: scaleFactor
        });
        
        return path;
    };
    
    // 1. 瓶身顏色層 (底層)
    bodyColorPath = createPath(bodyPathString, { 
        fill: colorBody.value, 
        selectable: false, 
        opacity: 0.7 
    });
    
    // 2. 瓶蓋顏色層
    capColorPath = createPath(capPathString, { 
        fill: colorCap.value, 
        selectable: false, 
        opacity: 0.8
    });

    // 3. 提帶顏色層
    handleColorPath = createPath(handlePathString, { 
        fill: colorHandle.value, 
        selectable: false, 
        opacity: 0.9
    });
    
    // 4. 裁剪路徑 (設計區域) 
    designAreaClipPath = createPath(designAreaPathString, {
        absolutePosition: true,
        selectable: false,
        evented: false,
        fill: 'transparent', 
    });
    
    // ======================================
    // 添加並排序圖層
    // ======================================
    canvas.add(bodyColorPath, capColorPath, handleColorPath);
    
    bodyColorPath.sendToBack();
    capColorPath.bringToFront();
    handleColorPath.bringToFront(); 
    
    canvas.renderAll();
}


// --------------------------------------------------------
// 4. 綁定事件：顏色切換 (保持不變)
// --------------------------------------------------------
function updatePathColor() {
    if (capColorPath) capColorPath.set('fill', colorCap.value);
    if (bodyColorPath) bodyColorPath.set('fill', colorBody.value);
    if (handleColorPath) handleColorPath.set('fill', colorHandle.value);
    canvas.renderAll();
}

colorBody.addEventListener("input", updatePathColor);
colorCap.addEventListener("input", updatePathColor);
colorHandle.addEventListener("input", updatePathColor);


// --------------------------------------------------------
// 5. 圖片上傳 (使用固定座標)
// --------------------------------------------------------
imgUpload.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(f) {
        const dataURL = f.target.result;

        fabric.Image.fromURL(dataURL, function(img) {
            canvas.getObjects().filter(obj => obj.uploaded).forEach(obj => canvas.remove(obj));
            
            img.set({
                uploaded: true, 
                // 由於畫布是 1024x1024，這裡的縮放需要對應到畫布尺寸
                scaleX: 0.25, scaleY: 0.25, 
                // 使用固定座標，例如放置在設計區域的中心附近 (400, 500 左右)
                left: 450, 
                top: 500,
                hasControls: true, 
                clipPath: designAreaClipPath 
            });

            canvas.add(img);
            img.bringToFront(); 
            canvas.renderAll();
        });
    };
    reader.readAsDataURL(file);
});


// --------------------------------------------------------
// 6. 文字輸入 (使用固定座標)
// --------------------------------------------------------
textInput.addEventListener("input", () => {
    canvas.getObjects().filter(obj => obj.textObject).forEach(obj => canvas.remove(obj));
    
    if (textInput.value) {
        const textObj = new fabric.Text(textInput.value, {
            textObject: true, 
            fontSize: 60, // 稍微調大字體以適應 1024x1024 畫布
            fill: 'black',
            // 使用固定座標
            left: 400,
            top: 700,
            hasControls: true,
            clipPath: designAreaClipPath 
        });
        canvas.add(textObj);
        textObj.bringToFront(); 
    }
    canvas.renderAll();
});


// --------------------------------------------------------
// 7. 清除圖案/文字 (保持不變)
// --------------------------------------------------------
clearBtn.addEventListener("click", () => {
    canvas.getObjects().filter(obj => obj.uploaded || obj.textObject).forEach(obj => canvas.remove(obj));
    textInput.value = "";
    imgUpload.value = "";
    canvas.renderAll();
});


// --------------------------------------------------------
// 8. 下載設計圖 (保持不變)
// --------------------------------------------------------
saveBtn.addEventListener("click", () => {
    const originalOpacityBody = bodyColorPath.opacity;
    const originalOpacityCap = capColorPath.opacity;
    const originalOpacityHandle = handleColorPath.opacity;

    bodyColorPath.set({ opacity: 1 });
    capColorPath.set({ opacity: 1 });
    handleColorPath.set({ opacity: 1 });

    canvas.renderAll();

    const dataURL = canvas.toDataURL({
        format: 'png',
        quality: 1
    });

    const link = document.createElement('a');
    link.href = dataURL;
    link.download = 'custom_bottle_design.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    bodyColorPath.set({ opacity: originalOpacityBody });
    capColorPath.set({ opacity: originalOpacityCap });
    handleColorPath.set({ opacity: originalOpacityHandle });
    canvas.renderAll();
});


// --------------------------------------------------------
// 9. 基礎初始化 (保持不變)
// --------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    if (bottleImg.complete) {
        resizeAndInitialize();
    } else {
        bottleImg.onload = resizeAndInitialize;
    }
    // 響應式：不需要在 resize 時重新計算 Path，因為內部畫布尺寸已固定。
    window.addEventListener("resize", () => {
        canvas.renderAll();
    });
});
