function createEffectBoxes() {
    for (let i = 0; i < effectList.length; i++) {
        const div = document.createElement("div");
        div.className = "effect-box";
        div.dataset.id = i;
        div.appendChild(createEffectBoxTitle(effectList[i].name));
        div.appendChild(createEffectBoxValue());
        effectListContainer.appendChild(div);
    }
}

function createEffectBoxTitle(effectName) {
    const div = document.createElement("div");
    div.classList.add("effect-box-row", "effect-box-title");
    div.textContent = effectName;
    return div;
}

function createEffectBoxValue() {
    const div = document.createElement("div");
    div.className = "effect-box-row";
    div.textContent = "Strength";
    const slider = document.createElement("input");
    slider.type = "range";
    slider.className = "value-slider";
    div.appendChild(slider);
    return div;
}