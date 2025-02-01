import logging
import os
import threading
import time
import eel
import numpy as np
import zipfile
import shutil

from .util.general import decode_image_url
from .util.json import gen_image_json, save_json, load_json
from .embedding import EmbeddingGenerator
from .dataset import Dataset, Data
from PIL import Image
from .util.data import zip_file, unzip_file
from .util.requests import ProjectCreateRequest

from .jsonFormat import (
    ImageJson,
    AnnotationJson,
    CategoryJson,
    ProjectInfoJson,
    AnnotationFileJson,
    COCOJson,
)

from typing import Dict, Tuple, List, Union

TEMP_CREATE_NAME = "__coralscop_lat_temp"
TEMP_CREATE_NAME_2 = "__coralscop_lat_temp_2"
TEMP_LOAD_NAME = "__coralscop_lat_temp_load"


class ProjectCreator:

    SAM_ENCODER_PATH = "models/vit_h_encoder_quantized.onnx"
    SAM_MODEL_TYPE = "vit_b"

    # Singleton
    _instance = None

    def __new__(cls, *args, **kwargs):
        if cls._instance is None:
            cls._instance = super(ProjectCreator, cls).__new__(cls)
        return cls._instance

    def __init__(self, embedding_generator: EmbeddingGenerator):
        if hasattr(self, "initialized"):
            # Prevent re-initialization
            return

        self.logger = logging.getLogger(self.__class__.__name__)
        self.embeddings_generator = embedding_generator

        # Threading
        self.stop_event = threading.Event()
        self.worker_thread = None

    def create_(
        self,
        request: ProjectCreateRequest,
        frontend_enabled: bool = True,
    ):
        """
        Create a proejct from the request. The project data will be stored in a zip file with .coral extension.
        """
        inputs = request.get_inputs()
        inputs = sorted(inputs, key=lambda x: x["image_file_name"])

        output_file = request.get_output_file()
        if os.path.exists(output_file):
            os.remove(output_file)

        output_dir = os.path.dirname(output_file)

        # Temporary folders for storing images, embeddings, annotations, and project info
        output_temp_dir = os.path.join(output_dir, TEMP_CREATE_NAME)
        # Clear the temporary folder if it exists
        if os.path.exists(output_temp_dir):
            shutil.rmtree(output_temp_dir)
        os.makedirs(output_temp_dir, exist_ok=True)

        image_folder = os.path.join(output_temp_dir, "images")
        os.makedirs(image_folder, exist_ok=True)

        embedding_folder = os.path.join(output_temp_dir, "embeddings")
        os.makedirs(embedding_folder, exist_ok=True)

        annotation_folder = os.path.join(output_temp_dir, "annotations")
        os.makedirs(annotation_folder, exist_ok=True)

        project_info_path = os.path.join(output_temp_dir, "project_info.json")

        # Update process in the frontend

        if frontend_enabled:
            eel.updateProgressPercentage(0)

        terminated = False
        for idx, input in enumerate(inputs):
            image_filename = input["image_file_name"]
            filename = os.path.splitext(image_filename)[0]

            self.logger.info(f"Processing input {idx + 1} of {len(inputs)}")
            self.logger.info(f"Processing image: {image_filename}")

            # image, embedding, annotations = self.process_one_input(
            #     image_url, image_filename, min_area, min_confidence, max_iou
            # )

            start_time = time.time()
            self.logger.info(f"Processing image {image_filename} ...")

            # Create image
            if "image_path" in input:
                image_path = input["image_path"]
                image = Image.open(image_path)
                image = np.array(image)
            else:
                image_url = input["image_url"]
                image = decode_image_url(image_url)

            if self.stop_event.is_set():
                self.logger.info("Project creation stopped.")
                terminated = True
                break

            # Generate embedding
            embedding = self.embeddings_generator.generate_embedding(image)
            if self.stop_event.is_set():
                self.logger.info("Project creation stopped.")
                terminated = True
                break

            # Detect coral
            annotation_file_json = AnnotationFileJson()

            image_json = ImageJson()
            image_json.set_id(idx)
            image_json.set_filename(image_filename)
            image_json.set_width(image.shape[1])
            image_json.set_height(image.shape[0])
            annotation_file_json.add_image(image_json)

            image_path = os.path.join(image_folder, image_filename)
            embedding_path = os.path.join(embedding_folder, f"{filename}.npy")
            annotation_path = os.path.join(annotation_folder, f"{filename}.json")

            np.save(embedding_path, embedding)
            save_json(annotation_file_json.to_json(), annotation_path)
            Image.fromarray(image).save(image_path)

            process_percentage = (idx + 1) / len(inputs) * 100
            process_percentage = int(process_percentage)

            if frontend_enabled:
                eel.updateProgressPercentage(process_percentage)

        if terminated:
            # If the process is terminated, clear the temporary folder and return
            # self.clear_temp_folder(output_dir)
            shutil.rmtree(output_temp_dir)
            status = {}
            status["finished"] = False

            if frontend_enabled:
                eel.afterProjectCreation(status)
            return

        project_info_json = ProjectInfoJson()
        project_info_json.set_last_image_idx(0)

        save_json(project_info_json.to_json(), project_info_path)

        # project_name = self.find_available_project_name(output_dir)
        # project_path = os.path.join(output_dir, project_name)
        project_path = output_file
        with zipfile.ZipFile(project_path, "w") as archive:
            for root, _, files in os.walk(output_temp_dir):
                for file in files:
                    archive.write(
                        os.path.join(root, file),
                        os.path.relpath(os.path.join(root, file), output_temp_dir),
                    )

        if os.path.exists(output_temp_dir):
            shutil.rmtree(output_temp_dir)

        status = {}
        status["finished"] = True
        status["project_path"] = project_path

        if frontend_enabled:
            eel.afterProjectCreation(status)

    def create(
        self,
        request: ProjectCreateRequest,
        frontend_enabled: bool = True,
    ):
        """
        Create a project from the request. A threading process will be created to handle user termination.
        """
        if self.worker_thread is not None and self.worker_thread.is_alive():
            self.logger.info("Task is already running.")
            return

        self.stop_event.clear()
        self.worker_thread = threading.Thread(
            target=self.create_, args=(request, frontend_enabled)
        )
        self.worker_thread.start()

    def terminate(self):
        """
        Terminate the current project creation process.
        """
        if (self.worker_thread is None) or (not self.worker_thread.is_alive()):
            self.logger.info("No task running.")
            return
        self.stop_event.set()

    def find_available_project_name(self, output_dir: str) -> str:
        project_name = "project.sat"
        i = 1
        while os.path.exists(os.path.join(output_dir, project_name)):
            project_name = f"project_{i}.sat"
            i += 1

            if i > 1000:
                raise Exception("Too many project files in the output directory")
        return project_name

    def save_dataset(
        self, dataset: Dataset, project_path_origin: str, project_path_new: str
    ):
        # Unzip the original project to temp folder
        temp_folder_origin = os.path.join(
            os.path.dirname(project_path_origin), TEMP_CREATE_NAME
        )
        if os.path.exists(temp_folder_origin):
            shutil.rmtree(temp_folder_origin)

        os.makedirs(temp_folder_origin, exist_ok=True)
        with zipfile.ZipFile(project_path_origin, "r") as archive:
            archive.extractall(temp_folder_origin)

        # Create temp folder for the new project
        temp_folder_new = os.path.join(
            os.path.dirname(project_path_new), TEMP_CREATE_NAME_2
        )
        if os.path.exists(temp_folder_new):
            shutil.rmtree(temp_folder_new)
        os.makedirs(temp_folder_new, exist_ok=True)

        # Copy the images to the new project folder
        image_folder_origin = os.path.join(temp_folder_origin, "images")
        image_folder_new = os.path.join(temp_folder_new, "images")
        os.makedirs(image_folder_new, exist_ok=True)
        for image_name in os.listdir(image_folder_origin):
            image_path_origin = os.path.join(image_folder_origin, image_name)
            image_path_new = os.path.join(image_folder_new, image_name)
            shutil.copy(image_path_origin, image_path_new)

        # Copy the embeddings to the new project folder
        embedding_folder_origin = os.path.join(temp_folder_origin, "embeddings")
        embedding_folder_new = os.path.join(temp_folder_new, "embeddings")
        os.makedirs(embedding_folder_new, exist_ok=True)
        for embedding_name in os.listdir(embedding_folder_origin):
            embedding_path_origin = os.path.join(
                embedding_folder_origin, embedding_name
            )
            embedding_path_new = os.path.join(embedding_folder_new, embedding_name)
            shutil.copy(embedding_path_origin, embedding_path_new)

        # Generate annotation to the new project folder
        annotation_folder_new = os.path.join(temp_folder_new, "annotations")
        os.makedirs(annotation_folder_new, exist_ok=True)
        for data in dataset.get_data_list():
            filename = os.path.splitext(data.get_image_name())[0]
            annotation_path = os.path.join(annotation_folder_new, f"{filename}.json")

            annotation_file_json = AnnotationFileJson()

            image_json = ImageJson()
            image_json.set_id(data.get_idx())
            image_json.set_filename(data.get_image_name())
            image_json.set_width(data.get_image_width())
            image_json.set_height(data.get_image_height())
            annotation_file_json.add_image(image_json)

            for mask in data.get_segmentation()["annotations"]:
                annotation_json = AnnotationJson()
                annotation_json.set_segmentation(mask["segmentation"])
                annotation_json.set_bbox(mask["bbox"])
                annotation_json.set_area(mask["area"])
                annotation_json.set_category_id(mask["category_id"])
                annotation_json.set_id(mask["id"])
                annotation_json.set_image_id(data.get_idx())
                annotation_json.set_iscrowd(mask["iscrowd"])
                annotation_file_json.add_annotation(annotation_json)

            save_json(annotation_file_json.to_json(), annotation_path)

        # Generate the project info file to the new project folder
        project_info_path = os.path.join(temp_folder_new, "project_info.json")

        project_info_json = ProjectInfoJson()
        project_info_json.set_last_image_idx(dataset.get_last_saved_id())
        for category in dataset.get_category_info():
            category_json = CategoryJson()
            category_json.set_id(category["id"])
            category_json.set_name(category["name"])
            category_json.set_super_category(category["super_category"])
            project_info_json.add_category_info(category_json)

        project_info_json.set_last_image_idx(dataset.get_last_saved_id())

        save_json(project_info_json.to_json(), project_info_path)

        # Remove the temp folder for original project
        shutil.rmtree(temp_folder_origin)

        # Zip the new project folder to the new project path
        if os.path.exists(project_path_new):
            os.remove(project_path_new)

        with zipfile.ZipFile(project_path_new, "w") as archive:
            for root, _, files in os.walk(temp_folder_new):
                for file in files:
                    archive.write(
                        os.path.join(root, file),
                        os.path.relpath(os.path.join(root, file), temp_folder_new),
                    )

        # Remove the temp folder for the new project
        shutil.rmtree(temp_folder_new)


