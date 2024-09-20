from .segment_anything import sam_model_registry, SamAutomaticMaskGenerator

import torch
import numpy as np
import logging

from .util.coco import encode_to_coco_mask

class CoralSegmentation:
    def __init__(self, model_path, model_type, point_number=32, iou_threshold=0.62, sta_threshold=0.62):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.logger.info(f"Initializing {self.__class__.__name__} ...")
        self.logger.info(f"Loading model from {model_path}")

        sam = sam_model_registry[model_type](checkpoint=model_path)
        
        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self.logger.info(f"Using device: {device}")
        sam.to(device=device)
        
        self.mask_generator = SamAutomaticMaskGenerator(
            model=sam,
            points_per_side=point_number,
            pred_iou_thresh=iou_threshold,
            stability_score_thresh=sta_threshold,
            crop_n_layers=1,
            crop_n_points_downscale_factor=2,
            min_mask_region_area=100,
        )

    def generate_masks_json(self, image: np.ndarray) -> np.ndarray:
        masks = self.mask_generator.generate(image)
        for mask in masks:
            mask["segmentation"] = encode_to_coco_mask(mask["segmentation"] > 0)
            del mask["cate_preds"]
            del mask["fc_features"]
            del mask["point_coords"]
            del mask["stability_score"]
            del mask["crop_box"]
            del mask["similarity"]
        return masks