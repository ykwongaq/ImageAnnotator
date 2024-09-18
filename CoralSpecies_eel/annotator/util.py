import base64

from io import BytesIO
from PIL import Image
import numpy as np
import os

from typing import Dict, List
from pycocotools import mask as coco_mask

import json
import sys

def decode_image_url(image_url):
    header, encoded = image_url.split(",", 1)
    data = base64.b64decode(encoded)

    image = Image.open(BytesIO(data))
    image = np.array(image)
    return image

def get_resource_path(relative_path):
    """ Get the absolute path to a resource, works for dev and for PyInstaller """
    try:
        # PyInstaller creates a temporary folder and stores path in _MEIPASS
        base_path = sys._MEIPASS
    except Exception:
        base_path = os.path.abspath(".")

    return os.path.join(base_path, relative_path)

def save_json(data:Dict, file:str):
    with open(file, "w") as f:
        json.dump(data, f, indent=4)

def load_json(file:str) -> Dict:
    with open(file) as f:
        data = json.load(f)
    return data

def coco_mask_to_rle(segmentation: Dict) -> Dict:
    mask = coco_mask.decode(segmentation)
    mask = mask.flatten()
    
    # Find where changes occur
    changes = np.diff(mask, prepend=mask[0])

    # Get indices of changes
    change_indices = np.where(changes != 0)[0]

    # Calculate run lengths
    run_lengths = np.diff(np.concatenate(([0], change_indices, [len(mask)])))
    run_lengths = run_lengths.tolist()
    run_lengths = list(map(int, run_lengths))
    return run_lengths

def decode_coco_mask(segmentation: Dict) -> np.ndarray:
    mask = coco_mask.decode(segmentation)
    return mask

class JsonUtil:
    def __init__(self):
        pass

    def save_json(self, data:Dict, file:str):
        save_json(data, file)
        
    def load_json(self, file:str) -> Dict:
        load_json(file)
    
    def gen_image_json(self, image:np.ndarray) -> Dict:
        
        width, height = image.shape[:2]

        image_json = {}
        image_json["width"] = width
        image_json["height"] = height
        image_json["filename"] = None
        image_json["image_id"] = -1

        return image_json
    
    def gen_mask_json(self, mask:np.ndarray) -> Dict:
        rle = coco_mask.encode(np.asfortranarray(mask.astype(np.uint8)))
        bbox = coco_mask.toBbox(rle)
        bbox = bbox.tolist()
        bbox = [int(coord) for coord in bbox]
        area = int(coco_mask.area(rle))
        rle["counts"] = rle["counts"].decode("utf-8")

        mask_json = {}
        mask_json["segmentation"] = rle
        mask_json["bbox"] = bbox
        mask_json["area"] = area
        mask_json["category_id"] = None
        mask_json["category_name"] = None
        mask_json["id"] = -1
        mask_json["image_id"] = -1
        mask_json["iscrowd"] = 0

        return mask_json    

    def gen_annotations(self, image:np.ndarray, masks:List[np.ndarray], image_file:str = None) -> Dict:
        image_id = 0
        
        image_json = self.gen_image_json(image)
        image_json["image_id"] = image_id
        image_json["filename"] = image_file

        mask_jsons = []
        for mask_id, mask in enumerate(masks):
            mask_json = self.gen_mask_json(mask)
            mask_json["image_id"] = image_id
            mask_json["id"] = mask_id
            mask_jsons.append(mask_json)

        annotation_json = {}
        annotation_json["image"] = image_json
        annotation_json["annotations"] = mask_jsons

        return annotation_json