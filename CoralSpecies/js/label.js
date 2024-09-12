class Label {
    static selected_color = "#0000FF";
    static default_color = "#FF0000";

    static labels = {
        0: "A",
        1: "B",
        2: "C",
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
            this.color = Label.getLabelColor(this.label_id);
        }
    }

    static getLabelColor(label_id) {
        if (label_id in Label.color_list) {
            return Label.color_list[label_id];
        } else {
            return Label.color_list[0];
        }
    }
}