class ProjectLoader:

    WEB_FOLDER_NAME = "web"
    ASSET_FOLDER = "assets/images"

    def __init__(self):
        self.logger = logging.getLogger(self.__class__.__name__)

    def load(self, project_path: str) -> Union[Dataset, int]:
        """
        Load a project from the given project path.

        Returns:
        - Dataset: The loaded dataset
        - int: Last image index
        """
        # Unzip the project file
        start_time = time.time()
        temp_output_dir = os.path.join(os.path.dirname(project_path), TEMP_LOAD_NAME)
        with zipfile.ZipFile(project_path, "r") as archive:
            archive.extractall(temp_output_dir)
        self.logger.info(f"Unzipped project in {time.time() - start_time} seconds")

        # Load data from the project folder
        start_time = time.time()
        dataset = Dataset()

        image_folder = os.path.join(temp_output_dir, "images")
        embedding_folder = os.path.join(temp_output_dir, "embeddings")
        annotation_folder = os.path.join(temp_output_dir, "annotations")
        project_info_path = os.path.join(temp_output_dir, "project_info.json")

        image_filenames = os.listdir(image_folder)
        image_filenames = sorted(image_filenames)
        filenames = [os.path.splitext(filename)[0] for filename in image_filenames]

        # Move the images files to the assets folder
        image_files = [
            os.path.join(image_folder, filename)
            for filename in os.listdir(image_folder)
        ]
        asset_image_paths = self.store_image(image_files)
        asset_image_paths = sorted(asset_image_paths)

        # Construct dataset
        dataset = Dataset()
        for idx, filename in enumerate(filenames):
            embedding_path = os.path.join(embedding_folder, f"{filename}.npy")
            annotation_path = os.path.join(annotation_folder, f"{filename}.json")

            data = Data()
            data.set_image_name(image_filenames[idx])
            data.set_image_path(asset_image_paths[idx])

            embedding = np.load(embedding_path)
            data.set_embedding(embedding)

            if os.path.exists(annotation_path):
                annotations = load_json(annotation_path)
                data.set_segmentation(annotations)

            data.set_idx(idx)
            dataset.add_data(data)

        # Load project info
        project_info = load_json(project_info_path)
        last_image_idx = project_info["last_image_idx"]
        category_info = project_info["category_info"]
        dataset.set_category_info(category_info)

        # Delete the temporary folder
        shutil.rmtree(temp_output_dir)

        self.logger.info(f"Project loaded in {time.time() - start_time} seconds")

        return dataset, last_image_idx

    def store_image(self, image_paths: List[str]) -> List[str]:
        """
        Store images to the assest folder for front end to access.

        Returns:
        - List[str]: List of relative image paths in the asset folder
        """
        self.clear_asset_folder()
        asset_folder = os.path.join(
            ProjectLoader.WEB_FOLDER_NAME, ProjectLoader.ASSET_FOLDER
        )
        os.makedirs(asset_folder, exist_ok=True)

        assset_image_paths = []
        for image_path in image_paths:
            image = Image.open(image_path)
            image.save(os.path.join(asset_folder, os.path.basename(image_path)))

            asset_image_path = os.path.join(
                ProjectLoader.ASSET_FOLDER, os.path.basename(image_path)
            )
            assset_image_paths.append(asset_image_path)

        return assset_image_paths

    def clear_asset_folder(self):
        """
        Clear the asset folder
        """
        asset_folder = os.path.join(
            ProjectLoader.WEB_FOLDER_NAME, ProjectLoader.ASSET_FOLDER
        )
        if os.path.exists(asset_folder):
            # Delete all the files in the folder
            for filename in os.listdir(asset_folder):
                file_path = os.path.join(asset_folder, filename)
                os.remove(file_path)


