// draw.js (最終終極版：使用多個圖片遮罩實現精確著色和裁剪)

// --------------------------------------------------------
// 1. 初始化 Fabric.js Canvas 與 DOM 元素
// --------------------------------------------------------
const canvas = new fabric.Canvas('designCanvas');
const bottleImg = document.getElementById("bottle"); // 假設這是透明背景的線稿圖
let bodyColorRect, capColorRect, handleColorRect; // 獨立顏色層 (全畫布大小)

// 儲存載入的遮罩圖片
let maskCapImage = null;
let maskBodyImage = null;
let maskHandleImage = null;
let maskDesignAreaImage = null; // 用於裁剪用戶圖案和文字

// 載入計數器，確保所有遮罩載入後才初始化
let masksLoadedCount = 0;
const totalMasksToLoad = 4;

// 取得控制項
const colorBody = document.getElementById("colorBody");
const colorCap = document.getElementById("colorCap");
const colorHandle = document.getElementById("colorHandle");
const imgUpload = document.getElementById("imgUpload");
const textInput = document.getElementById("textInput");
const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn"); 

// --------------------------------------------------------
// 2. 載入所有圖片遮罩 (核心變更)
// --------------------------------------------------------
function loadMask(url, targetVar) {
    fabric.Image.fromURL(url, function(img) {
        // 將圖片作為裁剪路徑時，它只需要內部屬性，不直接添加到 Canvas
        img.set({ selectable: false, evented: false, absolutePosition: true });
        // 確保遮罩圖片的尺寸與 Canvas 一致
        img.scaleToWidth(canvas.getWidth());
        img.scaleToHeight(canvas.getHeight());

        targetVar.image = img; // 儲存到物件的 image 屬性
        masksLoadedCount++;
        if (masksLoadedCount === totalMasksToLoad) {
            // 所有遮罩載入完成後才進行初始化
            resizeAndInitialize(); 
        }
    }, { crossOrigin: 'anonymous' });
    return { image: null }; // 返回一個包含 image 屬性的物件，用於後續賦值
}

maskCapImage = loadMask('mask_cap.png', maskCapImage);
maskBodyImage = loadMask('mask_body.png', maskBodyImage);
maskHandleImage = loadMask('mask_handle.png', maskHandleImage);
maskDesignAreaImage = loadMask('mask_design_area.png', maskDesignAreaImage);

// --------------------------------------------------------
// 3. 初始化 Canvas 尺寸與顏色層 (應用圖片遮罩)
// --------------------------------------------------------
function resizeAndInitialize() {
    const rect = bottleImg.getBoundingClientRect();
    canvas.setWidth(rect.width);
    canvas.setHeight(rect.height);
    canvas.clear(); 
    
    const fullWidth = canvas.getWidth();
    const fullHeight = canvas.getHeight();
    
    // 確保所有載入的遮罩尺寸與 Canvas 同步
    [maskCapImage.image, maskBodyImage.image, maskHandleImage.image, maskDesignAreaImage.image].forEach(mask => {
        if (mask) {
            mask.scaleToWidth(fullWidth);
            mask.scaleToHeight(fullHeight);
        }
    });

    // --- 創建顏色層，並應用對應的圖片遮罩 ---
    
    // 1. 瓶身顏色層 (全畫布大小，由 mask_body.png 裁剪)
    bodyColorRect = new fabric.Rect({ 
        left: 0, top: 0, width: fullWidth, height: fullHeight, 
        fill: colorBody.value, selectable: false, opacity: 0.7,
        clipPath: maskBodyImage.image // ★ 應用瓶身遮罩
    });
    
    // 2. 瓶蓋顏色層 (全畫布大小，由 mask_cap.png 裁剪)
    capColorRect = new fabric.Rect({ 
        left: 0, top: 0, width: fullWidth, height: fullHeight, 
        fill: colorCap.value, selectable: false, opacity: 0.8,
        clipPath: maskCapImage.image // ★ 應用瓶蓋遮罩
    });

    // 3. 提帶顏色層 (全畫布大小，由 mask_handle.png 裁剪)
    handleColorRect = new fabric.Rect({ 
        left: 0, top: 0, width: fullWidth, height: fullHeight, 
        fill: colorHandle.value, selectable: false, opacity: 0.9,
        clipPath: maskHandleImage.image // ★ 應用提帶遮罩
    });
    
    // ======================================
    // 添加並排序圖層
    // ======================================
    canvas.add(bodyColorRect, capColorRect, handleColorRect);
    
    // 確保顏色層相互排序
    bodyColorRect.sendToBack();
    capColorRect.bringToFront();
    handleColorRect.bringToFront(); 
    
    canvas.renderAll();
}

// --------------------------------------------------------
// 4. 綁定事件：顏色切換 (更新矩形顏色)
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
// 5. 圖片上傳 (應用瓶身裁剪)
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
                clipPath: maskDesignAreaImage.image // ★ 應用圖案裁剪遮罩
            });

            canvas.add(img);
            img.bringToFront(); // 確保圖案在所有顏色層之上
            canvas.renderAll();
        });
    };
    reader.readAsDataURL(file);
});

// --------------------------------------------------------
// 6. 文字輸入 (應用瓶身裁剪)
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
            clipPath: maskDesignAreaImage.image // ★ 應用文字裁剪遮罩
        });
        canvas.add(textObj);
        textObj.bringToFront(); // 確保文字在所有顏色層之上
    }
    canvas.renderAll();
});


// --------------------------------------------------------
// 7. 下載設計圖功能 (保持正確的圖層順序)
// --------------------------------------------------------
saveBtn.addEventListener('click', () => {
    canvas.setBackgroundImage(bottleImg.src, canvas.renderAll.bind(canvas), {
        scaleX: canvas.getWidth() / bottleImg.naturalWidth,
        scaleY: canvas.getHeight() / bottleImg.naturalHeight,
        top: 0, left: 0
    });
    
    canvas.discardActiveObject();
    canvas.renderAll();
    
    setTimeout(() => {
        const dataURL = canvas.toDataURL({ format: 'png', quality: 1.0 });
        const a = document.createElement('a');
        a.href = dataURL;
        a.download = 'waterbottle_design.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        canvas.setBackgroundImage(null, canvas.renderAll.bind(canvas));
    }, 100); 
});


// --------------------------------------------------------
// 8. 清除按鈕
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
// 9. 首次初始化 (等待所有遮罩載入)
// --------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // 這裡的邏輯已經移動到 loadMask 函數中，
    // 確保所有遮罩載入完畢後才調用 resizeAndInitialize
    if (bottleImg.complete) {
        // 如果 bottleImg 已經載入，則依賴 mask 載入計數器
    } else {
        bottleImg.onload = function() {
            // 如果 bottleImg 還沒載入，等待載入完成後不做事，
            // 因為 resizeAndInitialize 會由 masksLoadedCount 觸發
        };
    }
    window.addEventListener("resize", resizeAndInitialize);
});
