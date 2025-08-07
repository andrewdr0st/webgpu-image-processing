const importButton = document.getElementById("importImage");
const exportButton = document.getElementById("exportButton");
const exportAnchor = document.getElementById("exportAnchor");
const filetypeSelector = document.getElementById("filetypeSelector");
const colorSpaceSelector = document.getElementById("colorSpaceSelector");
const addEffectButton = document.getElementById("addEffectButton");
const effectListContainer = document.getElementById("effectList");
const draggableEffectBox = document.getElementById("draggableEffectBox");
const effectDropdown = document.getElementById("addEffectDropdown");
const effectOptionsDropup = document.getElementById("effectOptionsDropup");
const effectOptionEnable = effectOptionsDropup.children[0];
const effectOptionDelete = effectOptionsDropup.children[1];

let exportFiletype = "png";
let exportQuality = 1;
let exportColorSpace = "sRGB";
const fileParams = [
    ["PNG", "png", 1],
    ["JPEG", "jpeg", 0.75],
    ["WebP", "webp", 1],
    ["WebP (Lossy)", "webp", 0.75]
];
const colorSpaceParams = ["sRGB", "Linear", "OKLab", "OKLCH"];

createDropupButtons();

let nextOrder = 0;
let activeBox = null;
let activeBoxIdx = 0;
let topTarget = -1;
let bottomTarget = -1;
let dragX = 0;
let dragY = 0;
let prevX = 0;
let prevY = 0;

async function importImage(e) {
    const imgFile = e.target.files[0];
    if (!imgFile) return;
    const img = await createImageBitmap(imgFile);
    createImgTextures(img);
    processImage();
}

function exportImage(blob) {
    const blobUrl = URL.createObjectURL(blob);
    exportAnchor.setAttribute("href", blobUrl);
    exportAnchor.click();
    URL.revokeObjectURL(blobUrl);
}

importButton.addEventListener("change", importImage);
exportButton.addEventListener("click", () => {
    canvas.toBlob(exportImage, "image/" + exportFiletype, exportQuality);
});
addEffectButton.addEventListener("click", () => {
    effectDropdown.style.display = "block";
});
effectListContainer.addEventListener("mousedown", (e) => {
    const t = e.target;
    if (t.matches(".effect-box-title")) {
        const container = t.parentElement;
        const box = container.parentElement;
        activeBox = box;
        activeBoxIdx = parseInt(box.style.order);
        calculateTargetMidpoints();
        draggableEffectBox.appendChild(container.cloneNode(true));
        draggableEffectBox.style.width = box.offsetWidth + "px";
        draggableEffectBox.style.display = "block";
        dragX = box.offsetLeft;
        dragY = box.offsetTop - 8;
        positionDraggableBox();
        prevX = e.clientX;
        prevY = e.clientY;
        box.classList.replace("effect-item", "effect-placeholder");
        container.classList.add("hide");
        effectOptionsDropup.style.display = "none";
    }
});
effectListContainer.addEventListener("click", (e) => {
    const t = e.target;
    if (t.matches(".effect-options-button")) {
        const effectTitle = t.parentElement;
        const box = effectTitle.parentElement.parentElement;
        activeBoxIdx = box.style.order;
        effectOptionsDropup.style.display = "block";
        effectOptionsDropup.style.top = (t.getBoundingClientRect().y - 60) + "px";
        effectOptionEnable.textContent = effectList[activeBoxIdx].enabled ? "Disable" : "Enable";
    }
});
effectOptionEnable.addEventListener("click", () => {
    let effect = effectList[activeBoxIdx];
    effect.enabled = !effect.enabled;
    let effectTitle = effect.div.children[0].children[0];
    if (effect.enabled) {
        effectTitle.classList.remove("effect-disabled")
    } else {
        effectTitle.classList.add("effect-disabled")
    }
    processImage();
});
effectOptionDelete.addEventListener("click", () => {
    effectList[activeBoxIdx].div.remove();
    effectList.splice(activeBoxIdx, 1);
    nextOrder--;
    reorderEffects();
    processImage();
});
window.addEventListener("click", (e) => {
    if (!e.target.matches("#addEffectButton")) {
        effectDropdown.style.display = "none";
    }
    if (!e.target.matches("#effectOptionsDropup") && !e.target.matches(".effect-options-button")) {
        effectOptionsDropup.style.display = "none";
    }
});
window.addEventListener("mouseup", () => {
    if (activeBox) {
        const container = activeBox.children[0];
        container.classList.remove("hide");
        activeBox.classList.replace("effect-placeholder", "effect-item");
        activeBox = null;
        draggableEffectBox.style.display = "none";
        draggableEffectBox.removeChild(draggableEffectBox.children[0]);
        reorderEffects();
        processImage();
    }
});
window.addEventListener("mousemove", (e) => {
    if (activeBox) {
        let x = e.clientX - prevX;
        let y = e.clientY - prevY;
        prevX = e.clientX;
        prevY = e.clientY;
        dragX += x;
        dragY += y;
        positionDraggableBox();
    }
});

function positionDraggableBox() {
    draggableEffectBox.style.top = dragY + "px";
    draggableEffectBox.style.left = dragX + "px";
    if (dragY < topTarget && topTarget > -1) {
        swapEffects(activeBoxIdx, activeBoxIdx - 1);
        activeBoxIdx--;
        calculateTargetMidpoints();
    } else if (dragY > bottomTarget && bottomTarget > -1) {
        swapEffects(activeBoxIdx, activeBoxIdx + 1);
        activeBoxIdx++;
        calculateTargetMidpoints();
    }
}

