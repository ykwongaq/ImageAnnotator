import json
import os
import random
import shutil
from typing import Dict, List
from PIL import Image


class Server:

    THING = 0
    STUFF = 1
    NOT_DEFINED = -1

    def __init__(self, project_path: str) -> None:
        input_image_folder = os.path.join(project_path, "images")
        assert os.path.exists(
            input_image_folder
        ), f"Image folder {input_image_folder} does not exist"

        input_image_files = [
            os.path.join(input_image_folder, file)
            for file in os.listdir(input_image_folder)
            if self.is_image_file(os.path.join(input_image_folder, file))
        ]

        self.assets_folder = os.path.join("web", "assets")
        self.image_folder = os.path.join(self.assets_folder, "images")

        # Clear the image folder if exists, then create the image folder
        if os.path.exists(self.image_folder):
            shutil.rmtree(self.image_folder)
        os.makedirs(self.image_folder, exist_ok=True)

        # Create symbolic links to the image files
        for image_file in input_image_files:
            image_filename = os.path.basename(image_file)
            image_link = os.path.join(self.image_folder, image_filename)
            shutil.copy(image_file, image_link)

        self.image_files = []
        for file in input_image_files:
            image_filename = os.path.basename(file)
            image_path = os.path.join("assets", "images", image_filename)
            self.image_files.append(image_path)
        self.image_files.sort()

        self.annotation_file = os.path.join(project_path, "thing_or_stuff.json")
        self.annotations = {}
        if os.path.exists(self.annotation_file):
            with open(self.annotation_file, "r") as f:
                self.annotations = json.load(f)

    def is_image_file(self, file: str) -> bool:
        try:
            Image.open(file)
            return True
        except:
            return False

    def get_data(self, idx: int) -> Dict:
        """
        Get the data of the image file

        Args:
            idx (int): Index of the image file

        Returns:
            Dict: Data of the image file
        """

        if idx < 0 or idx >= len(self.image_files):
            return None

        image_path_rel = self.get_image_path(idx)
        image_path_rel_processed = self.process_image_path(image_path_rel)
        image_label = self.get_label(idx)
        data = {
            "image_path": image_path_rel_processed,
            "image_label": image_label,
            "image_filename": os.path.basename(image_path_rel),
            "image_index": idx,
            "total_images": len(self.image_files),
        }
        return data

    def get_image_path(self, idx: int) -> str:
        """
        Get the relative path to the image file with respect to the html file

        Args:
            idx (int): Index of the image file

        Returns:
            str: Relative path to the image file
        """
        image_path = self.image_files[idx]
        return image_path

    def process_image_path(self, image_path: str) -> str:
        """
        Process the image path to be used in the html file

        Args:
            image_path (str): Image path

        Returns:
            str: Processed image path
        """
        image_path = image_path.replace("#", "%23")
        return image_path

    def get_label(self, idx: int) -> int:
        """
        Get the label of the image file

        Args:
            idx (int): Index of the image file

        Returns:
            int: Label of the image file
        """
        image_path = self.image_files[idx]
        image_filename = os.path.basename(image_path)
        if image_filename in self.annotations:
            return self.annotations[image_filename]
        else:
            return Server.NOT_DEFINED

    def get_last_working_idx(self) -> int:
        # If the annotations is emtpy, return 0
        if len(self.annotations) == 0:
            return 0

        # Find the index of all the images that have been annotated
        annotated_idxes = []
        for idx, image_filepath in enumerate(self.image_files):
            image_filename = os.path.basename(image_filepath)
            for key in self.annotations:
                if key == image_filename:
                    annotated_idxes.append(idx)
                    break

        # Get the highest index
        last_working_idx = max(annotated_idxes)
        return last_working_idx

    def save_current_data(self, idx: int, label: int) -> None:
        image_path = self.image_files[idx]
        image_filename = os.path.basename(image_path)
        self.annotations[image_filename] = label

        with open(self.annotation_file, "w") as f:
            json.dump(self.annotations, f, indent=4)
