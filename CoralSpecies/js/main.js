FILE_INPUT = document.getElementById("uploader");

FILE_INPUT.addEventListener("change", function (e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        let elements = document.querySelectorAll(".hidden");
        elements.forEach((element) => {
            element.classList.remove("hidden");
        });
    };
    reader.readAsText(file);
    // Hide the upload file container after loading the json file
    FILE_INPUT.style.display = "none";
});
