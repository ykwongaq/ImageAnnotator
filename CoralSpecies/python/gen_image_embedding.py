import cv2
import argparse
import os
import numpy as np

from tqdm import tqdm
from segment_anything import sam_model_registry, SamPredictor


def main(args):
    image_dir = args.image_dir
    embeddings_dir = args.embeddings_dir
    os.makedirs(embeddings_dir, exist_ok=True)

    sam = sam_model_registry[args.model_type](checkpoint=args.checkpoint)
    sam = sam.to("cpu")
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
    

if __name__ == "__main__":
    DEFAULT_IMAGE_DIR = "../data/images"
    DEFAULT_EMBEDDINGS_DIR = "../data/embeddings"

    parser = argparse.ArgumentParser(description="Extract image embeddings.")
    parser.add_argument(
        "--checkpoint",
        type=str,
        default="../models/sam_vit_h_4b8939.pth",
        help="The path to the SAM model checkpoint."
    )
    parser.add_argument(
        "--model-type",
        type=str,
        default="vit_h",
        help="In ['default', 'vit_h', 'vit_l', 'vit_b']. Which type of SAM model to export."
    )
    parser.add_argument(
        "--image_dir",
        type=str,
        default=DEFAULT_IMAGE_DIR,
        help="The directory containing the images.",
    )
    parser.add_argument(
        "--embeddings_dir",
        type=str,
        default=DEFAULT_EMBEDDINGS_DIR,
        help="The directory to save the embeddings to.",
    )


    main(parser.parse_args())

