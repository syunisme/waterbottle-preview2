// draw.js - 最終穩定對齊版本 (偏移量應用於 Group 內的子 Path)

// --------------------------------------------------------
// 1. SVG 路徑定義 (來自 Inkscape 導出的原始座標)
// --------------------------------------------------------
const capPathString = "m 435.51402,305.60748 86.91589,3.73831 -0.93458,-12.14953 h 67.28972 l -0.93458,12.14953 17.75701,1.86916 -3.73832,-88.78504 -18.69159,-9.3458 -0.93458,-20.56075 -5.60748,-5.60747 h -11.21495 l -8.41121,-37.38318 -31.77571,-8.41121 -44.85981,2.80373 -14.95327,16.82243 -3.73832,35.51402 -13.08411,6.54206 -0.93458,10.28037 -10.28037,7.47664 v 48.59813 z";
const bodyPathString = "m 434.63497,309.4601 -25.20882,13.90832 v 554.59423 l 26.07809,23.47029 73.01868,8.6927 81.71138,-4.34635 32.16298,-17.3854 4.34635,-16.51613 0.86927,-546.7708 -20.86248,-15.64686 h -19.12393 l 13.03904,450.28184 4.34635,16.51612 -25.20882,24.33956 2.60781,13.90832 15.64685,12.16978 v 26.0781 l -14.77758,13.90832 -22.60102,-0.86927 -19.12394,-29.55518 23.47029,-27.81664 v -7.82343 l -19.99321,-18.25467 -1.73854,-18.25466 9.56197,-3.47708 -4.34635,-445.06622 z";
const handlePathString = "m 546.72897,296.26168 -27.1028,2.80374 3.73832,10.28037 23.36448,2.80374 1.86916,449.53271 -8.41121,14.95327 24.29906,22.42991 0.93458,10.28037 -20.56075,21.49533 5.60748,27.10281 22.42991,11.21495 22.4299,-11.21495 3.73832,-24.29907 -5.60748,-15.88785 -12.14953,-6.54206 -2.80374,-13.08411 22.42991,-14.95327 1.86916,-18.69159 -7.47664,-6.54205 5.60748,-87.85047 -2.80374,-82.24299 -3.73832,-105.60748 -1.86916,-96.26168 -6.54205,-73.83178 3.73832,-7.47663 1.86916,-0.93458 -14.0187,-7.47664 z";
const designAreaPathString = "m 447.66355,338.31776 -13.08411,528.97196 88.78505,-4.6729 15.88785,-523.36448 z"; 


// --------------------------------------------------------
// 2. 變數宣告與 DOM 元素獲取
// --------------------------------------------------------
const canvas = new fabric.Canvas('designCanvas');
// const bottleImg = document.getElementById("bottle"); // 線稿圖層
let bodyColorPath, capColorPath, handleColorPath, designAreaClipPath; 
let designImage, designText; // 設計圖案和文字物件

// 控制項
const colorBody = document.getElementById("colorBody"); 
const colorCap = document.getElementById("colorCap"); 
const colorHandle = document.getElementById("colorHandle");
const imgUpload = document.getElementById("imgUpload"); 
const textInput = document.getElementById("textInput"); 
const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn");

let pathGroup; // 宣告 Group 變數


