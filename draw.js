// draw.js (最終精準版：使用統一邊界校準對齊)

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
let bodyColorPath, capColorPath, handleColorPath, designAreaClipPath; 
// ... (DOM 元素宣告省略)


// --------------------------------------------------------
// 3. 初始化 Canvas 尺寸與顏色層 (核心修正區)
// --------------------------------------------------------
function resizeAndInitialize() {
    const ACTUAL_SIZE = 1024; 
    
    // 將 Fabric.js 內部畫布尺寸固定為 1024x1024
    canvas.setWidth(ACTUAL_SIZE);
    canvas.setHeight(ACTUAL_SIZE);
    canvas.clear(); 
    
    // 創建 Path 的輔助函數 (不包含 left/top 偏移)
    const createPath = (pathString, options) => {
        return new fabric.Path(pathString, {
            ...options,
            scaleX: 1, scaleY: 1, // 尺寸固定，無需縮放
            originX: 'left',
            originY: 'top',
        });
    };
    
    // 1. 創建所有 Path
    bodyColorPath = createPath(bodyPathString, { fill: colorBody.value, selectable: false, opacity: 0.7 });
    capColorPath = createPath(capPathString, { fill: colorCap.value, selectable: false, opacity: 0.8 });
    handleColorPath = createPath(handlePathString, { fill: colorHandle.value, selectable: false, opacity: 0.9 });
    designAreaClipPath = createPath(designAreaPathString, { absolutePosition: true, selectable: false, evented: false, fill: 'transparent' });
    
    // ======================================
    // ★★★ 核心修正：計算並應用統一偏移量 ★★★
    // ======================================
    
    // 1. 找出所有 Path 的最小 X/Y 座標 (Path 的實際繪製起始點)
    const allPaths = [bodyColorPath, capColorPath, handleColorPath];
    let minX = Infinity;
    let minY = Infinity;

    allPaths.forEach(path => {
        // getBoundingRect(false) 取得 Path 在畫布上的實際座標
        const rect = path.getBoundingRect(false); 
        if (rect.left < minX) minX = rect.left;
        if (rect.top < minY) minY = rect.top;
    });

    // 2. 決定線稿的目標位置 (根據 Inkscape 圖，瓶子線稿從 Y=100 左右開始)
    // 瓶子的理想 X 起始位置 (根據線稿圖目測，瓶子整體寬度約 350，中心約 512，左側約 340)
    const TARGET_X_START = 340; 
    // 瓶子的理想 Y 起始位置 (瓶蓋頂部)
    const TARGET_Y_START = 100; 

    // 3. 計算所需的整體移動量
    const FINAL_OFFSET_X = TARGET_X_START - minX;
    const FINAL_OFFSET_Y = TARGET_Y_START - minY; 
    
    console.log(`Path minX: ${minX}, Path minY: ${minY}`);
    console.log(`FINAL_OFFSET_X: ${FINAL_OFFSET_X}, FINAL_OFFSET_Y: ${FINAL_OFFSET_Y}`);


    // 4. 應用最終偏移量到所有 Path (包括裁剪路徑)
    [bodyColorPath, capColorPath, handleColorPath, designAreaClipPath].forEach(path => {
        path.set({
            left: path.left + FINAL_OFFSET_X,
            top: path.top + FINAL_OFFSET_Y
        });
    });


    // ======================================
    // 添加並排序圖層 (保持不變)
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
colorHandle.addEventListener("input", updateHandleColor);


// --------------------------------------------------------
// 5. 圖片上傳 (使用線稿的中心點座標)
// --------------------------------------------------------
imgUpload.addEventListener("change", e => {
    // ... (FileReader 程式碼省略) ...

    fabric.Image.fromURL(dataURL, function(img) {
        canvas.getObjects().filter(obj => obj.uploaded).forEach(obj => canvas.remove(obj));
        
        // 使用線稿的視覺中心點作為圖案的初始位置 (與Path無關)
        img.set({
            uploaded: true, 
            scaleX: 0.25, scaleY: 0.25, 
            left: 512, // 1024/2
            top: 550, // 設計區中心附近
            hasControls: true, 
            clipPath: designAreaClipPath 
        });

        canvas.add(img);
        img.bringToFront(); 
        canvas.renderAll();
    });
    // ... (FileReader 程式碼省略) ...
});


// --------------------------------------------------------
// 6. 文字輸入 (使用線稿的中心點座標)
// --------------------------------------------------------
textInput.addEventListener("input", () => {
    canvas.getObjects().filter(obj => obj.textObject).forEach(obj => canvas.remove(obj));
    
    if (textInput.value) {
        const textObj = new fabric.Text(textInput.value, {
            textObject: true, 
            fontSize: 60, 
            fill: 'black',
            left: 512, 
            top: 750, // 設計區下方位置
            hasControls: true,
            clipPath: designAreaClipPath 
        });
        canvas.add(textObj);
        textObj.bringToFront(); 
    }
    canvas.renderAll();
});


// --------------------------------------------------------
// 7, 8, 9 保持不變
// --------------------------------------------------------
// ... (清除圖案、下載設計圖、基礎初始化 程式碼保持不變)
