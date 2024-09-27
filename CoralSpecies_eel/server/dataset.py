import copy
import logging
import os
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from io import BytesIO
from typing import Dict, List, Set
import base64

import numpy as np
from PIL import Image

from .util.coco import decode_coco_mask
from .util.general import (
    time_it,
)
from .util.json import save_json, load_json


class DataFilter:
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(DataFilter, cls).__new__(cls)
        return cls._instance

    def __init__(
        self, area_limit: int = 0.001, iou_limit: float = 0.5, predict_iou_limit=0.5
    ):
        if not hasattr(self, "initialized"):
            self.logger = logging.getLogger(self.__class__.__name__)
            self.area_limit = area_limit
            self.iou_limit = iou_limit
            self.predict_iou_limit = predict_iou_limit
            self.initialized = True

    def update_filter(self, config):
        self.logger.info(f"Updating filter with config: {config}")
        self.set_area_limit(config["minArea"])
        self.set_iou_limit(config["maxIOU"])
        self.set_predict_iou_limit(config["minConfidence"])

    def set_area_limit(self, area_limit: int):
        self.area_limit = area_limit

    def set_iou_limit(self, iou_limit: float):
        self.iou_limit = iou_limit

    def set_predict_iou_limit(self, predict_iou_limit: float):
        self.predict_iou_limit = predict_iou_limit

    def export_config(self):
        return {
            "minArea": self.area_limit,
            "maxIOU": self.iou_limit,
            "minConfidence": self.predict_iou_limit,
        }

    @time_it
    def filter_by_area(self, annotations: List, area_limit: float) -> Set:
        if len(annotations) == 0:
            self.logger.info("No annotations to filter")
            return set()

        def decode_and_compute_area(annotation):
            mask = decode_coco_mask(annotation["segmentation"])
            area = np.sum(mask)
            return area

        with ThreadPoolExecutor() as executor:
            futures = [
                executor.submit(decode_and_compute_area, ann) for ann in annotations
            ]

        image_size = annotations[0]["segmentation"]["size"]
        image_height = int(image_size[0])
        image_width = int(image_size[1])
        total_area = image_height * image_width
        min_area = total_area * area_limit

        filtered_index = set()
        for idx, future in enumerate(futures):
            area = future.result()
            if area > min_area:
                filtered_index.add(idx)

        self.logger.info(f"Filtered index: {filtered_index}")
        return filtered_index

    @time_it
    def filtered_by_predicted_iou(
        self, annotations: List, predicted_iou_limit: float
    ) -> Set:
        filtered_index = set()
        for idx, annotation in enumerate(annotations):
            if annotation["predicted_iou"] > predicted_iou_limit:
                filtered_index.add(idx)
        return filtered_index

    @time_it
    def filtered_by_iou(self, annotations: List, iou_limit: float) -> Set:
        def decode_mask(annotation):
            return decode_coco_mask(annotation["segmentation"])

        with ThreadPoolExecutor() as executor:
            masks = list(executor.map(decode_mask, annotations))

        M = np.array([mask.flatten() for mask in masks], dtype=np.bool_)
        areas = M.sum(axis=1)

        intersection = M @ M.T
        union = areas[:, None] + areas[None, :] - intersection

        # Compute IoU matrix
        iou_matrix = intersection / union

        # Apply Non-Maximum Suppression (NMS)
        indices = np.argsort(-areas)
        suppressed = np.zeros(len(areas), dtype=bool)
        keep = set()

        for i in indices:
            if suppressed[i]:
                continue
            keep.add(i)
            suppressed |= iou_matrix[i] > iou_limit
            suppressed[i] = False

        return keep

    @time_it
    def filter_annotations(self, annotations: List[Dict]) -> List[Dict]:
        filtered_indices_by_area = self.filter_by_area(annotations, self.area_limit)
        filtered_indices_by_iou = self.filtered_by_predicted_iou(
            annotations, self.iou_limit
        )
        filtered_indices_by_predicted_iou = self.filtered_by_iou(
            annotations, self.predict_iou_limit
        )
        filtered_indices = (
            filtered_indices_by_area
            & filtered_indices_by_iou
            & filtered_indices_by_predicted_iou
        )

        filtered_indices = list(filtered_indices)
        filtered_indices = [int(idx) for idx in filtered_indices]
        return filtered_indices

