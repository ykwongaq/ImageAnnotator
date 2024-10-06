class OpacityView {
    constructor() {
        this.opacitySlider = document.getElementById("mask-opacity-silder");
    }

    enable() {
        this.maskOpacitySilder.addEventListener("input", function (event) {
            const opacity = this.value / 100;
            const canvas = new Canvas(null);
            canvas.setMaskOpacity(opacity);
        });
    }
}
