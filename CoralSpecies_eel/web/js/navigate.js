function navigateTo(page) {
    eel.clear_dataset()(() => {
        window.location.href = page;
    });
}

function navigateWithoutClear(page) {
    window.location.href = page;
}
