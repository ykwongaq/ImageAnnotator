from PIL import Image
import numpy as np
import onnxruntime as ort
from copy import deepcopy

from server.util.onnx import preprocess_image, preprocess_point, preprocess_labels

image_path = "C://Users//WYK//OneDrive - HKUST Connect//Mphil//Research//MarineVOS//ImageAnnotator//CoralSpecies//data//images//AUSTRALES_AUS_RAI1_20M_20190504_UTP_QUADRAT_AUSRAI1_20M_1.jpg"
image = Image.open(image_path)
image = image.convert("RGB")
ori_width, ori_height = image.size
input_tensor = preprocess_image(image)
resized_width, resized_height = input_tensor.shape[3], input_tensor.shape[2]

# encoder = ort.InferenceSession("./onnx_models/vit_b_encoder.onnx")
encoder = ort.InferenceSession("./onnx_models/coralscop_encoder.onnx")
outputs = encoder.run(None, {"images": input_tensor})
embeddings = outputs[0]

input_point = [[148, 114]]
input_label = [1]

onnx_coord = preprocess_point(input_point, ori_width, ori_height, resized_width, resized_height)
onnx_label = preprocess_labels(input_label)

# decoder = ort.InferenceSession("./onnx_models/vit_b_decoder.onnx")
decoder = ort.InferenceSession("./onnx_models/coralscop_decoder.onnx")

onnx_mask_input = np.zeros((1, 1, 256, 256), dtype=np.float32)
onnx_has_mask_input = np.zeros(1, dtype=np.float32)

outputs = decoder.run(None,{
    "image_embeddings": embeddings,
    "point_coords": onnx_coord,
    "point_labels": onnx_label,
    "mask_input": onnx_mask_input,
    "has_mask_input": onnx_has_mask_input,
    "orig_im_size": np.array([ori_height, ori_width], dtype=np.float32)
})

for i, output in enumerate(outputs):
    print(f"Output {i}: {output.shape}")
    
    
masks = outputs[0]

mask = masks[0][0]
mask = (mask > 0).astype('uint8')*255

img = Image.fromarray(mask,'L')

img.show()