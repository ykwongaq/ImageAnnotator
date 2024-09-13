from typing import List, Dict
from pycocotools import mask as coco_mask
import json
import numpy as np

def read_json(file_path:str) -> Dict:
    with open(file_path, 'r') as f:
        data = json.load(f)
    return data

def encode_rle_number(mask: np.ndarray) -> List[int]:
    # Flatten the mask array
    mask_array = mask.flatten()
    
    # Find the indices where the value changes
    changes = np.diff(mask_array, prepend=mask_array[0])
    
    # Get the positions of the changes
    change_positions = np.where(changes != 0)[0]
    
    # Calculate the run lengths
    run_lengths = np.diff(np.concatenate([[0], change_positions, [mask_array.size]]))
    
    run_lengths = run_lengths.tolist()

    return list(map(int, run_lengths))


def cal_iou(mask_1, mask_2) -> float:
    intersection = np.logical_and(mask_1, mask_2).sum()
    union = np.logical_or(mask_1, mask_2).sum()
    return intersection / union if union != 0 else 0

def process_json(json_data: Dict, area_limit=5000, iou_limit=0.5) -> Dict:
    output_annotations = []
    processed_masks = []
    processed_areas = []

    for annotation in json_data['annotations']:
        mask = coco_mask.decode(annotation['segmentation'])

        # Calculate area once
        area = np.sum(mask)
        if area < area_limit:
            continue

        skip = False
        for processed_mask, processed_area in zip(processed_masks, processed_areas):
            # Quick area check before IoU
            if area + processed_area - iou_limit * processed_area < iou_limit * area_limit:
                continue
            iou = cal_iou(mask, processed_mask)
            if iou > iou_limit:
                skip = True
                break

        if skip:
            continue

        rle_number = encode_rle_number(mask)
        annotation['segmentation']['counts_number'] = rle_number
        output_annotations.append(annotation)
        processed_masks.append(mask)
        processed_areas.append(area)

    json_data['annotations'] = output_annotations

    return json_data