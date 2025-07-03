const effectDropdown = document.getElementById("addEffectDropdown");
const importButton = document.getElementById("importImage");
const addEffectButton = document.getElementById("addEffectButton");
const effectListContainer = document.getElementById("effectList");
const draggableEffectBox = document.getElementById("draggableEffectBox");

let effectListId = 0;
let draggingBox = null;
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

importButton.addEventListener("change", importImage);
addEffectButton.addEventListener("click", () => {
    effectDropdown.style.display = "block";
});
effectListContainer.addEventListener("mousedown", (e) => {
    const t = e.target;
    if (t.matches(".effect-box-title")) {
        const container = t.parentElement;
        const box = container.parentElement;
        draggableEffectBox.appendChild(container.cloneNode(true));
        dragX = box.offsetLeft;
        dragY = (box.offsetTop - 8)
        positionDraggableBox();
        draggableEffectBox.style.width = box.offsetWidth + "px";
        draggableEffectBox.style.display = "block";
        prevX = e.clientX;
        prevY = e.clientY;
        draggingBox = box;
        box.classList.replace("effect-item", "effect-placeholder");
        container.classList.add("hide");        
    }
});
window.addEventListener("click", (e) => {
    if (!e.target.matches("#addEffectButton")) {
        effectDropdown.style.display = "none";
    }
});
window.addEventListener("mouseup", () => {
    if (draggingBox) {
        const container = draggingBox.children[0];
        container.classList.remove("hide");
        draggingBox.classList.replace("effect-placeholder", "effect-item");
        draggingBox = null;
        draggableEffectBox.style.display = "none";
        draggableEffectBox.removeChild(draggableEffectBox.children[0]);
    }
});
window.addEventListener("mousemove", (e) => {
    if (draggingBox) {
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
    div.style.order = effectListId;
    effectListId++;
    const container = document.createElement("div");
    container.className = "effect-container";
    container.appendChild(createEffectBoxTitle(effect.name));
    if (effect.useValue) {
        container.appendChild(createEffectBoxValue(effect, "Strength", effect.defaultValue, effect.minValue, effect.maxValue, effect.stepAmount));
    }
    if (effect.useColor) {
        container.appendChild(createEffectBoxColor(effect));
    }
    div.appendChild(container);
    effectListContainer.appendChild(div);
}

function createEffectBoxTitle(effectName) {
    const div = document.createElement("div");
    div.classList.add("effect-box-row", "effect-box-title", "clickable");
    div.textContent = effectName;
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