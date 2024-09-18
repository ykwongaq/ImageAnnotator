import eel
import random
import os
import threading
import numpy as np
import signal
import bottle
import base64
import json

from PIL import Image

from io import BytesIO

from annotator.embedding import EmbeddingGenerator
from annotator.util import decode_image_url, JsonUtil, get_resource_path, coco_mask_to_rle
from annotator.segmentation import CoralSegmentation
from annotator.dataset import Dataset, DataFilter
from annotator.maskEiditor import MaskEidtor

import logging

# Initialize logging
def setup_logging(log_file='log.log'):
    # Define a custom format for the log messages
    log_format = "[%(levelname)s][%(asctime)s][%(name)s] %(message)s"
    date_format = "%Y-%m-%d|%H:%M:%S"

    # Create console handler and set level to debug
    console_handler = logging.StreamHandler()
    console_handler.setLevel(logging.DEBUG)

    # Create file handler and set level to debug
    file_handler = logging.FileHandler(log_file)
    file_handler.setLevel(logging.DEBUG)

    # Create formatter and add it to the handlers
    formatter = logging.Formatter(fmt=log_format, datefmt=date_format)
    console_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)

    # Get the root logger and set level to debug
    root_logger = logging.getLogger()
    root_logger.setLevel(logging.DEBUG)

    # Add the handlers to the root logger
    root_logger.addHandler(console_handler)
    root_logger.addHandler(file_handler)

# Initialize logging
setup_logging()
logger = logging.getLogger(__name__)

# It is a MUST to put all the initialization code inside the if __name__ == "__main__": block
# due to the way multiprocessing works in Python
# Initialize the EmbeddingGenerator
model_path  = get_resource_path("models/sam_vit_b_01ec64.pth")
model_type = "vit_b"
embedding_generator = EmbeddingGenerator(model_path, model_type)

coral_model_path = get_resource_path("models/vit_b_coralscop.pth")
coral_segmentation = CoralSegmentation(coral_model_path, "vit_b")

onnx_path = get_resource_path("models/sam_vit_b.onnx")
mask_editor = MaskEidtor(onnx_path)

dataset = Dataset()
data_filter = DataFilter()

json_util = JsonUtil()

# Expose this function to JavaScript
@eel.expose
def get_random_number():
    return random.randint(1, 100)

def process_image_multiprocess(data_url, image_file, return_list, idx, embedding_generator):
    image = decode_image_url(data_url)
    embedding = embedding_generator.generate_embedding(image)

    image_filename = os.path.splitext(os.path.basename(image_file))[0]
    embedding_filename = f"{image_filename}.npy"

    np.save(embedding_filename, embedding)

    result = f"Embedding saved to {embedding_filename}"
    return_list.append((idx, result))

def gen_embedding(data_url, output_file):
    image = decode_image_url(data_url)
    embedding = embedding_generator.generate_embedding(image)
    logger.info(f"Saving embedding to {output_file}")
    np.save(output_file, embedding)

def gen_annotation_file(image, output_file):
    masks = coral_segmentation.generate_masks(image)
    json_item = json_util.gen_annotations(image, masks, os.path.basename(output_file))
    print(f"Saving annotation to {output_file}")
    json_util.save_json(json_item, output_file)

@eel.expose
def generate_embedding(data_url, image_file):
    return gen_embedding(data_url, image_file)

