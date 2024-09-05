import json
from pycocotools import mask as coco_mask
import numpy as np
import os

import argparse
from tqdm import tqdm


def read_json(file):
    with open(file) as f:
        data = json.load(f)
    return data


def write_json(data, file):
    with open(file, "w") as f:
        json.dump(data, f)


def rle_encode(array):
    flag = False
    count = 0

    results = []
    for element in array:
        value = int(flag)
        if element == value:
            count += 1
        else:
            results.append(count)
            count = 1
            flag = not flag
    results.append(count)
    return results


def cal_iou(mask_1, mask_2):
    intersection = np.logical_and(mask_1, mask_2)
    union = np.logical_or(mask_1, mask_2)

    intersection = np.sum(intersection)
    union = np.sum(union)

    if union == 0:
        return 0

    iou = intersection / union
    return iou


def main(args):
    annotation_dir = args.annotation_dir
    output_dir = args.output_dir
    os.makedirs(output_dir, exist_ok=True)

    area_limit = args.area_limit

    for annotation_filename in tqdm(os.listdir(annotation_dir)):
        annotation_path = os.path.join(annotation_dir, annotation_filename)
        data = read_json(annotation_path)

        output_annotations = []
        processed_masks = []
        for annotation in data["annotations"]:
            mask = annotation["segmentation"]
            mask = coco_mask.decode(mask)

            # Skil if the iou > 0.9
            skip = False
            for processed_mask in processed_masks:
                iou = cal_iou(mask, processed_mask)
                if iou > 0.5:
                    skip = True
                    break
            processed_masks.append(mask)

            if skip:
                continue

            area = np.sum(mask)
            if area < area_limit:
                continue

            # Flatten the 2d array
            mask = mask.flatten()
            mask = list(mask)

            annotation["segmentation"]["counts"] = rle_encode(mask)
            output_annotations.append(annotation)

        data["annotations"] = output_annotations
        output_path = os.path.join(output_dir, annotation_filename)
        write_json(data, output_path)


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--annotation_dir", type=str, default="../data/annotations")
    parser.add_argument(
        "--output_dir", type=str, default="../data/annotations_processed"
    )
    parser.add_argument("--area_limit", type=int, default=5000)
    args = parser.parse_args()
    main(args)


def rle_decode(rle):
    flattened_array = []
    value = False
    for length in rle:
        flattened_array.extend([value] * length)
        value = not value

    # Convert boolean to int
    flattened_array = [int(i) for i in flattened_array]
    return flattened_array