class Data:
    def __init__(self, filename:str, image:np.ndarray, embedding:np.ndarray, json_item:Dict):
        self.image = image
        self.embedding = embedding
        self.json_item = json_item
        self.filename = filename

    def get_image(self):
        return self.image

    def get_embedding(self):
        return self.embedding
    
    def get_json_item(self):
        return self.json_item
    
    def get_filename(self):
        return self.filename
    
    def set_json_item(self, json_item: Dict):
        self.json_item = json_item
    
    @time_it
    def get_image_content(self):
        # Ensure the imaeg is uint8
        if self.image.dtype != np.uint8:
            image_array = (255 * (self.image / np.max(self.image))).astype(np.uint8)
        else:
            image_array = self.image

        buffered = BytesIO()
        
        image_content = Image.fromarray(image_array)
        image_content.save(buffered, format="PNG")

        image_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
        data_url = f"data:image/png;base64,{image_str}"
        return data_url

class Dataset:
    def __init__(self, output_dir: str = "."):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.logger.info(f"Initializing {self.__class__.__name__} ...")

        self.recieved_images = {}
        self.recieved_embeddings = {}
        self.recieved_jsons = {}
        self.project_info = None
        self.project_info_content = None

        self.data_list = []

        self.output_dir = output_dir
        self.data_folder = "data"
        self.image_folder = os.path.join(self.data_folder, "images")
        self.embedding_folder = os.path.join(self.data_folder, "embeddings")
        self.annotation_folder = os.path.join(self.data_folder, "annotations")

        self.current_data_idx = 0

    def clear(self):
        self.logger.info("Clearing dataset ...")
        self.recieved_images = {}
        self.recieved_embeddings = {}
        self.recieved_jsons = {}
        self.project_info = None
        self.project_info_content = None

        self.data_list = []

    def add_data(self, data):
        self.data_list.append(data)

    def load_project(self, project_path):
        self.logger.info(f"Loading project from {project_path} ...")
        self.clear()

        data_folder = os.path.join(project_path, "data")
        image_folder = os.path.join(data_folder, "images")
        embedding_folder = os.path.join(data_folder, "embeddings")
        annotation_folder = os.path.join(data_folder, "annotations")
        project_json_file = os.path.join(data_folder, "project.json")

        if not os.path.isdir(data_folder):
            error_message = f"Data folder not found: {data_folder}"
            return error_message
        
        if not os.path.isdir(image_folder):
            error_message = f"Image folder not found: {image_folder}"
            return error_message
        
        if not os.path.isdir(embedding_folder):
            error_message = f"Embedding folder not found: {embedding_folder}"
            return error_message
        
        if not os.path.isdir(annotation_folder):
            error_message = f"Annotation folder not found: {annotation_folder}"
            return error_message
        
        if not os.path.isfile(project_json_file):
            error_message = f"Project json file not found: {project_json_file}"
            return error_message
        
        self.project_info = load_json(project_json_file)
        self.current_data_idx = 0
        if "last_image_idx" in self.project_info:
            self.current_data_idx = self.project_info["last_image_idx"]

        image_files = os.listdir(image_folder)
        image_files.sort()

        filenames = [os.path.splitext(filename)[0] for filename in image_files]

        annotation_files = []
        for filename in filenames:
            annotation_file = os.path.join(annotation_folder, f"{filename}.json")
            if not os.path.isfile(annotation_file):
                error_message = f"Annotation file not found: {annotation_file}"
                return error_message
            annotation_files.append(os.path.basename(annotation_file))
        
        embedding_files = []
        for filename in filenames:
            embedding_file = os.path.join(embedding_folder, f"{filename}.npy")
            if not os.path.isfile(embedding_file):
                error_message = f"Embedding file not found: {embedding_file}"
                return error_message
            embedding_files.append(os.path.basename(embedding_file))

        # Verify that the corresponding files are at the same order
        if len(filenames) != len(annotation_files) or len(filenames) != len(embedding_files):
            self.logger.error(f"Number of files: {len(filenames)}")
            self.logger.error(f"Number of annotation files: {len(annotation_files)}")
            self.logger.error(f"Number of embedding files: {len(embedding_files)}")
            error_message = "Number of files do not match"
            return error_message
        
        for (imaeg_filename, embedding_filename, annotation_filename) in zip(image_files, embedding_files, annotation_files):
            # Verify that the filenames are the same
            image_filename_without_extension = os.path.splitext(imaeg_filename)[0]
            embedding_filename_without_extension = os.path.splitext(embedding_filename)[0]
            annotation_filename_without_extension = os.path.splitext(annotation_filename)[0]

            if image_filename_without_extension != embedding_filename_without_extension or image_filename_without_extension != annotation_filename_without_extension:
                self.logger.error(f"Image filename: {image_filename_without_extension}")
                self.logger.error(f"Embedding filename: {embedding_filename_without_extension}")
                self.logger.error(f"Annotation filename: {annotation_filename_without_extension}")
                self.logger.error("Filenames do not match")
                error_message = "Filenames do not match"
                return error_message
            
            image_path = os.path.join(image_folder, imaeg_filename)
            embedding_path = os.path.join(embedding_folder, embedding_filename)
            annotation_path = os.path.join(annotation_folder, annotation_filename)

            image = Image.open(image_path)
            image = np.array(image)
            embedding = np.load(embedding_path)
            annotation = load_json(annotation_path)
        
            data = Data(image_filename_without_extension, image, embedding, annotation)
            self.data_list.append(data)

        return None 
            
    # @time_it
    # def init_data(self):
    #     self.logger.info("Initializing data ...")
    #     filenames = (
    #         set(self.recieved_images.keys())
    #         & set(self.recieved_embeddings.keys())
    #         & set(self.recieved_jsons.keys())
    #     )

    #     filenames = list(filenames)

    #     filenames.sort()

    #     for filename in filenames:
    #         image_content = self.recieved_images[filename]
    #         embedding_content = self.recieved_embeddings[filename]
    #         annotation_content = self.recieved_jsons[filename]

    #         data = Data(filename, image_content, embedding_content, annotation_content)
    #         self.data_list.append(data)

    #     self.project_info = load_json_from_content(self.project_info_content)

    #     if "last_image_idx" in self.project_info:
    #         self.current_data_idx = self.project_info["last_image_idx"]

    def setProjectInfo(self, project_info):
        self.project_info = project_info

    def get_current_data_idx(self) -> int:
        return self.current_data_idx

    def get_data(self, idx: int) -> Data:
        if idx < 0 or idx >= len(self.data_list):
            self.logger.error(
                f"Invalid index: {idx} out of range [0, {len(self.data_list)})"
            )
            return None
        self.logger.info(f"Getting data for index {idx} ...")
        self.current_data_idx = idx
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

    @time_it
    def recieve_data(self, file_path, file_content):
        self.logger.info(f"Received file: {file_path}")
        filename = os.path.basename(file_path)
        filename = os.path.splitext(filename)[0]
        if self.is_in_image_folder(file_path):
            self.recieved_images[filename] = file_content
        elif self.is_in_embedding_folder(file_path):
            self.recieved_embeddings[filename] = file_content
        elif self.is_in_annotation_folder(file_path):
            self.recieved_jsons[filename] = file_content
        elif self.is_project_file(file_path):
            self.project_info_content = file_content
        else:
            self.logger.error(f"Unknown file type: {file_path}")

    def get_project_info(self):
        return self.project_info

    def update_project_info(self, new_info):
        self.project_info.update(new_info)
        self.logger.info(f"Updated project info: {self.project_info}")

    def process_json_to_coco_json(self, json_item):

        category_dict = {}
        for annotation in json_item["annotations"]:
            category_id = annotation["category_id"]
            category_name = annotation["category_name"]
            if category_id is not None and category_name is not None:
                category_dict[category_id] = category_name

        output_annotations = []
        for annotation in json_item["annotations"]:
            category_id = annotation["category_id"]
            if category_id is not None:
                annotation_copy = copy.deepcopy(annotation)
                del annotation_copy["category_name"]
                output_annotations.append(annotation_copy)

        json_copy = copy.deepcopy(json_item)
        json_copy["annotations"] = output_annotations
        json_copy["categories"] = []
        for category_id, category_name in category_dict.items():
            json_copy["categories"].append({"id": category_id, "name": category_name})

        return json_copy

    def upate_filter_config_in_project_info(self, config):
        if "filter_config" not in self.project_info:
            self.project_info["filter_config"] = {}
        self.project_info["filter_config"][str(self.current_data_idx)] = config

    def save_annotation(self, idx, annotation):
        self.logger.info(f"Saving annotation for index {idx} ...")
        data = self.get_data(idx)

        if data is None:
            return

        data.set_json_item(annotation)

        # Overwrite the annotation file
        project_path = self.project_info["project_path"]
        output_annotation_folder = os.path.join(project_path, self.annotation_folder)
        filename = data.get_filename()
        output_path = os.path.join(output_annotation_folder, f"{filename}.json")
        save_json(annotation, output_path)

        # Save coco json to outputs folder
        coco_json = self.process_json_to_coco_json(annotation)
        output_fodler = os.path.join(project_path, "data", "outputs")
        os.makedirs(output_fodler, exist_ok=True)
        output_path = os.path.join(output_fodler, f"{data.get_filename()}.json")
        save_json(coco_json, output_path)

        # Update last image idx to project.json
        self.project_info["last_image_idx"] = idx
        if "filter_config" not in self.project_info:
            self.project_info["filter_config"] = {}
        self.project_info["filter_config"][str(idx)] = DataFilter().export_config()

        # Save project.json
        data_folder = os.path.join(project_path, "data")
        project_path = os.path.join(data_folder, "project.json")
        save_json(self.project_info, project_path)
