// draw.js (最終 Group 修正版：使用 Group 確保對齊)

// --------------------------------------------------------
// 1. 定義 SVG 路徑字串 (保持不變)
// --------------------------------------------------------
const capPathString = "m 435.51402,305.60748 86.91589,3.73831 -0.93458,-12.14953 h 67.28972 l -0.93458,12.14953 17.75701,1.86916 -3.73832,-88.78504 -18.69159,-9.3458 -0.93458,-20.56075 -5.60748,-5.60747 h -11.21495 l -8.41121,-37.38318 -31.77571,-8.41121 -44.85981,2.80373 -14.95327,16.82243 -3.73832,35.51402 -13.08411,6.54206 -0.93458,10.28037 -10.28037,7.47664 v 48.59813 z";
const bodyPathString = "m 434.63497,309.4601 -25.20882,13.90832 v 554.59423 l 26.07809,23.47029 73.01868,8.6927 81.71138,-4.34635 32.16298,-17.3854 4.34635,-16.51613 0.86927,-546.7708 -20.86248,-15.64686 h -19.12393 l 13.03904,450.28184 4.34635,16.51612 -25.20882,24.33956 2.60781,13.90832 15.64685,12.16978 v 26.0781 l -14.77758,13.90832 -22.60102,-0.86927 -19.12394,-29.55518 23.47029,-27.81664 v -7.82343 l -19.99321,-18.25467 -1.73854,-18.25466 9.56197,-3.47708 -4.34635,-445.06622 z";
const handlePathString = "m 546.72897,296.26168 -27.1028,2.80374 3.73832,10.28037 23.36448,2.80374 1.86916,449.53271 -8.41121,14.95327 24.29906,22.42991 0.93458,10.28037 -20.56075,21.49533 5.60748,27.10281 22.42991,11.21495 22.4299,-11.21495 3.73832,-24.29907 -5.60748,-15.88785 -12.14953,-6.54206 -2.80374,-13.08411 22.42991,-14.95327 1.86916,-18.69159 -7.47664,-6.54205 5.60748,-87.85047 -2.80374,-82.24299 -3.73832,-105.60748 -1.86916,-96.26168 -6.54205,-73.83178 3.73832,-7.47663 1.86916,-0.93458 -14.0187,-7.47664 z";
const designAreaPathString = "m 447.66355,338.31776 -13.08411,528.97196 88.78505,-4.6729 15.88785,-523.36448 z"; 


// --------------------------------------------------------
// 2. 初始化 Fabric.js Canvas 與 DOM 元素 (略)
// --------------------------------------------------------
const canvas = new fabric.Canvas('designCanvas');
const bottleImg = document.getElementById("bottle"); 
let bodyColorPath, capColorPath, handleColorPath, designAreaClipPath; 
const colorBody = document.getElementById("colorBody"); 
const colorCap = document.getElementById("colorCap"); 
const colorHandle = document.getElementById("colorHandle");
const imgUpload = document.getElementById("imgUpload"); 
const textInput = document.getElementById("textInput"); 
const clearBtn = document.getElementById("clearBtn");
const saveBtn = document.getElementById("saveBtn");

let pathGroup; // 宣告 Group 變數


// --------------------------------------------------------
// 3. 初始化 Canvas 尺寸與顏色層 (核心 Group 修正區)
// --------------------------------------------------------
function resizeAndInitialize() {
    const ACTUAL_SIZE = 1024; 
    
    canvas.setWidth(ACTUAL_SIZE);
    canvas.setHeight(ACTUAL_SIZE);
    canvas.clear(); 
    
    // ★★★ 精確偏移量 (只應用在 Group 上) ★★★
    // 讓整個 Path Group 從 (434, 296) 移到線稿起點 (340, 100)
    const FINAL_OFFSET_X = -55; 
    const FINAL_OFFSET_Y = -196; 

    // 創建 Path 的輔助函數 (不應用任何 left/top)
    const createPath = (pathString, options) => {
        return new fabric.Path(pathString, {
            ...options,
            scaleX: 1, scaleY: 1, 
            originX: 'left',
            originY: 'top',
            // **重要**：不在此處設置 left/top，讓 Group 處理移動
        });
    };
    
    // 1. 創建所有 Path
    bodyColorPath = createPath(bodyPathString, { fill: colorBody.value, selectable: false, opacity: 0.7 });
    capColorPath = createPath(capPathString, { fill: colorCap.value, selectable: false, opacity: 0.8 });
    handleColorPath = createPath(handlePathString, { fill: colorHandle.value, selectable: false, opacity: 0.9 });
    
    // 裁剪路徑因為要被設計圖案引用，必須單獨創建，但也要應用偏移
    designAreaClipPath = createPath(designAreaPathString, { absolutePosition: true, selectable: false, evented: false, fill: 'transparent' });
    designAreaClipPath.set({
        left: designAreaClipPath.left + FINAL_OFFSET_X,
        top: designAreaClipPath.top + FINAL_OFFSET_Y
    });


    // 2. 將所有 Path 放入 Group 中
    pathGroup = new fabric.Group([bodyColorPath, capColorPath, handleColorPath], {
        selectable: false,
        // **關鍵**：將 Group 的位置設定為計算出的偏移量
        left: bodyColorPath.left + FINAL_OFFSET_X,
        top: bodyColorPath.top + FINAL_OFFSET_Y
    });
    
    // 3. 加入 Group 到 Canvas
    canvas.add(pathGroup);
    
    // 排序圖層 (在 Group 內部排序，或 Group 在 Canvas 上的層級)
    pathGroup.sendToBack(); 
    
    canvas.renderAll();
}


// --------------------------------------------------------
// 4. 綁定事件：顏色切換 (現在是對 Group 內的子 Path 進行操作)
// --------------------------------------------------------
function updatePathColor() {
    if (capColorPath) capColorPath.set('fill', colorCap.value);
    if (bodyColorPath) bodyColorPath.set('fill', colorBody.value);
    if (handleColorPath) handleColorPath.set('fill', colorHandle.value);
    canvas.renderAll();
}
// ... (事件監聽保持不變) ...


// --------------------------------------------------------
// 5, 6, 7, 8, 9 保持不變 (Image Upload, Text Input, Clear, Save, Init)
// --------------------------------------------------------
// ... (其餘程式碼請沿用上一個回覆中提供的 draw.js 完整程式碼) ...
