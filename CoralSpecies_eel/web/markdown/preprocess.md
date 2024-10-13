# CoralSCAN Tutorial

## Step1:Launch the application

1. **Double-Click:** 

   Double-Click `CoralSCAN.exe` file onWindows or `CoralSCAN_intel` file on MacOS

2. **Wait for the page to Load:** 

   A terminal window will auto-open with the application. Initializing the models may take a few minutes(2-5 minutes), and you may see logs in the terminal window indicating the progress.

   ![Terminal](markdown/screenshot/terminal.jpg)

3. **Main page display:** 

   Once the application has finished loading, the Main Page should appear on the screen.![MainPage](markdown/screenshot/mainpage.png)

## Step2:Preprocess Coral Images

1. (*Option*) If you have an existing project with pre-processed images, you could skip this step and jump to step 3.

1. **Click the `Create New Project` button** in the Main Page and go to the Preprocess Page.

   ![PreprocessPage](markdown/screenshot/preprocesspage.png)

### 2.1 Upload Coral Images

#### 2.1.1 Select Image Folder

Select the **folder** containing the coral images to be processed by

1.  dragging it into the left box,  **ⓑ Image Gallery** 
2.  or clicking the <span style="color:blue;text-decoration:underline">select </span> to choose a local folder

#### 2.1.2 Upload Images

**Click `upload` button**: The folder should contain at least one coral image, and **only image** files will be uploaded.

![](markdown/screenshot/upload.png)

#### 2.1.3 Imported Images display

The images should be shown in the **ⓑ Image Gallery**.

![uploadres](markdown/screenshot/uploadres.png)

#### 2.1.4 Reset

1. Click the `Back to Main Menu` button in **ⓐ Top Menu** to return Main Page and select another folder.

### 2.2 Process Coral Images

#### 2.2.1 Select Images

![](markdown/screenshot/process-select.png)

1. Double-click one image in the  **ⓑ Image Gallery****
2. Or click the `Select All` button at the bottom of the   **ⓑ Image Gallery****
3. The selected images will move to the **ⓒ Selected Image View** on the right side
4. Double-click one image in the  **ⓒ Selected Image View** to unselect the image
5. Or click the `Deselect All` button to cancel all selection
6. The number of selected images can be viewed in the bottom left corner
7. **Notice**: the duplicated image with the same file name will be ignored

#### 2.2.2 Processing

![](markdown/screenshot/process-status.png)

1. Click the `Create Project` button at the bottom left
2. The `File Explorer` should pop up and the user must choose the location to save the processed data for the project.
3. The `progress bar` will update the image processing status, while detailed processing information can be viewed in the terminal.
4. **Notice**: If the user's PC utilizes a GPU, image processing for a single image can be completed within 1 minute. However, if the user's PC relies on the CPU, processing a single image may take 3 minutes or even longer.

#### 2.2.3 Process Result

1. The processing results can be viewed at the location selected in the previous step.
2. The output data structure should be as below:

```
output_folder
|- data
    |- images
        |- All the images here ...
    |- embeddings
        |- All the .npy files here ...
    |- annotations
        |- All the json file here ...
    |- project.json
```

3. Click the `Continue` button in **ⓐ Top Menu**  to move to step3

