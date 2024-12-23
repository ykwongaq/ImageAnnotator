function main() {
    // const topnavigationBar = new TopNavigationBar();
    // topnavigationBar.enable();

    // Initialize the core
    const core = new Core();

    // Initialize main page
    const mainPage = new MainPage();
    core.getLastWorkingIdx((lastWorkingIdx) => {
        core.setCurrentIdx(lastWorkingIdx);
        core.getData(lastWorkingIdx, (data) => {
            const image_label = data["image_label"];
            mainPage.displayData(data);
            core.setLabel(image_label);
        });
    });

    // Initialize bottom navigation bar
    const bottomNavigationBar = new BottomNavigationBar();
    bottomNavigationBar.init();
}

main();
