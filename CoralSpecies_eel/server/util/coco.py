from pycocotools import mask as coco_mask
import numpy as np
from typing import Dict, List

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

def encode_to_coco_mask(mask:np.ndarray) -> Dict:
    mask = mask.astype(np.uint8)
    mask = np.asfortranarray(mask)
    rle = coco_mask.encode(mask)

    # Make sure that the counts are in a string format
    rle["counts"] = rle["counts"].decode("utf-8")
    return rle

def decode_coco_mask(segmentation: Dict) -> np.ndarray:
    mask = coco_mask.decode(segmentation)
    return mask