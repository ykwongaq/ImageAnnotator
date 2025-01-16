import os
import argparse
import json


def main(args):
    input_dir = args.input_dir

    image_dir = os.path.join(input_dir, "images")
    annotation_file = os.path.join(input_dir, "thing_or_stuff.json")

    # Check if the image folder exist or not
    if not os.path.exists(image_dir):
        print(f"Error: {image_dir} does not exist")
        return

    # Check if the anntoation file exist or not
    if not os.path.exists(annotation_file):
        print(f"Error: {annotation_file} does not exist")
        return

    # Read annotation files
    with open(annotation_file, "r") as f:
        data = json.load(f)

    # Data is a dictionary where key is the image name and value is the annotation
    # Check is all the images in the image folder are present in the annotation file
    included_image_name = set(data.keys())
    image_names = os.listdir(image_dir)
    image_names.sort()

    for idx, image_name in enumerate(image_names):
        if image_name not in included_image_name:
            print(
                f"Error: Image {idx}: {image_name} is not present in the annotation file"
            )

    # Check is there any anntation "-1" exist
    for key, value in data.items():
        if value == -1:
            idx = image_names.index(key)
            print(f"Error: Image {idx}: Image {key} has annotation -1")

    print("Verification finished")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_dir", type=str, help="Path to the project folder")
    args = parser.parse_args()
    main(args)
