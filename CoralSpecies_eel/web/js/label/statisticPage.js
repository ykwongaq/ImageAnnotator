class StatisticPage {
    constructor() {
        this.currentImageGrid = document.getElementById("current-image-grid");
        this.chartItemTemplate = document.getElementById("chart-item-template");

        google.charts.load("current", { packages: ["corechart"] });
    }

    update() {
        this.clearCharts();
        const dataset = new Dataset();
        const core = new Core();
        const topNavigationBar = new TopNavigationBar();
        topNavigationBar.showLoadingIcon();
        // const start = new Date().getTime();
        core.saveData(() => {
            dataset.getData((response) => {
                this.createCurrentImageStatistic(response);
                topNavigationBar.restoreIcon();
            });
            // dataset.getAllData((dataList) => {
            //     console.log("Data List: ", dataList);
            //     this.createCurrentImageStatistic(
            //         dataList[dataset.getCurrentDataIdx()]
            //     );
            //     topNavigationBar.restoreIcon();
            //     const end = new Date().getTime();
            //     console.log(
            //         `Statistic Page Update Time: ${end - start} milliseconds`
            //     );
            // });
        });
    }

    getHealthyCoralCount(jsonItem) {
        let count = 0;
        for (const category of jsonItem["categories"]) {
            if (LabelManager.isHealthyCoralName(category["name"])) {
                count += 1;
            }
        }
        return count;
    }

    createCurrentImageStatistic(response) {
        const coralDistributionChartItem =
            this.createCoralColonyDistributionChartItem(response);
        this.currentImageGrid.appendChild(coralDistributionChartItem);

        const coralCoverageChartItem =
            this.createCoralCoverageChartItem(response);
        this.currentImageGrid.appendChild(coralCoverageChartItem);

        const coralSpeciesCoverageChartItem =
            this.createCoralSpeciesCoverageChartItem(response);
        this.currentImageGrid.appendChild(coralSpeciesCoverageChartItem);

        const coralConditionDistributionChartItem =
            this.createCoralConditionDistributionChartItem(response);
        this.currentImageGrid.appendChild(coralConditionDistributionChartItem);

        const jsonItem = response["json_item"];
        for (const category of jsonItem["categories"]) {
            const id = category["id"];
            if (
                LabelManager.isDeadCoral(id) ||
                LabelManager.isBleachCoral(id)
            ) {
                continue;
            }

            const coralSpeciesConditionDistributionChartItem =
                this.createCoralSpeciesConditionDistributionChartItem(
                    response,
                    id
                );

            if (coralSpeciesConditionDistributionChartItem != null) {
                this.currentImageGrid.appendChild(
                    coralSpeciesConditionDistributionChartItem
                );
            }
        }
    }

    createCoralColonyDistributionChartItem(response) {
        const jsonItem = response["json_item"];
        const filteredIndices = response["filtered_indices"];

        const chartItem = document.importNode(
            this.chartItemTemplate.content,
            true
        );
        const chartContainer = chartItem.querySelector(".chart");
        const downloadButton = chartItem.querySelector(".download-btn");

        let totalCoralColonyCount = 0;
        let coralColonyDict = {};

        const id2Name = this.getId2Name(jsonItem);
        const healthyCoralCount = this.getHealthyCoralCount(jsonItem);

        for (const annotation of jsonItem["annotations"]) {
            let id = annotation["category_id"];
            const name = annotation["category_name"];
            const maskId = annotation["id"];

            if (!this.isIncluded(maskId, filteredIndices) || name == null) {
                continue;
            }

            if (LabelManager.isBleachedCoralName(name)) {
                id = id - healthyCoralCount;
            }

            if (!(id in coralColonyDict)) {
                coralColonyDict[id] = 0;
            }

            coralColonyDict[id] += 1;
            totalCoralColonyCount += 1;
        }

        var dataTable = [];
        var colors = [];
        var slices = {};
        let sliceId = 0;

        dataTable.push(["Coral Colony", "Count"]);
        for (let id in coralColonyDict) {
            id = parseInt(id);
            dataTable.push([id2Name[id], coralColonyDict[id]]);
            colors.push(LabelManager.getColorById(id));
            let sliceColor = null;
            if (LabelManager.isDeadCoral(id)) {
                console.log("Dead Coral");
                sliceColor = "red";
            } else {
                sliceColor = "black";
            }
            slices[sliceId] = { textStyle: { color: sliceColor } };
            sliceId += 1;
        }

        const data = google.visualization.arrayToDataTable(dataTable);

        const chart = new google.visualization.PieChart(chartContainer);
        const options = {
            title: `Coral Colony Distribution (Total: ${totalCoralColonyCount})`,
            pieHole: 0.4,
            legend: { position: "right" },
            chartArea: {
                left: "10%",
                top: "10%",
                width: "100%",
                height: "100%",
            },
            fontSize: 16,
            backgroundColor: "#fff",
            colors: colors,
            pieSliceText: "value",
            slices: slices,
        };

        chart.draw(data, options);

        downloadButton.addEventListener("click", () => {
            const filename = response["filename"];
            this.download(chart, `coral_colony_distribution_${filename}`);
        });

        return chartItem;
    }

    createCoralCoverageChartItem(response) {
        const jsonItem = response["json_item"];
        const filteredIndices = response["filtered_indices"];

        const chartItem = document.importNode(
            this.chartItemTemplate.content,
            true
        );
        const chartContainer = chartItem.querySelector(".chart");
        const downloadButton = chartItem.querySelector(".download-btn");

        const imageHeight = jsonItem["image"]["height"];
        const imageWidth = jsonItem["image"]["width"];
        const totalPixelCount = imageHeight * imageWidth;

        let coralPixelCount = 0;
        for (const annotation of jsonItem["annotations"]) {
            const id = annotation["category_id"];
            const maskId = annotation["id"];
            if (!this.isIncluded(maskId, filteredIndices) || id == null) {
                continue;
            }
            const area = annotation["area"];
            coralPixelCount += area;
        }

        const nonCoralPixelCount = totalPixelCount - coralPixelCount;

        var dataTable = google.visualization.arrayToDataTable([
            ["Type", "Count"],
            ["Coral", coralPixelCount],
            ["Non-Coral", nonCoralPixelCount],
        ]);

        const chart = new google.visualization.PieChart(chartContainer);
        const options = {
            title: "Coral Coverage",
            pieHole: 0.4,
            legend: { position: "right" },
            chartArea: {
                left: "10%",
                top: "10%",
                width: "100%",
                height: "100%",
            },
            backgroundColor: "#fff",
            fontSize: 16,
            slices: {
                0: { textStyle: { color: "black" } },
                1: { textStyle: { color: "black" } },
            },
        };

        chart.draw(dataTable, options);

        downloadButton.addEventListener("click", () => {
            const filename = response["filename"];
            this.download(chart, `coral_coverage_${filename}`);
        });

        return chartItem;
    }

    createCoralSpeciesCoverageChartItem(response) {
        const jsonItem = response["json_item"];
        const filteredIndices = response["filtered_indices"];

        const chartItem = document.importNode(
            this.chartItemTemplate.content,
            true
        );
        const chartContainer = chartItem.querySelector(".chart");
        const downloadButton = chartItem.querySelector(".download-btn");

        let totalCoralArea = 0;
        let coralAreaDict = {};

        const id2Name = this.getId2Name(jsonItem);
        const healthyCoralCount = this.getHealthyCoralCount(jsonItem);

        for (const annotation of jsonItem["annotations"]) {
            let id = annotation["category_id"];
            const name = annotation["category_name"];
            const maskId = annotation["id"];

            if (!this.isIncluded(maskId, filteredIndices) || name == null) {
                continue;
            }

            if (LabelManager.isBleachedCoralName(name)) {
                id = id - healthyCoralCount;
            }

            if (!(id in coralAreaDict)) {
                coralAreaDict[id] = 0;
            }

            coralAreaDict[id] += annotation["area"];
            totalCoralArea += annotation["area"];
        }

        var dataTable = [];
        var colors = [];
        var slices = {};
        let sliceId = 0;

        dataTable.push(["Coral Species", "Area"]);
        for (let id in coralAreaDict) {
            id = parseInt(id);
            dataTable.push([id2Name[id], coralAreaDict[id]]);
            colors.push(LabelManager.getColorById(id));
            let sliceColor = null;
            if (LabelManager.isDeadCoral(id)) {
                sliceColor = "red";
            } else {
                sliceColor = "black";
            }
            slices[sliceId] = { textStyle: { color: sliceColor } };
            sliceId += 1;
        }

        const data = google.visualization.arrayToDataTable(dataTable);

        const chart = new google.visualization.PieChart(chartContainer);
        const options = {
            title: `Coral Species Coverage`,
            pieHole: 0.4,
            legend: { position: "right" },
            chartArea: {
                left: "10%",
                top: "10%",
                width: "100%",
                height: "100%",
            },
            fontSize: 16,
            backgroundColor: "#fff",
            colors: colors,
            slices: slices,
        };

        chart.draw(data, options);

        downloadButton.addEventListener("click", () => {
            const filename = response["filename"];
            this.download(chart, `coral_species_coverage_${filename}`);
        });

        return chartItem;
    }

    createCoralConditionDistributionChartItem(response) {
        // This time, we measure the distribution of coral conditions
        // (healthy, bleached, dead) in the image.
        // The chart should show the area percentage of each condition in the image over the total coral area.

        const jsonItem = response["json_item"];
        const filteredIndices = response["filtered_indices"];

        const chartItem = document.importNode(
            this.chartItemTemplate.content,
            true
        );
        const chartContainer = chartItem.querySelector(".chart");
        const downloadButton = chartItem.querySelector(".download-btn");

        let totalCoralArea = 0;
        let coralAreaDict = {};

        for (const annotation of jsonItem["annotations"]) {
            let id = annotation["category_id"];
            const name = annotation["category_name"];
            const maskId = annotation["id"];

            if (!this.isIncluded(maskId, filteredIndices) || name == null) {
                continue;
            }

            let key = null;
            if (LabelManager.isHealthyCoralName(name)) {
                key = "healthy";
            } else if (LabelManager.isBleachedCoralName(name)) {
                key = "bleached";
            } else if (LabelManager.isDeadCoralName(name)) {
                key = "dead";
            } else {
                console.error("Unknown Coral Condition: ", name);
                continue;
            }

            if (!(key in coralAreaDict)) {
                coralAreaDict[key] = 0;
            }
            coralAreaDict[key] += annotation["area"];
            totalCoralArea += annotation["area"];
        }

        console.log("Coral Area Dict: ", coralAreaDict);

        var dataTable = [];
        var colors = [];
        var slices = {};

        dataTable.push(["Coral Condition", "Area"]);
        dataTable.push(["Healthy", coralAreaDict["healthy"]]);
        dataTable.push(["Bleached", coralAreaDict["bleached"]]);
        dataTable.push(["Dead", coralAreaDict["dead"]]);

        const data = google.visualization.arrayToDataTable(dataTable);
        var colors = ["blue", "gray", "black"];
        var slices = {
            0: { textStyle: { color: "black" } },
            1: { textStyle: { color: "black" } },
            2: { textStyle: { color: "red" } },
        };

        const chart = new google.visualization.PieChart(chartContainer);
        const options = {
            title: `Coral Condition Distribution`,
            pieHole: 0.4,
            legend: { position: "right" },
            chartArea: {
                left: "10%",
                top: "10%",
                width: "100%",
                height: "100%",
            },
            fontSize: 16,
            backgroundColor: "#fff",
            colors: colors,
            slices: slices,
        };

        chart.draw(data, options);

        downloadButton.addEventListener("click", () => {
            const filename = response["filename"];
            this.download(chart, `coral_condition_distribution_${filename}`);
        });

        return chartItem;
    }

    createCoralSpeciesConditionDistributionChartItem(response, targetId) {
        // This time, we measure the distribution of coral conditions
        // of one specific coral species in the image. The chart
        // should show the area percentage of each condition in the
        // image over the total coral area of that species.

        const jsonItem = response["json_item"];
        const filteredIndices = response["filtered_indices"];

        const chartItem = document.importNode(
            this.chartItemTemplate.content,
            true
        );
        const chartContainer = chartItem.querySelector(".chart");
        const downloadButton = chartItem.querySelector(".download-btn");

        let totalCoralArea = 0;
        let coralAreaDict = {};

        const healthyCoralCount = this.getHealthyCoralCount(jsonItem);
        const id2Name = this.getId2Name(jsonItem);

        const bleachId = targetId + healthyCoralCount;

        for (const annotation of jsonItem["annotations"]) {
            let id = annotation["category_id"];
            const name = annotation["category_name"];
            const maskId = annotation["id"];

            if (!this.isIncluded(maskId, filteredIndices) || name == null) {
                console.log(
                    "id: ",
                    id,
                    "maskId: ",
                    maskId,
                    "name: ",
                    name,
                    "filteredIndices: ",
                    filteredIndices,
                    " not included"
                );
                continue;
            }

            if (id != targetId && id != bleachId) {
                continue;
            }

            let key = null;
            if (LabelManager.isHealthyCoralName(name)) {
                key = "healthy";
            } else if (LabelManager.isBleachedCoralName(name)) {
                key = "bleached";
            } else if (LabelManager.isDeadCoralName(name)) {
                key = "dead";
            } else {
                console.error("Unknown Coral Condition: ", name);
                continue;
            }

            if (!(key in coralAreaDict)) {
                coralAreaDict[key] = 0;
            }
            coralAreaDict[key] += annotation["area"];
            totalCoralArea += annotation["area"];
        }

        if (totalCoralArea == 0) {
            return null;
        }

        var dataTable = [];
        dataTable.push(["Coral Condition", "Area"]);
        dataTable.push(["Healthy", coralAreaDict["healthy"]]);
        dataTable.push(["Bleached", coralAreaDict["bleached"]]);
        var data = google.visualization.arrayToDataTable(dataTable);

        var colors = [LabelManager.getColorById(targetId), "gray"];
        var slices = {
            0: { textStyle: { color: "black" } },
            1: { textStyle: { color: "black" } },
        };

        const chart = new google.visualization.PieChart(chartContainer);
        const options = {
            title: `Coral Condition Distribution (${id2Name[targetId]})`,
            pieHole: 0.4,
            legend: { position: "right" },
            chartArea: {
                left: "10%",
                top: "10%",
                width: "100%",
                height: "100%",
            },
            fontSize: 16,
            backgroundColor: "#fff",
            colors: colors,
            slices: slices,
        };
        chart.draw(data, options);

        downloadButton.addEventListener("click", () => {
            const filename = response["filename"];
            this.download(
                chart,
                `coral_species_condition_distribution_${filename}`
            );
        });

        return chartItem;
    }

    download(chart, downloadFilename) {
        var imgUrl = chart.getImageURI();
        var link = document.createElement("a");
        link.href = imgUrl;
        link.download = `${downloadFilename}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    isIncluded(maskIdx, filteredIndices) {
        return filteredIndices.includes(parseInt(maskIdx));
    }

    getId2Name(jsonItem) {
        let id2Name = {};
        for (const category of jsonItem["categories"]) {
            id2Name[category["id"]] = category["name"];
        }
        return id2Name;
    }

    clearCharts() {
        this.currentImageGrid.innerHTML = "";
    }
}
