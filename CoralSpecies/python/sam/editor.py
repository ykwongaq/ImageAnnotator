import onnxruntime as ort
import numpy as np
import matplotlib.pyplot as plt
import cv2

from .transforms import ResizeLongestSide
from typing import Dict, List

from pycocotools import mask as coco_mask
import time

class MaskEidtor:

    def __init__(self, onnx_path:str):
        self.ort_session = ort.InferenceSession(onnx_path, providers=['CPUExecutionProvider'])
        self.image = None
        self.image_embedding = None
        self.image_size = None
        self.transforms = None
        self.inputs = []

        self.onnx_mask_input = np.zeros((1, 1, 256, 256), dtype=np.float32)
        self.onnx_has_mask_input = np.zeros(1, dtype=np.float32)

    
    def set_image(self, image, image_embedding):
        # If the type of image is path, then read the image
        if isinstance(image, str):
            image = cv2.imread(image)
            image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        elif isinstance(image, np.ndarray):
            pass
        else:
            raise ValueError("The type of image should be str or np.ndarray")
        
        self.image = image

        if isinstance(image_embedding, str):
            image_embedding = np.load(image_embedding)
        elif isinstance(image_embedding, np.ndarray):
            pass
        else:
            raise ValueError("The type of image_embedding should be str or np.ndarray")
        self.image_embedding = image_embedding

        self.image_size = image.shape[:2]
        self.transforms = ResizeLongestSide(min(self.image_size))

    def add_input(self, x, y, label):
        self.inputs.append([x, y, label])

    def undo_input(self):
        if len(self.inputs) > 0:
            self.inputs.pop()

    def clear_inputs(self):
        self.inputs = []

    def get_input_points(self):
        points = []
        for input in self.inputs:
            points.append(input[:2])
        return points
    
    def get_input_labels(self):
        labels = []
        for input in self.inputs:
            labels.append(input[2])
        return labels
    
    def infer_mask(self):
        if self.image is None:
            return None

        input_points = self.get_input_points()
        input_labels = self.get_input_labels()

        if len(input_points) == 0:
            return np.zeros((1, 1, self.image_size[0], self.image_size[1]), dtype=np.bool_)
        
        onnx_coord = np.array(input_points, dtype=np.float32)[None, :, :]

        onnx_coord = self.transforms.apply_coords(onnx_coord, self.image.shape[:2]).astype(np.float32)

        onnx_label = np.array(input_labels, dtype=np.float32)[None, :].astype(np.float32)

        ort_inputs = {
            "image_embeddings": self.image_embedding,
            "point_coords": onnx_coord,
            "point_labels": onnx_label,
            "mask_input": self.onnx_mask_input,
            "has_mask_input": self.onnx_has_mask_input,
            "orig_im_size": np.array(self.image.shape[:2], dtype=np.float32)
        }

        masks, _, _ = self.ort_session.run(None, ort_inputs)
        masks = masks > 0.0

        return masks
    
    def show(self, image, masks, points, labels):
        if self.image is None:
            return
        
        plt.figure(figsize=(12, 12))
        plt.imshow(self.image)
        self.show_mask(masks, plt.gca())
        self.show_points(points, labels, plt.gca())
        plt.axis("off")
        plt.show()
        

    def show_mask(self, mask, ax):
        color = np.array([30/255, 144/255, 255/255, 0.6])
        h, w = mask.shape[-2:]
        mask_image = mask.reshape(h, w, 1) * color.reshape(1, 1, -1)
        ax.imshow(mask_image)
        
    def show_points(self, coords, labels, ax, marker_size=375):
        pos_points = coords[labels==1]
        neg_points = coords[labels==0]
        ax.scatter(pos_points[:, 0], pos_points[:, 1], color='green', marker='*', s=marker_size, edgecolor='white', linewidth=1.25)
        ax.scatter(neg_points[:, 0], neg_points[:, 1], color='red', marker='*', s=marker_size, edgecolor='white', linewidth=1.25)   
        
    def show_box(self, box, ax):
        x0, y0 = box[0], box[1]
        w, h = box[2] - box[0], box[3] - box[1]
        ax.add_patch(plt.Rectangle((x0, y0), w, h, edgecolor='green', facecolor=(0,0,0,0), lw=2)) 

class MaskProcessor:

    def array_to_rle(self, mask: np.ndarray) -> Dict:
        mask = mask.astype(np.uint8)
        mask = np.asfortranarray(mask)

        # Encode the mask into RLE
        rle = coco_mask.encode(np.asfortranarray(mask))
        rle["counts"] = rle["counts"].decode("ascii")

        return rle
    
    def mask_to_bbox(self, mask: np.ndarray) -> List:
        # Find the indices where the mask is 1
        y_indices, x_indices = np.where(mask == 1)
        
        if len(x_indices) == 0 or len(y_indices) == 0:
            return None  # No bounding box (the mask is empty)
        
        # Calculate the bounding box
        x_min = np.min(x_indices)
        x_max = np.max(x_indices)
        y_min = np.min(y_indices)
        y_max = np.max(y_indices)
        
        # Calculate width and height
        width = x_max - x_min + 1
        height = y_max - y_min + 1
        
        # Return the bounding box in COCO format
        return [x_min, y_min, width, height]

    def count_area(self, mask: np.ndarray) -> int:
        return np.sum(mask)
    
    def encode_rle_number(self, mask: np.ndarray) -> List[int]:
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
    
    def mask_to_json(self, mask: np.ndarray) -> Dict:
        mask = mask.squeeze()
        rle_dict = self.array_to_rle(mask)

        rle_number = self.encode_rle_number(mask)

        bbox = coco_mask.toBbox(rle_dict).tolist()
        bbox = [int(x) for x in bbox]
        area = coco_mask.area(rle_dict)
        area = int(area)
        rle_dict["counts_number"] = rle_number

        return {
            "segmentation": rle_dict,
            "bbox": bbox,
            "area": area,
            "label_id": None,
            "label_name": None,
        }

if __name__ == "__main__":
    onnx_path = "C://Users//WYK//OneDrive - HKUST Connect//Mphil//Research//MarineVOS//ImageAnnotator//CoralSpecies//models//sam_onnx_example.onnx"
    model_path = "C://Users//WYK//OneDrive - HKUST Connect//Mphil//Research//MarineVOS//ImageAnnotator//CoralSpecies//models//sam_vit_h_4b8939.pth"
    model_type = "vit_h"

    editor = MaskEidtor(onnx_path, model_path, model_type)

    image_path = "C://Users//WYK//OneDrive - HKUST Connect//Mphil//Research//MarineVOS//ImageAnnotator//CoralSpecies//data//images//AUSTRALES_AUS_RAI1_20M_20190504_UTP_QUADRAT_AUSRAI1_20M_1.jpg"
    image_embedding_path = "C://Users//WYK//OneDrive - HKUST Connect//Mphil//Research//MarineVOS//ImageAnnotator//CoralSpecies//data//embeddings//AUSTRALES_AUS_RAI1_20M_20190504_UTP_QUADRAT_AUSRAI1_20M_1.npy"

    image = cv2.imread(image_path)
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

    image_embedding = np.load(image_embedding_path)

    editor.set_image(image, image_embedding)
    editor.add_input(100, 100, 1)
    editor.add_input(200, 200, 0)
    masks = editor.infer_mask()
    print(masks.shape)

    editor.show(editor.image, masks, np.array(editor.get_input_points()), np.array(editor.get_input_labels()).astype(np.float32))