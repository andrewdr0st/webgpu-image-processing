const effectDropdown = document.getElementById("addEffectDropdown");
const importButton = document.getElementById("importImage");
const addEffectButton = document.getElementById("addEffectButton");
const effectListContainer = document.getElementById("effectList");

async function importImage(event) {
    const imgFile = event.target.files[0];
    if (!imgFile) return;
    const img = await createImageBitmap(imgFile);
    createImgTextures(img);
    processImage();
}

importButton.addEventListener("change", importImage);
addEffectButton.addEventListener("click", () => {
    effectDropdown.style.display = "block";
});
window.addEventListener("click", (e) => {
    if (!e.target.matches("#addEffectButton")) {
        effectDropdown.style.display = "none";
    }
});

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
    div.className = "effect-box";
    div.appendChild(createEffectBoxTitle(effect.name));
    if (effect.useValue) {
        div.appendChild(createEffectBoxValue(effect, "Strength", effect.defaultValue, effect.minValue, effect.maxValue, effect.stepAmount));
    }
    if (effect.useColor) {
        div.appendChild(createEffectBoxColor(effect));
    }
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
        console.log("inputed");
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