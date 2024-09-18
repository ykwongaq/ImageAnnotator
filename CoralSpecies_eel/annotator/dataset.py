import os
import base64
import json
import numpy as np
import logging

from PIL import Image
from .util import load_json
from io import BytesIO
from .util import decode_coco_mask
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import List, Dict, Set

logger = logging.getLogger(__name__)

def load_image_from_content(content):
    try:
        image_data = base64.b64decode(content)
        image = Image.open(BytesIO(image_data))
        return np.array(image)
    except Exception as e:
        logger.error(f"Error processing image: {e}")
        return None
    
def load_json_from_content(content):
    try:
        decodes_bytes = base64.b64decode(content)
        json_str = decodes_bytes.decode("utf-8")
        return json.loads(json_str)
    except Exception as e:
        logger.error(f"Error processing json: {e}")
        return None

def load_numpy_from_content(content):
    try:
        numpy_data = base64.b64decode(content)
        return np.load(BytesIO(numpy_data))
    except Exception as e:
        logger.error(f"Error processing numpy: {e}")
        return None

class DataFilter:

    def __init__(self, area_limit:int = 5000, iou_limit: float = 0.5):
        self.area_limit = area_limit
        self.iou_limit = iou_limit



    def filter_annotations(self, annotations: List[Dict]) -> List[Dict]:
        # Step 1: Decode masks and compute areas in parallel
        def decode_and_compute_area(annotation):
            mask = decode_coco_mask(annotation["segmentation"])
            area = np.sum(mask)
            return mask, area

        with ThreadPoolExecutor() as executor:
            futures = [executor.submit(decode_and_compute_area, ann) for ann in annotations]

        masks = []
        areas = []
        filtered_indices = []
        for idx, future in enumerate(futures):
            mask, area = future.result()
            if area >= self.area_limit:
                masks.append(mask)
                areas.append(area)
                filtered_indices.append(idx)

        # Step 2: Generate all unique pairs for IoU computation
        n = len(masks)
        pairs = [(i, j) for i in range(n) for j in range(i + 1, n)]

        # Step 3: Compute IoUs in parallel
        def compute_iou(pair):
            i, j = pair
            mask_i = masks[i]
            mask_j = masks[j]
            intersection = np.sum(mask_i & mask_j)
            union = np.sum(mask_i | mask_j)
            iou = intersection / union if union > 0 else 0.0
            return (i, j, iou)

        indices_to_remove: Set[int] = set()

        with ThreadPoolExecutor() as executor:
            iou_futures = {executor.submit(compute_iou, pair): pair for pair in pairs}

            for future in as_completed(iou_futures):
                i, j, iou = future.result()
                if iou >= self.iou_limit:
                    # Decide which one to remove (e.g., the one with smaller area)
                    area_i = areas[i]
                    area_j = areas[j]
                    idx_i = filtered_indices[i]
                    idx_j = filtered_indices[j]

                    if area_i < area_j:
                        indices_to_remove.add(idx_i)
                    else:
                        indices_to_remove.add(idx_j)

        # Step 4: Build the final list of filtered annotations
        final_indices = [idx for idx in filtered_indices if idx not in indices_to_remove]
        filtered_annotations = [annotations[idx] for idx in final_indices]

        return filtered_annotations

class Data:

    def __init__(self, filename, image_content, embedding_content, json_content):
        self.filename = filename
        self.image_content = image_content
        self.embedding_content = embedding_content
        self.json_content = json_content

        self.image = None
        self.embedding = None
        self.annotations = None

    def get_image(self):
        if self.image is None:
            self.image = load_image_from_content(self.image_content)
        return self.image
    
    def get_embedding(self):
        if self.embedding is None:
            self.embedding = load_numpy_from_content(self.embedding_content)
        return self.embedding
    
    def get_annotations(self):
        if self.annotations is None:
            self.annotations = load_json_from_content(self.json_content)
        return self.annotations
    
    def get_image_content(self):
        extension = os.path.splitext(self.filename)[1][1:]
        extension = extension.lower()

        # Ensure the extension is valid
        valid_extensions = {'png', 'jpeg', 'jpg', 'gif', 'bmp'}
        if extension not in valid_extensions:
            extension = 'png'  # Default to png if not valid

        image_url = f"data:image/{extension};base64,{self.image_content}"
        return image_url
    
    def get_embedding_content(self):
        return self.embedding_content
    
    def get_annotation_content(self):
        return self.json_content
    
    def get_filename(self):
        return self.filename
    
    def set_annotation(self, annotation):
        self.annotations = annotation

        categoryDict = {}
        for category in annotation["categories"]:
            categoryDict[category["id"]] = category["name"]

        for annotation in self.annotations["annotations"]:
            annotation["category_name"] = categoryDict[annotation["category_id"]]

    
class Dataset:
    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.logger.info(f"Initializing {self.__class__.__name__} ...")

        self.recieved_images = {}
        self.recieved_embeddings = {}
        self.recieved_jsons = {}
        self.project_info = None

        self.data_list = []

        self.data_folder = "data"
        self.image_folder = os.path.join(self.data_folder, "images")
        self.embedding_folder = os.path.join(self.data_folder, "embeddings")
        self.annotation_folder = os.path.join(self.data_folder, "annotations")


    def clear(self):
        self.recieved_images = {}
        self.recieved_embeddings = {}
        self.recieved_jsons = {}
        self.project_info = None

        self.data_list = []

    def init_data(self):
        # Loop all the recieved data
        filenames = set(self.recieved_images.keys()) & set(self.recieved_embeddings.keys()) & set(self.recieved_jsons.keys())
        filenames = list(filenames)

        filenames.sort()

        for filename in filenames:
            image_content = self.recieved_images[filename]
            embedding_content = self.recieved_embeddings[filename]
            annotation_content = self.recieved_jsons[filename]

            data = Data(filename, image_content, embedding_content, annotation_content)
            self.data_list.append(data)

        return self.get_size()

    def get_data_list(self):
        return self.data_list   
    
    def get_data(self, idx):
        return self.data_list[idx]

    def is_in_embedding_folder(self, file_path):
        normalized_path = os.path.normpath(file_path)
        return self.embedding_folder in normalized_path
    
    def is_in_image_folder(self, file_path):
        normalized_path = os.path.normpath(file_path)
        return self.image_folder in normalized_path
    
    def is_in_annotation_folder(self, file_path):
        normalized_path = os.path.normpath(file_path)
        return self.annotation_folder in normalized_path

    def is_project_file(self, file_path):
        filename = os.path.basename(file_path)
        return filename == "project.json"
    
    def get_size(self):
        return len(self.data_list)

    def recieve_data(self, file_path, file_content):
        filename = os.path.basename(file_path)
        filename = os.path.splitext(filename)[0]
        if self.is_in_image_folder(file_path):
            self.recieved_images[filename] = file_content
        elif self.is_in_embedding_folder(file_path):
            self.recieved_embeddings[filename] = file_content
        elif self.is_in_annotation_folder(file_path):
            self.recieved_jsons[filename] = file_content
        elif self.is_project_file(file_path):
            self.project_info = load_json_from_content(file_content)

    def save_annotation(self, idx, annotation):
        data = self.data_list[idx]
        data.set_annotation(annotation)
        
