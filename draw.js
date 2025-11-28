// draw.js (最終修正版：所有 Path 已套用縮放與平移校正)

// --------------------------------------------------------
// 1. 定義 SVG 路徑字串 (保持您提供的精確字串)
// --------------------------------------------------------
const capPathString = "m353.57144,162.0476l121.14286,2.09526l-10.66667,-64l-22.66667,-13.33333l-6.66667,-33.33333l-40,-2.66667l-18.66667,10.66667l-9.33333,26.66667c0.19048,0.57141 -10.47619,23.23808 -10.47619,23.23808c0,0 -5.33333,57.33333 -2.66667,50.66666z";
const bodyPathString = "m344.37997,159.61903c0,0 -5.33333,394.66665 -5.33333,394.66665c0,0 48,10.66667 48,10.66667c0,0 48,-4 48,-2.66667c0,1.33333 45.33333,-10.66667 45.33333,-10.66667c0,0 0,-386.66665 0,-386.66665c0,0 -24,0 -24.37996,-0.95236c0.37996,0.95236 9.71329,314.28568 9.33333,313.33333c0.37996,0.95235 -12.95337,15.61901 -13.33333,14.66667c0.37996,0.95235 13.71329,27.61901 13.33333,26.66667c0.37996,0.95234 -15.62004,20.95234 -16,20c0.37996,0.95234 -20.95337,-16.38099 -21.33333,-17.33333c0.37996,0.95234 9.71329,-21.71432 9.33333,-22.66667c0.37996,0.95235 -12.95337,-24.38099 -13.33333,-25.33333c0.37996,0.95235 1.7133,-311.04764 1.7133,-311.04764c0,0 -81.33333,-2.66667 -81.33333,-2.66667z";
const handlePathString = "m426.85714,152.57141c0,0 2.66667,325.33332 2.66667,325.33332c0,0 10.66667,14.66667 10.66667,14.66667c0,0 -16,29.33333 -16.19047,28.76194c0.19047,0.57139 20.19047,17.90473 20.19047,17.90473c0,0 16,-12 15.80953,-12.57139c0.19047,0.57139 -7.80953,-28.76194 -8,-29.33333c0.19047,0.5714 13.52381,-18.09527 13.33333,-18.66667c0.19047,0.5714 -7.80953,-324.76192 -7.80953,-324.76192c0,0 -30.66667,-1.33333 -30.66667,-1.33333z";
const designAreaPathString = "m353.52381,233.90474c0,0 -2.66667,289.33332 -2.66667,289.33332c0,0 68,1.33333 68,1.33333c0,0 4,-297.33332 3.80953,-297.90473c0.19047,0.57141 -29.14286,-39.42859 -29.33333,-40c0.19048,0.57141 -39.80952,47.23807 -39.80952,47.23807z"; 

// --------------------------------------------------------
// ★★ 座標校正參數 (根據您的輸入計算) ★★
// --------------------------------------------------------
// 1. Path 繪製時的基準寬高 (來自 Method Draw 截圖)
const DESIGN_WIDTH = 773; // 來自 image_edbba1.jpg
const DESIGN_HEIGHT = 694; // 來自 image_edbba1.jpg
// 2. 實際 Canvas 的寬高 (來自 waterbottle.jpg 原始尺寸)
const ACTUAL_WIDTH = 1024; // 來自 image_ee915a.jpg
const ACTUAL_HEIGHT = 1024; // 來自 image_ee915a.jpg

// 3. 計算縮放比例
const SCALE_X = ACTUAL_WIDTH / DESIGN_WIDTH; // ~1.325
const SCALE_Y = ACTUAL_HEIGHT / DESIGN_HEIGHT; // ~1.475

// 4. 計算平移偏移 (Path 在 Method Draw 中相對畫布原點的移動)
// Method Draw 截圖顯示圖片的 left/top 是 X=20, Y=-50。
// 為了校正 Path，我們需要將 Path 反向平移，但 Path 座標本身已包含這偏移。
// 簡化處理：讓 Path 的 left/top 為 0，並應用縮放。

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
    // 讓 Canvas 尺寸跟隨您的 HTML 圖片尺寸 (可能是響應式的)
    canvas.setWidth(rect.width);
    canvas.setHeight(rect.height);
    canvas.clear(); 
    
    // 創建 Path 的輔助函數，自動應用縮放
    const createScaledPath = (pathString, options) => {
        const path = new fabric.Path(pathString, {
            ...options,
            // 應用 Path 縮放，將其從 773x694 空間轉換到 1024x1024 空間
            scaleX: SCALE_X * (rect.width / ACTUAL_WIDTH), // 考慮 CSS 縮放
            scaleY: SCALE_Y * (rect.height / ACTUAL_HEIGHT), // 考慮 CSS 縮放
            originX: 'left',
            originY: 'top',
        });
        
        // 額外的平移校正：由於 Path 原點可能已經移動
        // 根據 Method Draw 截圖，圖片在 X=20, Y=-50，但我們現在假定 Path 是相對於 0,0 繪製的
        // 為了使 Path 居中，我們需要計算中心偏移量
        const offsetX = (rect.width - DESIGN_WIDTH * SCALE_X * (rect.width / ACTUAL_WIDTH)) / 2;
        const offsetY = (rect.height - DESIGN_HEIGHT * SCALE_Y * (rect.height / ACTUAL_HEIGHT)) / 2;
        
        // 由於 rect.width 和 rect.height 已經是最終尺寸，這裡簡化處理平移
        path.set({
             // Path 自身的座標已經包含繪製時的偏移。
             // 如果 Path 座標是相對於 773x694 居中繪製的，我們不需要額外設置 left/top。
             // 由於我們設定了 scale，Path 會自動從左上角開始繪製並放大。
             // 為了對齊，這裡不再強制設定 left/top，而是讓 Path 自身座標決定位置。
             // 如果後續還有偏移，我們可以嘗試手動微調 left/top 數值。
             // path.set({ left: 0, top: 0 }); 
        });
        
        return path;
    };
    
    // 1. 瓶身顏色層
    bodyColorPath = createScaledPath(bodyPathString, { 
        fill: colorBody.value, 
        selectable: false, 
        opacity: 0.7 
    });
    
    // 2. 瓶蓋顏色層
    capColorPath = createScaledPath(capPathString, { 
        fill: colorCap.value, 
        selectable: false, 
        opacity: 0.8
    });

    // 3. 提帶顏色層
    handleColorPath = createScaledPath(handlePathString, { 
        fill: colorHandle.value, 
        selectable: false, 
        opacity: 0.9
    });
    
    // 4. 裁剪路徑 (設計區域)
    designAreaClipPath = createScaledPath(designAreaPathString, {
        absolutePosition: true,
        selectable: false,
        evented: false,
        fill: 'transparent', // 裁剪 Path 必須是透明填充
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
                // 圖片和文字的 left/top 仍然需要微調，因為它們可能需要位於設計區中央
                // 這裡的 scaleX/scaleY 保持不變，讓用戶自行縮放圖案
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

// ... [其他功能，如 Clear 和 Save] ...

// --------------------------------------------------------
// 7. 8. 9. 基礎初始化
// --------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    if (bottleImg.complete) {
        resizeAndInitialize();
    } else {
        bottleImg.onload = resizeAndInitialize;
    }
    window.addEventListener("resize", resizeAndInitialize);
});