class ProjectExport:

    COCO_FILE_NAME = "coco"

    def __init__(self, project_path: str):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.project_path = project_path

    def export_images(self, output_dir: str):
        project_folder = os.path.dirname(self.project_path)

        # Extract the project files
        temp_dir = os.path.join(project_folder, TEMP_LOAD_NAME)
        if os.path.exists(temp_dir):
            shutil.rmtree(temp_dir)
        unzip_file(self.project_path, temp_dir)

        # Create images folder
        image_folder = os.path.join(output_dir, "images")
        os.makedirs(image_folder, exist_ok=True)

        # Copy the images to the images folder
        project_image_folder = os.path.join(temp_dir, "images")
        for image_name in os.listdir(project_image_folder):
            image_path = os.path.join(project_image_folder, image_name)
            shutil.copy(image_path, image_folder)

        # Remove the temporary folder
        shutil.rmtree(temp_dir)

    def export_annotated_images(self, output_dir: str, data_list: List[Dict]):
        """
        Params:
        - output_dir: The output directory
        - data: The list of data of the image, which is a dict
        {
            "image_name": str,
            "encoded_image": str,
        }
        """
        output_annotated_image_folder = os.path.join(output_dir, "annotated_images")
        os.makedirs(output_annotated_image_folder, exist_ok=True)
        for data in data_list:
            image = decode_image_url(data["encoded_image"])
            image = Image.fromarray(image)
            image.save(os.path.join(output_annotated_image_folder, data["image_name"]))

    def is_file_path(self, path):
        # Check if the path looks like a file (e.g., has an extension)
        return not path.endswith(os.sep) and os.path.splitext(path)[1] != ""

    def export_coco(self, output_path: str, dataset: Dataset):
        """
        the output_path can be a directory or a file path
        """

        if self.is_file_path(output_path):
            output_coco_file = output_path
            if os.path.exists(output_coco_file):
                os.remove(output_coco_file)
        else:
            output_dir = output_path
            output_coco_file = os.path.join(output_dir, "coco.json")

            # If the file already exist, append a number to the file name
            i = 1
            while os.path.exists(output_coco_file):
                output_coco_file = os.path.join(
                    output_dir, f"{ProjectExport.COCO_FILE_NAME}_{i}.json"
                )
                i += 1

                if i > 1000:
                    raise Exception("Too many COCO files in the output directory")

            os.makedirs(output_dir, exist_ok=True)

        coco_json = COCOJson()

        for data in dataset.get_data_list():
            image_json = ImageJson()
            image_json.set_id(data.get_idx())
            image_json.set_filename(data.get_image_name())
            image_json.set_width(data.get_image_width())
            image_json.set_height(data.get_image_height())
            coco_json.add_image(image_json)

            for mask in data.get_segmentation()["annotations"]:
                annotation_json = AnnotationJson()
                annotation_json.set_segmentation(mask["segmentation"])
                annotation_json.set_bbox(mask["bbox"])
                annotation_json.set_area(mask["area"])
                annotation_json.set_category_id(mask["category_id"])
                annotation_json.set_id(mask["id"])
                annotation_json.set_image_id(data.get_idx())
                annotation_json.set_iscrowd(mask["iscrowd"])
                coco_json.add_annotation(annotation_json)

        for category in dataset.get_category_info():
            category_json = CategoryJson()
            category_json.set_id(category["id"])
            category_json.set_name(category["name"])
            category_json.set_super_category(category["super_category"])
            coco_json.add_category(category_json)

        save_json(coco_json.to_json(), output_coco_file)