function swapEffects(idx1, idx2) {
    let tmp = effectList[idx1];
    effectList[idx1] = effectList[idx2];
    effectList[idx2] = tmp;
    reorderEffects();
}

function reorderEffects() {
    for (let i = 0; i < effectList.length; i++) {
        effectList[i].div.style.order = i;
    }
}

function calculateTargetMidpoints() {
    if (activeBoxIdx > 0) {
        let topNode = effectList[activeBoxIdx - 1].div;
        topTarget = topNode.offsetTop + topNode.offsetHeight * 0.5;
    } else {
        topTarget = -1;
    }
    if (activeBoxIdx < effectList.length - 1) {
        let bottomNode = effectList[activeBoxIdx + 1].div;
        bottomTarget = bottomNode.offsetTop;
    } else {
        bottomTarget = -1;
    }
}

function createDropupButtons() {
    const filetypeDropup = filetypeSelector.querySelector(".dropup");
    for (let i = 0; i < fileParams.length; i++) {
        const param = fileParams[i];
        const div = document.createElement("div");
        div.classList.add("dropdown-content", "clickable");
        div.textContent = param[0];
        div.onclick = () => {
            filetypeSelector.textContent = param[0];
            filetypeSelector.appendChild(filetypeDropup);
            exportFiletype = param[1];
            exportQuality = param[2];
        }
        filetypeDropup.appendChild(div);
    }
    const colorSpaceDropup = colorSpaceSelector.querySelector(".dropup");
    for (let i = 0; i < colorSpaceParams.length; i++) {
        const param = colorSpaceParams[i];
        const div = document.createElement("div");
        div.classList.add("dropdown-content", "clickable");
        div.textContent = param;
        div.onclick = () => {
            colorSpaceSelector.textContent = param;
            colorSpaceSelector.appendChild(colorSpaceDropup);
            exportColorSpace = param;
            processImage();
        }
        colorSpaceDropup.appendChild(div);
    }
}

function createDropdownButton(effect, id) {
    const div = document.createElement("div");
    div.classList.add("dropdown-content", "clickable")
    div.textContent = effect.name;
    div.onclick = () => {
        addEffect(id);
    }
    effectDropdown.appendChild(div);
}

function createEffectBox(effect) {
    const div = document.createElement("div");
    div.classList.add("effect-box", "effect-item");
    div.style.order = nextOrder;
    nextOrder++;
    const container = document.createElement("div");
    container.className = "effect-container";
    container.appendChild(createEffectBoxTitle(effect.name));
    let text = effect.valueText ? effect.valueText : "Strength";
    if (effect.useValue) {
        container.appendChild(createEffectBoxValue(effect, text, effect.defaultValue, effect.minValue, effect.maxValue, effect.stepAmount));
    }
    if (effect.useColor) {
        container.appendChild(createEffectBoxColor(effect));
    }
    div.appendChild(container);
    effectListContainer.appendChild(div);
    effect.div = div;
}

function createEffectBoxTitle(effectName) {
    const div = document.createElement("div");
    div.classList.add("effect-box-row", "effect-box-title", "clickable");
    div.textContent = effectName;
    const optionsButton = document.createElement("div");
    optionsButton.classList.add("effect-options-button");
    optionsButton.textContent = "⋯";
    div.appendChild(optionsButton);
    return div;
}

function createEffectBoxValue(effect, text, defaultVal, minVal, maxVal, stepAmount) {
    const div = document.createElement("div");
    div.className = "effect-box-row";
    div.textContent = text;
    const slider = document.createElement("input");
    slider.type = "range";
    slider.value = defaultVal;
    slider.min = minVal;
    slider.max = maxVal;
    slider.step = stepAmount;
    slider.className = "value-slider";
    const numberInput = document.createElement("input");
    numberInput.type = "number";
    numberInput.value = defaultVal;
    numberInput.min = minVal;
    numberInput.max = maxVal;
    numberInput.className = "value-number";
    slider.oninput = () => {
        numberInput.value = slider.value;
        effect.buffer.setValues(slider.value);
        processImage();
    }
    numberInput.oninput = () => {
        slider.value = numberInput.value;
        effect.buffer.setValues(numberInput.value);
        processImage();
    }
    div.appendChild(slider);
    div.appendChild(numberInput);
    return div;
}

function createEffectBoxColor(effect) {
    const div = document.createElement("div");
    div.className = "effect-box-row";
    div.textContent = "Color";
    const colorPicker = document.createElement("label");
    colorPicker.className = "color-picker";
    const colorInput = document.createElement("input");
    colorInput.type = "color";
    colorInput.className = "color-input";
    colorInput.value = "#FFFFFF"
    colorInput.oninput = () => {
        const c = colorInput.value;
        colorPicker.style.backgroundColor = c;
        const r = parseInt(c.substring(1, 3), 16) / 255;
        const g = parseInt(c.substring(3, 5), 16) / 255;
        const b = parseInt(c.substring(5, 7), 16) / 255;
        effect.buffer.setColor(r, g, b);
        processImage();
    }
    colorPicker.appendChild(colorInput);
    colorPicker.appendChild(document.createTextNode("color picker"));
    div.appendChild(colorPicker);
    return div;
}