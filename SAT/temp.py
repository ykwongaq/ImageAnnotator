import json
from pycocotools import mask as mask_utils
import numpy as np

json_path = "C://Users//WYK//Documents//HKUST//MPhil//Research//SAT//test.json"


def polygon_to_mask(polygons, height, width):
    """
    Converts a polygon into a 2D binary mask.

    Args:
        polygons (list): List of polygons (each polygon is a list of coordinates [x1, y1, x2, y2, ...]).
        height (int): Height of the output mask.
        width (int): Width of the output mask.

    Returns:
        np.ndarray: 2D binary mask.
    """
    # Encode polygons to RLE
    rle = mask_utils.frPyObjects(polygons, height, width)
    # Convert RLE to binary mask
    mask = mask_utils.decode(rle)

    # If multiple polygons, sum them up
    if mask.ndim > 2:
        mask = np.sum(mask, axis=2) > 0

    return mask.astype(np.uint8)


def rle_to_mask(rle, height, width):
    """
    Converts an RLE-encoded mask into a 2D binary mask.

    Args:
        rle (dict): RLE-encoded mask (can be COCO-style dict or a compact RLE format).
        height (int): Height of the output mask.
        width (int): Width of the output mask.

    Returns:
        np.ndarray: 2D binary mask.
    """
    # Decode RLE to binary mask
    mask = mask_utils.decode(rle)

    # Ensure mask is 2D
    if mask.ndim > 2:
        mask = mask[..., 0]

    return mask.astype(np.uint8)


with open(json_path, "r") as f:
    json_data = json.load(f)

for annotation in json_data["annotations"]:
    poly = annotation["segmentation"]
    rle = mask_utils.frPyObjects(poly, 1024, 1365)
    print(len(rle))
    print(rle)

    # Check is the 2d numpy array it generated are the same or not
    mask_ploy = polygon_to_mask(poly, 1024, 1365)
    mask_rle = rle_to_mask(rle, 1024, 1365)

    print(np.array_equal(mask_ploy, mask_rle))