@eel.expose
def process(data_url, image_file):

    output_folder = "data"
    os.makedirs(output_folder, exist_ok=True)

    # Save image
    image = decode_image_url(data_url)
    image_folder = os.path.join(output_folder, "images")
    os.makedirs(image_folder, exist_ok=True)
    image_output_file = os.path.join(image_folder, image_file)
    logger.info(f"Saving image to {image_output_file}")
    
    image_object = Image.fromarray(image)
    image_object.save(image_output_file)

    # Generate embedding
    embedding_fodler = os.path.join(output_folder, "embeddings")
    os.makedirs(embedding_fodler, exist_ok=True)
    image_filename = os.path.splitext(os.path.basename(image_file))[0]
    embedding_filename = os.path.join(embedding_fodler, f"{image_filename}.npy")
    gen_embedding(data_url, embedding_filename)

    # Generate annotation
    annotation_folder = os.path.join(output_folder, "annotations")
    os.makedirs(annotation_folder, exist_ok=True)
    image_filename = os.path.splitext(os.path.basename(image_file))[0]
    annotation_filename = os.path.join(annotation_folder, f"{image_filename}.json")
    gen_annotation_file(image, annotation_filename)

    return f"Embedding and annotation saved for {image_file}"

@eel.expose
def terminate():
    global processes
    for p in processes:
        if p.is_alive():
            p.terminate()
            p.join()
            logger.info(f"Process {p.pid} terminated")

@eel.expose
def clear_dataset():
    logger.info("Clearing dataset ...")
    dataset.clear()

@eel.expose
def receive_file(file_content, relative_path):
    logger.info(f"Received file: {relative_path}")
    dataset.recieve_data(relative_path, file_content)

@eel.expose
def init_dataset():
    logger.info("Initializing dataset ...")
    dataset.init_data()

    return dataset.get_size()

@eel.expose
def get_data(idx: int):
    logger.info(f"Getting data for index {idx} ...")
    data = dataset.get_data(idx)

    image_content = data.get_image_content()
    json_item = data.get_annotations()
    filename = data.get_filename()

    annotations = json_item["annotations"]
    json_item["annotations"] = data_filter.filter_annotations(annotations)

    for annoation in json_item["annotations"]:
        mask = coco_mask_to_rle(annoation["segmentation"])
        annoation["segmentation"]["counts_number"] = mask

    return_item = {}
    return_item["image"] = image_content
    return_item["json_item"] = json_item
    return_item["filename"] = filename

    logger.info(f"Returning data for index {idx}:{filename} ...")
    return return_item
    
@eel.expose
def set_editting_image_by_idx(idx):
    logger.info(f"Setting editting image for index {idx} ...")
    data = dataset.get_data(idx)
    image = data.get_image()
    embedding = data.get_embedding()
    mask_editor.set_image(image, embedding)

@eel.expose
def add_edit_mask_input_point(x, y, label):
    mask_editor.add_input(x, y, label)
    mask = mask_editor.infer_mask()
    annotation = json_util.gen_mask_json(mask)
    rle = coco_mask_to_rle(annotation["segmentation"])
    annotation["segmentation"]["counts_number"] = rle

    return_item = {}
    return_item["annotation"] = annotation
    return_item["selected_points"] = mask_editor.get_input_points() 
    return_item["labels"] = mask_editor.get_input_labels()
    return return_item

@eel.expose
def undo_edit_mask_input_point():
    mask_editor.undo_input()
    mask = mask_editor.infer_mask()
    annotation = json_util.gen_mask_json(mask)
    rle = coco_mask_to_rle(annotation["segmentation"])
    annotation["segmentation"]["counts_number"] = rle

    return_item = {}
    return_item["annotation"] = annotation
    return_item["selected_points"] = mask_editor.get_input_points() 
    return_item["labels"] = mask_editor.get_input_labels()
    return return_item


@eel.expose
def clear_edit_mask_input_points():
    mask_editor.clear_inputs()


@eel.expose
def confirm_edit_mask_input():
    mask_editor.clear_inputs()

@eel.expose
def save_data(json_item, filename, idx):
    logger.info(f"Saving data for {filename} ...")
    output_folder = "output"
    os.makedirs(output_folder, exist_ok=True)

    output_path = os.path.join(output_folder, f"{filename}.json")
    json_util.save_json(json_item, output_path)

    dataset.save_annotation(idx, json_item)

if __name__ == "__main__":
    # Initialize Eel with the web folder
    eel.init('web')
    eel.start('main_page.html', size=(1200, 800))