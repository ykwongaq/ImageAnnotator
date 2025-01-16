# Thing and Stuff Classification

## Step 1 : Prepare python environment
```bash
pip install -r requirements.txt
```

## Step 2: Launch
```bash
python main.py --input_dir {Path to the project folder}
```

Please note that the project folder is the folder containing the images folder
```
folder
|- images
```

## Step 3: Output               
The annotatoin will be automatically saved when you move to prev or next image. The result will be saved into `thing_to_stuff.json` located in the project fodler.

The json format is shown as follow:
```json
{
    "Aaptos_aaptos###261655021.jpeg": 0,
    "Abarenicola_pacifica###199725831.jpeg": 0,
    "Ablabys_binotatus###53653514.jpeg": 1,
    "Ablabys_macracanthus###256641277.jpg": 0,
    "Ablabys_taenianotus###429567399.jpeg": -1,
    "Ablennes_hians###343433584.jpg": 0,
    "Abra_aequalis###243378801.jpg": 1,
}
```

Here, `0` mean `Thing`, `1` mean `Stuff`, `-1` mean not annotated.