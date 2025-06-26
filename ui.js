function createEffectBoxes() {
    for (let i = 0; i < effectList.length; i++) {
        const div = document.createElement("div");
        div.className = "effect-box";
        div.dataset.id = i;
        div.appendChild(createEffectBoxTitle(effectList[i].name));
        div.appendChild(createEffectBoxValue("Strength", 0, 1, 0.01));
        effectListContainer.appendChild(div);
    }
}

function createEffectBoxTitle(effectName) {
    const div = document.createElement("div");
    div.classList.add("effect-box-row", "effect-box-title");
    div.textContent = effectName;
    return div;
}

function createEffectBoxValue(text, minVal, maxVal, stepAmount) {
    const div = document.createElement("div");
    div.className = "effect-box-row";
    div.textContent = text;
    const slider = document.createElement("input");
    slider.type = "range";
    slider.min = minVal;
    slider.max = maxVal;
    slider.step = stepAmount;
    slider.className = "value-slider";
    const numberInput = document.createElement("input");
    numberInput.type = "number";
    numberInput.min = minVal;
    numberInput.max = maxVal;
    numberInput.className = "value-number";
    slider.oninput = () => {
        numberInput.value = slider.value;
    }
    numberInput.oninput = () => {
        slider.value = numberInput.value;
    }
    div.appendChild(slider);
    div.appendChild(numberInput);
    return div;
}