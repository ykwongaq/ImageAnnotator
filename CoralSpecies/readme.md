## For Developer

Please process the data first before giving the data to the annotator.

In python, please install `pycocotools` by the following command:

```bash
pip install pycocotools
```

Create a data folder and place the data to that folder with the following format:

```
data
|- images
	|- 000000.jpg
	|- 000001.jpg
	|- ...
|- annotations
	|- 000000.jpg
	|- 000001.jpg
|- labels.json
```

Then run the following code:

```bash
cd python
python process.py
```

It will generate a `annotations_processed` folder in the `data` folder

Please also include a `labels.json` file, which provide the label information. It should store a `dictionary` where the key is the label id, and the value be the label name.

```json
{
    "0": "A",
    "1": "B",
    "2": "C"
}
```

Then please give the `data` folder to the annotator.

## For Annotator

### For `Window` user:

You will be given a `coralspecies-win32-x64` folder and `data` folder. Simply put the `data` folder inside the  `coralspecies-win32-x64` folder and then double click `coralspecies.exe` to run the program

![tool](readme_img\tool.png)

The `Image View` show the image with the coral mask, which is red in color.

For the coral, please select the corresponding name of the target coral, by clicking the buttons in the `Category View`

`Prev Image` button will show the previous image.

`Prev Mask` button will show the previous coral mask of the same image.

`Show Mask` button allow you to show/hide the mask

`Next Mask` button will show the next coral mask of the same image.

`Next Image & Save` button will show the next image and save the data.

All the annotated data will be saved in the `data/outputs` folder.
