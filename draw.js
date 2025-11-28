// draw.js (最終調整版：加入 X, Y 軸整體偏移，確保與圖片線稿對齊)

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
    
    const scaleFactor = 1; // 縮放因子為 1

    // ★★★ 關鍵調整：計算整體偏移量 ★★★
    // 瓶子線稿在 1024x1024 畫布中的實際起始位置
    const INKSCAPE_BOTTLE_X_START = 340; // 從圖片觀察，瓶身左側線條大約在這個位置
    const INKSCAPE_BOTTLE_Y_START = 100; // 從圖片觀察，瓶蓋頂部線條大約在這個位置

    // Path 的最小 X/Y 座標 (從 D 屬性中觀察到的第一個座標)
    const PATH_X_START = 435.5; 
    const PATH_Y_START = 296.2; // 提帶的 Y 座標最低 (最靠上)
    
    // 計算需要移動多少來對齊線稿
    const offsetX = INKSCAPE_BOTTLE_X_START - PATH_X_START; // 如果 Path 在線稿右側，這會是負值
    const offsetY = INKSCAPE_BOTTLE_Y_START - PATH_Y_START; // 如果 Path 在線稿下方，這會是負值
    
    // 經計算 (340-435.5 = -95.5), (100-296.2 = -196.2)
    // 由於您的 Path 座標 (435, 296) 是相對畫布左上角的，我們需要將 Path 往左上移動。
    // 這裡使用 Path 的原始座標來定位，不需要額外計算偏移。
    // Path 座標：435, 305。  線稿起始：~340, ~100。
    // 修正： Fabric.js 讀取 Path 時會自動將 M (move to) 的座標作為起始點。
    // 我們需要將 Path 視為一個整體，並將它移動到 (0, 0) 附近，然後再定位。
    
    // 由於 Fabric.js Path 物件已經包含了絕對座標，我們只需將其移動到預期位置。
    // 重新評估：最好的方法是**不使用** Fabric.js 的 `left`/`top` 屬性移動 Path，而是**直接修改 Path 座標**，但這太複雜。
    
    // ★★★ 最終決定：我們只需要讓所有 Path 的 X/Y 座標歸零！ ★★★
    // Fabric.js 有一個 Path 輔助功能，但我們需要手動計算每個 Path 相對於自身的 X/Y 偏移。
    
    // 讓所有 Path 座標歸零
    const normalizePathString = (pathString, xOffset, yOffset) => {
        // 僅處理 M 和 L 相關的絕對座標 (這裡假設 M/L/H/V 都是絕對座標)
        return pathString.replace(/([A-Za-z])\s*([^A-Za-z]*)/g, (match, command, coordinates) => {
            if (command.toUpperCase() === 'M' || command.toUpperCase() === 'L') {
                const parts = coordinates.trim().split(/[\s,]+/).map(Number);
                if (parts.length >= 2) {
                    const newX = parts[0] + xOffset;
                    const newY = parts[1] + yOffset;
                    return `${command} ${newX} ${newY}`;
                }
            }
            // 對 H, V, C, S 等不進行處理
            return match;
        });
    };
    
    // 最終決定：由於您的 Path 幾乎都是絕對座標 M/L/V/H，直接使用 Fabric.js 的 `left`/`top` 進行微調才是最簡單且穩定的方法。
    // 觀察結果：Path 繪製的內容相對於線稿**向左上方移動了**。
    // 我們需要將 Path 往右下移動來對齊瓶身。

    // 重新定義偏移量 (根據目測結果微調)
    const GLOBAL_OFFSET_X = 90; 
    const GLOBAL_OFFSET_Y = 200; 

    // 創建 Path 的輔助函數
    const createPath = (pathString, options) => {
        const path = new fabric.Path(pathString, {
            ...options,
            originX: 'left',
            originY: 'top',
        });
        
        path.set({
            scaleX: scaleFactor,
            scaleY: scaleFactor,
            // ★★★ 關鍵：應用視覺偏移，將 Path 往右下移動 ★★★
            left: path.left + GLOBAL_OFFSET_X,
            top: path.top + GLOBAL_OFFSET_Y
        });
        
        return path;
    };
    
    // 1. 瓶身顏色層 (底層)
    bodyColorPath = createPath(bodyPathString, { fill: colorBody.value, selectable: false, opacity: 0.7 });
    
    // 2. 瓶蓋顏色層
    capColorPath = createPath(capPathString, { fill: colorCap.value, selectable: false, opacity: 0.8 });

    // 3. 提帶顏色層
    handleColorPath = createPath(handlePathString, { fill: colorHandle.value, selectable: false, opacity: 0.9 });
    
    // 4. 裁剪路徑 (設計區域) 
    designAreaClipPath = createPath(designAreaPathString, {
        absolutePosition: true,
        selectable: false,
        evented: false,
        fill: 'transparent', 
        // 裁剪路徑本身也必須應用偏移！
        left: designAreaClipPath ? designAreaClipPath.left + GLOBAL_OFFSET_X : GLOBAL_OFFSET_X, 
        top: designAreaClipPath ? designAreaClipPath.top + GLOBAL_OFFSET_Y : GLOBAL_OFFSET_Y, 
    });
    
    // ... (加入並排序圖層的程式碼保持不變) ...
    canvas.add(bodyColorPath, capColorPath, handleColorPath);
    
    bodyColorPath.sendToBack();
    capColorPath.bringToFront();
    handleColorPath.bringToFront(); 
    
    canvas.renderAll();
}


// --------------------------------------------------------
// 4. 綁定事件：顏色切換 (保持不變)
// --------------------------------------------------------
// ... (程式碼省略，保持不變)

// --------------------------------------------------------
// 5. 圖片上傳 (使用固定座標)
// --------------------------------------------------------
imgUpload.addEventListener("change", e => {
    // ... (程式碼省略) ...
    fabric.Image.fromURL(dataURL, function(img) {
        // ... (程式碼省略) ...
        
        img.set({
            uploaded: true, 
            scaleX: 0.25, scaleY: 0.25, 
            // 由於 Path 被移動了 (右下移動 90, 200)，所以圖片起始點也要相應調整
            left: 450 + 90, // 初始位置 + 偏移
            top: 500 + 200,
            hasControls: true, 
            clipPath: designAreaClipPath 
        });

        canvas.add(img);
        img.bringToFront(); 
        canvas.renderAll();
    });
});


// --------------------------------------------------------
// 6. 文字輸入 (使用固定座標)
// --------------------------------------------------------
textInput.addEventListener("input", () => {
    // ... (程式碼省略) ...
    
    if (textInput.value) {
        const textObj = new fabric.Text(textInput.value, {
            textObject: true, 
            fontSize: 60, 
            fill: 'black',
            // 由於 Path 被移動了，文字起始點也要相應調整
            left: 400 + 90,
            top: 700 + 200,
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
// ... (清除圖案、下載設計圖、基礎初始化 程式碼省略，保持不變)
