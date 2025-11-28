// draw.js (最終模擬版：使用模擬的 SVG Path 字串)

// --------------------------------------------------------
// 1. 定義 SVG 路徑字串 (★★ 這是基於您水壺線稿圖的模擬字串 ★★)
// --------------------------------------------------------
// 注意：以下座標假設 Canvas 大小約為 400x800 像素
// M = Move to (移動到), L = Line to (畫線到), Q = Quadratic Bezier (二次貝塞爾曲線)

// 瓶蓋路徑 (模擬頂部的弧度)
const capPathString = "M 120 100 L 280 100 Q 300 120, 300 150 L 300 180 L 100 180 L 100 150 Q 100 120, 120 100 Z";

// 瓶身路徑 (模擬兩側的弧度，底部略圓)
const bodyPathString = "M 100 180 L 100 680 Q 100 700, 120 710 L 280 710 Q 300 700, 300 680 L 300 180 Z";

// 提帶路徑 (模擬細長條，底部圓形)
const handlePathString = "M 200 190 L 220 190 L 220 580 C 220 620, 200 620, 200 580 L 200 190 Z M 190 600 A 30 30 0 1 0 230 600 A 30 30 0 1 0 190 600 Z";

// 設計區域路徑 (瓶身中央，用於裁剪圖案和文字)
const designAreaPathString = "M 110 250 L 110 650 L 290 650 L 290 250 Z"; 


// --------------------------------------------------------
// 2. 初始化 Fabric.js Canvas 與 DOM 元素
// --------------------------------------------------------
const canvas = new fabric.Canvas('designCanvas');
const bottleImg = document.getElementById("bottle"); 
let bodyColorPath, capColorPath, handleColorPath; 
let designAreaClipPath; 

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
    const rect = bottleImg.getBoundingClientRect();
    canvas.setWidth(rect.width);
    canvas.setHeight(rect.height);
    canvas.clear(); 
    
    // 創建顏色層 - 使用 fabric.Path (Path 物件本身就是形狀)
    
    // 1. 瓶身顏色層
    bodyColorPath = new fabric.Path(bodyPathString, { 
        fill: colorBody.value, 
        selectable: false, 
        opacity: 0.7 
    });
    
    // 2. 瓶蓋顏色層
    capColorPath = new fabric.Path(capPathString, { 
        fill: colorCap.value, 
        selectable: false, 
        opacity: 0.8
    });

    // 3. 提帶顏色層
    handleColorPath = new fabric.Path(handlePathString, { 
        fill: colorHandle.value, 
        selectable: false, 
        opacity: 0.9
    });
    
    // 4. 裁剪路徑 (用於用戶圖案/文字)
    designAreaClipPath = new fabric.Path(designAreaPathString, {
        absolutePosition: true,
        selectable: false,
        evented: false
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
// 4. 綁定事件：顏色切換 (更新 Path 顏色)
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
// 5. 圖片上傳 (應用 Path 裁剪)
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
                scaleX: 0.25, scaleY: 0.25,
                left: canvas.getWidth() * 0.35, 
                top: canvas.getHeight() * 0.45,
                hasControls: true, 
                clipPath: designAreaClipPath // 應用 Path 裁剪
            });

            canvas.add(img);
            img.bringToFront(); 
            canvas.renderAll();
        });
    };
    reader.readAsDataURL(file);
});

// --------------------------------------------------------
// 6. 文字輸入 (應用 Path 裁剪)
// --------------------------------------------------------
textInput.addEventListener("input", () => {
    canvas.getObjects().filter(obj => obj.textObject).forEach(obj => canvas.remove(obj));
    
    if (textInput.value) {
        const textObj = new fabric.Text(textInput.value, {
            textObject: true, 
            fontSize: 40,
            fill: 'black',
            left: canvas.getWidth() * 0.35,
            top: canvas.getHeight() * 0.6,
            hasControls: true,
            clipPath: designAreaClipPath // 應用 Path 裁剪
        });
        canvas.add(textObj);
        textObj.bringToFront(); 
    }
    canvas.renderAll();
});


// --------------------------------------------------------
// 7. 8. 9. 基礎初始化 (保持不變)
// --------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    // 由於沒有異步載入，直接在 DOM 載入後初始化
    if (bottleImg.complete) {
        resizeAndInitialize();
    } else {
        bottleImg.onload = resizeAndInitialize;
    }
    window.addEventListener("resize", resizeAndInitialize);
});