// --------------------------------------------------------
// 3. 初始化 Canvas (核心對齊邏輯)
// --------------------------------------------------------
function resizeAndInitialize() {
    const ACTUAL_SIZE = 1024; 
    
    canvas.setWidth(ACTUAL_SIZE);
    canvas.setHeight(ACTUAL_SIZE);
    canvas.clear(); 
    
    // ★★★ 最終精確偏移量 ★★★
    // 讓 Path 內的 M 座標 (434, 296) 能夠移動到線稿的視覺起點 (約 340, 100)
    const FINAL_OFFSET_X = -95; 
    const FINAL_OFFSET_Y = -196; 

    // 輔助函數：創建 Path 並套用偏移量
    const createPath = (pathString, options) => {
        const path = new fabric.Path(pathString, {
            ...options,
            scaleX: 1, scaleY: 1, 
            originX: 'left',
            originY: 'top',
        });
        
        // **關鍵修正**：將每個 Path 的位置移動到正確的畫布座標
        path.set({
            left: path.left + FINAL_OFFSET_X, 
            top: path.top + FINAL_OFFSET_Y
        });

        return path;
    };
    
    // 1. 創建所有 Path (已內含偏移量)
    bodyColorPath = createPath(bodyPathString, { fill: colorBody.value, selectable: false, opacity: 0.7 });
    capColorPath = createPath(capPathString, { fill: colorCap.value, selectable: false, opacity: 0.8 });
    handleColorPath = createPath(handlePathString, { fill: colorHandle.value, selectable: false, opacity: 0.9 });
    
    // 裁剪路徑 (已內含偏移量)
    designAreaClipPath = createPath(designAreaPathString, { 
        absolutePosition: true, 
        selectable: false, 
        evented: false, 
        fill: 'transparent' 
    });
    
    // 2. 將所有顏色 Path 放入 Group 中
    pathGroup = new fabric.Group([bodyColorPath, capColorPath, handleColorPath], {
        selectable: false,
        // **修正**：Group 自身的 left/top 設為 0，避免二次偏移
        left: 0, 
        top: 0
    });
    
    // 3. 將 Group 和裁剪路徑加入 Canvas
    canvas.add(pathGroup);
    
    // 重新添加設計圖案和文字 (如果它們存在)
    if (designImage) {
        canvas.add(designImage);
        designImage.setControlsVisibility({
            mt: false, mb: false, ml: false, mr: false
        });
    }
    if (designText) {
        canvas.add(designText);
    }

    pathGroup.sendToBack(); 
    canvas.renderAll();
}


// --------------------------------------------------------
// 4. 事件處理函數
// --------------------------------------------------------

function updatePathColor() {
    if (capColorPath) capColorPath.set('fill', colorCap.value);
    if (bodyColorPath) bodyColorPath.set('fill', colorBody.value);
    if (handleColorPath) handleColorPath.set('fill', colorHandle.value);
    canvas.renderAll();
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(f) {
        fabric.Image.fromURL(f.target.result, function(img) {
            // 移除舊的
            if (designImage) canvas.remove(designImage);

            designImage = img;
            
            // 縮放並設定位置
            img.scaleToWidth(designAreaClipPath.width / 2); // 初始設定為裁剪區一半寬度
            img.scaleToHeight(designAreaClipPath.height / 2);
            
            img.set({
                left: designAreaClipPath.left + designAreaClipPath.width / 4,
                top: designAreaClipPath.top + designAreaClipPath.height / 4,
                clipPath: designAreaClipPath,
                lockRotation: true,
                lockScalingX: true,
                lockScalingY: true
            });
            
            canvas.add(designImage);
            canvas.renderAll();
        });
    };
    reader.readAsDataURL(file);
}

function handleTextInput(e) {
    const text = e.target.value;
    if (designText) canvas.remove(designText);

    if (text) {
        designText = new fabric.Text(text, {
            left: designAreaClipPath.left + designAreaClipPath.width / 4,
            top: designAreaClipPath.top + designAreaClipPath.height / 4 + 100, // 初始位置在圖片下方
            fontSize: 40,
            fill: '#000000',
            clipPath: designAreaClipPath,
            lockRotation: true,
            lockScalingX: true,
            lockScalingY: true
        });
        canvas.add(designText);
    }
    canvas.renderAll();
}

function clearDesign() {
    if (designImage) {
        canvas.remove(designImage);
        designImage = null;
        imgUpload.value = ''; // 清空檔案選擇器
    }
    if (designText) {
        canvas.remove(designText);
        designText = null;
        textInput.value = '';
    }
    canvas.renderAll();
}

function saveDesign() {
    // 暫時隱藏線稿圖層 (如果它在 Canvas 上)
    // 這裡我們假設線稿是在 CSS/HTML 中作為背景圖片處理的，所以只需要處理 Canvas 內容

    // 創建一個新的 Canvas 來合併所有內容，並輸出 PNG
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
}


// --------------------------------------------------------
// 5. 事件監聽
// --------------------------------------------------------
colorCap.addEventListener('input', updatePathColor);
colorBody.addEventListener('input', updatePathColor);
colorHandle.addEventListener('input', updatePathColor);
imgUpload.addEventListener('change', handleImageUpload);
textInput.addEventListener('input', handleTextInput);
clearBtn.addEventListener('click', clearDesign);
saveBtn.addEventListener('click', saveDesign);


// --------------------------------------------------------
// 6. 啟動應用程式
// --------------------------------------------------------
resizeAndInitialize();
