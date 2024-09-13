import json
from pycocotools import mask as coco_mask
import numpy as np
import os
import cv2

import argparse
from tqdm import tqdm
from segment_anything import sam_model_registry, SamPredictor

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

def process_json(args):
    data_dir = args.data_dir

    annotation_dir = os.path.join(data_dir, "annotations")
    output_dir = annotation_dir
    os.makedirs(output_dir, exist_ok=True)

    area_limit = args.area_limit
    iou_limit = args.iou_limit

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
                if iou > iou_limit:
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

            annotation["segmentation"]["counts_number"] = rle_encode(mask)
            output_annotations.append(annotation)

        data["annotations"] = output_annotations
        output_path = os.path.join(output_dir, annotation_filename)
        write_json(data, output_path)

from segment_anything import sam_model_registry, SamPredictor


def gen_embeddings(args):
    data_dir = args.data_dir
    image_dir = os.path.join(data_dir, "images")
    embeddings_dir = os.path.join(data_dir, "embeddings")
    os.makedirs(embeddings_dir, exist_ok=True)

    sam = sam_model_registry[args.model_type](checkpoint=args.checkpoint)
    sam = sam.to("cuda")
    predictor = SamPredictor(sam)

    for image_name in tqdm(os.listdir(image_dir)):
        image_path = os.path.join(image_dir, image_name)
        image = cv2.imread(image_path)
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

        predictor.set_image(image)
        image_embedding = predictor.get_image_embedding().cpu().numpy()

        image_name_without_ext = os.path.splitext(image_name)[0]
        embeddings_path = os.path.join(embeddings_dir, f"{image_name_without_ext}.npy")
        with open(embeddings_path, "wb") as f:
            np.save(f, image_embedding)

def main(args):
    process_json(args)
    gen_embeddings(args)


if __name__ == "__main__":
    DEFAULT_DATA_FOLDER = "../data"
    parser = argparse.ArgumentParser()
    parser.add_argument("--data_dir", type=str, default=DEFAULT_DATA_FOLDER)
    parser.add_argument("--area_limit", type=int, default=5000)
    parser.add_argument("--iou_limit", type=float, default=0.5)
    parser.add_argument(
        "--checkpoint",
        type=str,
        default="models/sam_vit_h_4b8939.pth",
        help="The path to the SAM model checkpoint."
    )
    parser.add_argument(
        "--model-type",
        type=str,
        default="vit_h",
        help="In ['default', 'vit_h', 'vit_l', 'vit_b']. Which type of SAM model to export."
    )
    args = parser.parse_args()
    main(args)
