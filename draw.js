// draw.js (最終版：多重 PNG 圖片遮罩 - 專為精確 3D 線稿設計)

// --------------------------------------------------------
// 1. 初始化 Fabric.js Canvas 與 DOM 元素
// --------------------------------------------------------
const canvas = new fabric.Canvas('designCanvas');
const bottleImg = document.getElementById("bottle"); 
let bodyColorRect, capColorRect, handleColorRect; 

// 儲存載入的遮罩圖片物件
let maskCapImage = { image: null };
let maskBodyImage = { image: null };
let maskHandleImage = { image: null };
let maskDesignAreaImage = { image: null };

// 載入計數器，確保所有遮罩載入後才初始化
let masksLoadedCount = 0;
const totalMasksToLoad = 4; // cap, body, handle, design_area

// 取得控制項 (保持不變)
const colorBody = document.getElementById("colorBody");
const colorCap = document.getElementById("colorCap");
const colorHandle = document.getElementById("colorHandle");
const imgUpload = document.getElementById("imgUpload");
const textInput = document.getElementById("textInput");
const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn"); 

// --------------------------------------------------------
// 2. 載入所有圖片遮罩 (核心：移除 crossOrigin 確保本地和 GitHub 載入)
// --------------------------------------------------------
function loadMask(url, targetVar) {
    fabric.Image.fromURL(url, function(img) {
        // 將圖片作為裁剪路徑時，它只需要內部屬性
        img.set({ selectable: false, evented: false, absolutePosition: true });
        
        // 確保遮罩圖片的尺寸與 Canvas 一致 (在初始化時會重新計算)
        img.scaleToWidth(canvas.getWidth());
        img.scaleToHeight(canvas.getHeight());

        targetVar.image = img; // 儲存載入的圖片物件
        masksLoadedCount++;
        console.log(`Mask Loaded: ${url}, Count: ${masksLoadedCount}`); // 偵錯用
        
        if (masksLoadedCount === totalMasksToLoad) {
            console.log("All masks loaded, running initialization.");
            resizeAndInitialize(); 
        }
    }); // ★ 注意：這裡已經移除 { crossOrigin: 'anonymous' }
}

// 開始載入遮罩 (假設檔案名稱是 PNG 格式)
loadMask('mask_cap.png', maskCapImage);
loadMask('mask_body.png', maskBodyImage);
loadMask('mask_handle.png', maskHandleImage);
loadMask('mask_design_area.png', maskDesignAreaImage);

// --------------------------------------------------------
// 3. 初始化 Canvas 尺寸與顏色層 (應用圖片遮罩)
// --------------------------------------------------------
function resizeAndInitialize() {
    // 1. 取得線稿圖片的實際顯示尺寸
    const rect = bottleImg.getBoundingClientRect();
    canvas.setWidth(rect.width);
    canvas.setHeight(rect.height);
    canvas.clear(); 
    
    const fullWidth = canvas.getWidth();
    const fullHeight = canvas.getHeight();
    
    // 2. 確保所有載入的遮罩尺寸與 Canvas 同步
    const masks = [maskCapImage.image, maskBodyImage.image, maskHandleImage.image, maskDesignAreaImage.image];
    masks.forEach(mask => {
        if (mask) {
            mask.scaleToWidth(fullWidth);
            mask.scaleToHeight(fullHeight);
        }
    });

    // --- 創建顏色層，並應用對應的圖片遮罩 ---
    
    // 顏色層都設定為全畫布大小 (0, 0)，然後由 clipPath 裁剪
    
    // 1. 瓶身顏色層 (由 mask_body.png 裁剪)
    bodyColorRect = new fabric.Rect({ 
        left: 0, top: 0, width: fullWidth, height: fullHeight, 
        fill: colorBody.value, selectable: false, opacity: 0.7,
        clipPath: maskBodyImage.image // 應用瓶身遮罩
    });
    
    // 2. 瓶蓋顏色層 (由 mask_cap.png 裁剪)
    capColorRect = new fabric.Rect({ 
        left: 0, top: 0, width: fullWidth, height: fullHeight, 
        fill: colorCap.value, selectable: false, opacity: 0.8,
        clipPath: maskCapImage.image // 應用瓶蓋遮罩
    });

    // 3. 提帶顏色層 (由 mask_handle.png 裁剪)
    handleColorRect = new fabric.Rect({ 
        left: 0, top: 0, width: fullWidth, height: fullHeight, 
        fill: colorHandle.value, selectable: false, opacity: 0.9,
        clipPath: maskHandleImage.image // 應用提帶遮罩
    });
    
    // ======================================
    // 添加並排序圖層
    // ======================================
    canvas.add(bodyColorRect, capColorRect, handleColorRect);
    
    // 確保顏色層相互排序
    bodyColorRect.sendToBack();
    capColorRect.bringToFront();
    handleColorRect.bringToFront(); 
    
    // 重新載入所有圖案和文字 (防止它們在遮罩載入前被清除)
    // 這裡需要手動把用戶圖案和文字添加到 canvas.getObjects() 中。
    // 由於我們清除了 canvas，用戶圖案和文字需要重新添加，但這是複雜的狀態管理問題。
    // 在簡單版本中，用戶在顏色載入後再上傳圖案。
    
    canvas.renderAll();
}

// --------------------------------------------------------
// 4. 綁定事件：顏色切換 (保持不變)
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
            // 移除舊的圖案
            canvas.getObjects().filter(obj => obj.uploaded).forEach(obj => canvas.remove(obj));
            
            // 讓圖片顯示在瓶身中間
            img.set({
                uploaded: true, 
                scaleX: 0.25, scaleY: 0.25,
                left: canvas.getWidth() * 0.35, 
                top: canvas.getHeight() * 0.45,
                hasControls: true, 
                // 應用圖案裁剪遮罩
                clipPath: maskDesignAreaImage.image 
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
    // 移除舊的文字
    canvas.getObjects().filter(obj => obj.textObject).forEach(obj => canvas.remove(obj));
    
    if (textInput.value) {
        const textObj = new fabric.Text(textInput.value, {
            textObject: true, 
            fontSize: 40,
            fill: 'black',
            left: canvas.getWidth() * 0.35,
            top: canvas.getHeight() * 0.6,
            hasControls: true,
            clipPath: maskDesignAreaImage.image // 應用文字裁剪遮罩
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
// 9. 首次初始化
// --------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    // 這裡的邏輯是等待所有遮罩載入完成後，由 Section 2 的計數器觸發 resizeAndInitialize
    if (bottleImg.complete) {
        // 如果線稿圖已載入，等待 mask 載入計數器
    } else {
        bottleImg.onload = function() {
            // 如果線稿圖還沒載入，等待載入完成
        };
    }
    window.addEventListener("resize", resizeAndInitialize);
});
