import logging
import io
import numpy as np
import torch
from cryptography.fernet import Fernet

from .segment_anything import SamAutomaticMaskGenerator, sam_model_registry
from .util.coco import encode_to_coco_mask


class CoralSegmentation:
    def __init__(
        self,
        model_path,
        model_type,
        key,
        point_number=32,
        iou_threshold=0.62,
        sta_threshold=0.62,
    ):
        self.logger = logging.getLogger(self.__class__.__name__)
        self.logger.info(f"Initializing {self.__class__.__name__} ...")
        cipher_suite = Fernet(key)

        with open(model_path, "rb") as file:
            encrypted_model = file.read()
        decrypted_model = cipher_suite.decrypt(encrypted_model)
        weights_io = io.BytesIO(decrypted_model)
        model_weight_dict = torch.load(weights_io, weights_only=True)

        sam = sam_model_registry[model_type]()
        sam.load_state_dict(model_weight_dict)
        
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
        for idx, mask in enumerate(masks):
            mask["segmentation"] = encode_to_coco_mask(mask["segmentation"] > 0)
            mask["id"] = idx
            mask["iscrowd"] = 0
            del mask["cate_preds"]
            del mask["fc_features"]
            del mask["point_coords"]
            del mask["stability_score"]
            del mask["crop_box"]
            del mask["similarity"]

        # Filter out the masks that the predicted_iou is null
        masks = [mask for mask in masks if mask["predicted_iou"] is not None]

        return masks
