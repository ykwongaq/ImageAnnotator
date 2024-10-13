# CoralSCAN Tutorial

## Step3:Label Image

### 3.1 Load a Project

![](markdown/screenshot/labelpage.png)

1. If navigating from the `Continue` button in Step 2, the application will seamlessly load the processed project.
2. If transitioning from the Main Page by clicking the `Load Existing Project` button, then click the `File` button in the top menu bar and select the `Load Project` option from the dropdown menu. Subsequently, select the path to the processed folder within the presented file explorer.

### 3.2 Result with visualization

![](markdown/screenshot/visualization.png)

1. **ⓕ Editing Mode**: Display a radio button containing three basic functions: Label Mask, Add Mask and Remove Mask
2. **ⓖ Opacity Slider**: Adjust the slider to modify the transparency of the mask in the image
3. **ⓗ Progress View**: Display the current image index and the total number of images
4. **ⓘ Annotation View**: Display the coral image with masks
   1. Mask Color
      1. Mask with no label is <span style="color:red;">red </span>
      2. Mask which is selected is <span style="color:blue;">blue </span>
      3. Mask with label should be the label color
   2. Select Mask
      1. Click the target mask to select it
      2. Click the selected mask to unselect it
   3. View Point
      1. Zoom in and out using the mouse wheel
      2. Move the image by dragging the image with your right mouse key
      3. Restore the default viewpoint by clicking the `Reset Viewpoint` button at the bottom of Bottom Menu
5. **ⓙ Category View**: Display the species category set of the project
   1. There are 3 type of category, including Healthy, Bleached and Dead
   2. The default category 0 is **Dead Coral** and it **can't be deleted**
   3. Except for the " Dead Coral" species directory, all other species directories will have two types: "Healthy" and "Bleached," differentiated by the same color but different indices.

6. **ⓔ Bottom Menu**: Navigation button and view point button

### 3.3 Coral Statistic 

Display the coral statistics for the **current processing image** using multiple pie charts to represent various distributions, which can be downloaded as an image.

1. Click `Statistic` button at **ⓐ Top Menu**
2. Click `Download PNG` button below the pie chart to save the statistic result

![](markdown/screenshot/statistic.png)

### 3.4 Mask Display Setting

1. Click the **Settings** button at **ⓐ Top Menu**
2. Modify parameter values by dragging the slider.
3. Click the **Save Settings** button. 

![](markdown/screenshot/modelconfiguration.png)

#### Mask Display Parameter Explanation

* **Min area**:  Annotation View only display a mask with area larger than the value. Note that I set the range to be [0, 0.2]. The reason is that we need very precise values (such as 0.1%) to accurately filer the mask in large image. Making the range small helps the user to use a slider to adjust precise min area.
* **Min Confidence**: Annotation view only shows the mask with confidence higher than a threshold
* **Max Overlap**: Maximum IoU with other masks



### 3.5 Edit Label

#### 3.5.1 Label Mask

![](markdown/screenshot/labelCategory.png)

##### Edit Category

Define the user Labelset (for example, Species A, B, C, D, E and etc) based on your requirement.

1. **Add Category**:
   1.  In the input box with placeholder 'Add ...' of the **ⓙ Category View**, enter the name of the new category.
   2.  Click the blue `Add` button or press "Enter" to confirm adding a new category. 
   3.  The system will automatically add two labels to this category, "Healthy" and "Bleached". For instance, under the "Healthy" type, "E" will be added, and under the "Bleached" type, "Bleached E" will be added. 
   4.  The indices for all labels will be reset. 

2. **Delete Category**:
   1.  Right-click on the tag of a label. 
   2.  A confirmation box will appear at the bottom right corner of the mouse pointer. Click `Delete Label` to remove the selected label.
   3.  Both labels of  "Healthy" and "Bleached" will be removed.
   4.  **Notice**: **Dead Coral** can't be removed.

3. **Search Category**: Within the input box with placeholder 'Search ...' of the category view, input search keywords to automatically display matching phrase results.

##### Label Selected Mask

1. In the **ⓕ Editing Mode** , switch to` Label Mask` mode
2. Click one or multiple mask on the **ⓘ Annotation View**, the selected mask should be changed to <span style="color:blue;">blue </span>. Click again on the  <span style="color:blue;">blue </span> mask can unselect it.
3. Click the label button in **ⓙ Category View**, to assign the coral species to the selected masks, and the ID of the label in <span style="color:red;">red </span> should displayed at the middle of the mask



#### 3.5.2 Add Mask

![](markdown/screenshot/addMask.png)

Users could click the some points to add some new masks for the missed coral reef areas or the areas they are interested.

1. In the **ⓕ Editing Mode**   , switch to `Add Mask` mode
2. **Positive prompt (<span style="color:green;">Green points</span>)**: left mouse button. Please click the regions you are interested.
3. **Negative prompt (<span style="color:red;">Red points</span>)**: right mouse button. Please click the regions that you want to reject.
4. Click `Confirm` to add a new mask.
5. Click `Undo` to go back to the last prompt.
6. Click `Reset` to clear all prompts.



#### 3.5.3 Remove Mask

![](markdown/screenshot/rmvMask.png)

1. In the **ⓕ Editing Mode**   , switch to `Remove Mask` mode

2. Click one or multiple  the target mask, which should turn <span style="color:blue;">blue </span> when selected

3. Click `Confirm` button to remove the selected mask

   

###  3.6 Navigation and save

1. Click the `Prev Image(A)` button or enter `A` to go back the last image
2. Click the `Next Image(D)` button or enter `D` to go to the next image
3. The edition will be automatically saved when you move to next image



### 3.7 Export Label Result

![](markdown/screenshot/export.png)

1. Click the `File` button in the top menu bar
2. Select the `Export xxx` option from the dropdown menu. We have three formats: COCO(json), Excel and Graph.
3. Select the `Export All` option will download a zip file contain all formats.