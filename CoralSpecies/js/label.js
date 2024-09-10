class Label {
    static selected_color = "#0000FF";
    static default_color = "#FF0000";

    static labels = {
        0: "A",
        1: "B",
        2: "C",
        3: "D",
        4: "E",
        5: "F",
        6: "G",
        7: "H",
        8: "I",
        9: "J",
        10: "K",
        11: "L",
        12: "M",
        13: "N",
        14: "O",
        15: "P",
        16: "Q",
        17: "R",
        18: "S",
        19: "T",
        20: "U",
        21: "V",
        22: "W",
        23: "X",
        24: "Y",
        25: "Z",
        26: "AA",
        27: "AB",
        28: "AC",
        29: "AD",
    };

    static color_list = [
        "#00FF00",
        "#FFFF00",
        "#FF00FF",
        "#00FFFF",
        "#800000",
        "#808000",
        "#008000",
        "#800080",
        "#008080",
        "#000080",
        "#FFA500",
        "#A52A2A",
        "#8A2BE2",
        "#DEB887",
        "#5F9EA0",
        "#7FFF00",
        "#D2691E",
        "#FF7F50",
        "#6495ED",
        "#DC143C",
        "#00FA9A",
        "#FFD700",
        "#ADFF2F",
        "#4B0082",
        "#F0E68C",
        "#E6E6FA",
        "#FFB6C1",
        "#20B2AA",
        "#DA70D6",
        "#FF6347",
    ];

    constructor(id, name) {
        if (id === null || id === undefined) {
            this.label_id = null;
        } else {
            this.label_id = parseInt(id);
        }

        if (name === null || name === undefined) {
            this.label_name = null;
        } else {
            this.label_name = name;
        }
        this.set_color_by_id();
    }

    get_label_id() {
        return this.label_id;
    }

    get_label_name() {
        return this.label_name;
    }

    get_color() {
        return this.color;
    }

    set_label_id(label_id) {
        this.label_id = label_id;
    }

    set_label_name(label_name) {
        this.label_name = label_name;
    }

    set_color(color) {
        this.color = color;
    }

    set_color_by_id() {
        if (this.label_id === null) {
            this.color = Label.default_color;
        } else {
            this.color = Label.color_list[this.label_id];
        }
    }
}
