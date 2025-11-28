// draw.js (最終版：使用手動定位的矩形顏色層實現獨立著色)

// --------------------------------------------------------
// 1. 初始化 Fabric.js Canvas 與 DOM 元素
// --------------------------------------------------------
const canvas = new fabric.Canvas('designCanvas');
const bottleImg = document.getElementById("bottle"); // 假設這是透明背景的線稿圖
let bodyColorRect, capColorRect, handleColorRect; // 獨立顏色矩形層

// 取得控制項
const colorBody = document.getElementById("colorBody");
const colorCap = document.getElementById("colorCap");
const colorHandle = document.getElementById("colorHandle");
const imgUpload = document.getElementById("imgUpload");
const textInput = document.getElementById("textInput");
const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn"); 

// --------------------------------------------------------
// 2. 初始化 Canvas 尺寸與顏色層 (核心：手動定位)
// --------------------------------------------------------
function resizeAndInitialize() {
    const rect = bottleImg.getBoundingClientRect();
    canvas.setWidth(rect.width);
    canvas.setHeight(rect.height);
    canvas.clear(); 
    
    const fullWidth = canvas.getWidth();
    const fullHeight = canvas.getHeight();
    
    // --- 刪除舊圖層，重新繪製 ---
    canvas.remove(bodyColorRect, capColorRect, handleColorRect); 

    // ★★★ 核心：手動定位與尺寸調整 ★★★
    
    // 1. 瓶身顏色層 (圓柱主體)
    // 預估瓶身位於畫布中央，寬度約 30%
    bodyColorRect = new fabric.Rect({ 
        left: fullWidth * 0.35, // 左邊界
        top: fullHeight * 0.23,  // 上邊界 (從瓶蓋下方開始)
        width: fullWidth * 0.30, // 寬度
        height: fullHeight * 0.65, // 高度
        fill: colorBody.value, 
        selectable: false, 
        opacity: 0.7 
    });
    
    // 2. 瓶蓋顏色層 (上半部)
    // 預估位於上方，較寬
    capColorRect = new fabric.Rect({ 
        left: fullWidth * 0.30, 
        top: fullHeight * 0.08, 
        width: fullWidth * 0.40, 
        height: fullHeight * 0.15, 
        fill: colorCap.value, 
        selectable: false, 
        opacity: 0.8
    });

    // 3. 提帶顏色層 (中間長條部分)
    // 預估為細長條
    handleColorRect = new fabric.Rect({ 
        left: fullWidth * 0.47, 
        top: fullHeight * 0.25, 
        width: fullWidth * 0.06, 
        height: fullHeight * 0.60, 
        fill: colorHandle.value, 
        selectable: false, 
        opacity: 0.9
    });
    
    // ======================================
    // 應用圖層順序
    // ======================================
    canvas.add(bodyColorRect, capColorRect, handleColorRect);
    
    // 確保顏色層相互排序
    bodyColorRect.sendToBack();
    capColorRect.bringToFront();
    handleColorRect.bringToFront(); // 提帶在最上方
    
    canvas.renderAll();
}

// --------------------------------------------------------
// 3. 綁定事件：顏色切換 (更新矩形顏色)
// --------------------------------------------------------
function updateMaskColor() {
    if (capColorRect) capColorRect.set('fill', colorCap.value);
    if (bodyColorRect) bodyColorRect.set('fill', colorBody.value);
    if (handleColorRect) handleColorRect.set('fill', colorHandle.value);
    canvas.renderAll();
}

colorBody.addEventListener("input", updateMaskColor);
colorCap.addEventListener("input", updateMaskColor);
colorHandle.addEventListener("input", updateMaskColor);


// --------------------------------------------------------
// 4. 圖片上傳 (移除所有裁剪，讓用戶自己移動和調整大小)
// --------------------------------------------------------
imgUpload.addEventListener("change", e => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(f) {
        const dataURL = f.target.result;

        fabric.Image.fromURL(dataURL, function(img) {
            canvas.getObjects().filter(obj => obj.uploaded).forEach(obj => canvas.remove(obj));
            
            // 讓圖片顯示在瓶身中間
            img.set({
                uploaded: true, 
                scaleX: 0.25, scaleY: 0.25,
                left: canvas.getWidth() * 0.35, 
                top: canvas.getHeight() * 0.45,
                hasControls: true, 
                // ★ 移除所有複雜裁剪，用戶可以自由調整位置
            });

            canvas.add(img);
            img.bringToFront(); // 確保圖案在所有顏色層之上

            canvas.renderAll();
        });
    };
    reader.readAsDataURL(file);
});

// --------------------------------------------------------
// 5. 文字輸入 (移除所有裁剪，讓用戶自己移動和調整大小)
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
            // ★ 移除所有複雜裁剪，用戶可以自由調整位置
        });
        canvas.add(textObj);
        textObj.bringToFront(); // 確保文字在所有顏色層之上
    }
    canvas.renderAll();
});


// --------------------------------------------------------
// 6. 下載設計圖功能 (保持正確的圖層順序)
// --------------------------------------------------------
saveBtn.addEventListener('click', () => {
    // 1. 臨時將透明線稿圖設為 Canvas 背景 (位於最底層)
    canvas.setBackgroundImage(bottleImg.src, canvas.renderAll.bind(canvas), {
        scaleX: canvas.getWidth() / bottleImg.naturalWidth,
        scaleY: canvas.getHeight() / bottleImg.naturalHeight,
        top: 0, left: 0
    });
    
    canvas.discardActiveObject();
    canvas.renderAll();
    
    // 2. 異步等待背景圖繪製並下載
    setTimeout(() => {
        const dataURL = canvas.toDataURL({ format: 'png', quality: 1.0 });
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = 'waterbottle_design.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // 3. 恢復 Canvas 狀態，移除臨時背景圖
        canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
    }, 100); 
});


// --------------------------------------------------------
// 7. 清除按鈕
// --------------------------------------------------------
clearBtn.addEventListener("click", () => {
    canvas.getObjects().forEach(obj => {
        if (obj.uploaded || obj.textObject) {
            canvas.remove(obj);
        }
    });
    textInput.value = "";
    canvas.renderAll();
});

// --------------------------------------------------------
// 8. 首次初始化
// --------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    if (bottleImg.complete) {
        resizeAndInitialize();
    } else {
        bottleImg.onload = resizeAndInitialize;
    }
    window.addEventListener("resize", resizeAndInitialize);
});
