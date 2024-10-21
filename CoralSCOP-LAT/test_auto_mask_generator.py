import numpy as np
import torch
import matplotlib.pyplot as plt
import cv2
import onnxruntime as ort
import time

from server.segment_anything import sam_model_registry, SamAutomaticMaskGenerator, SamPredictor
from server.segment_anything.automatic_mask_generator_onnx import SamAutomaticMaskGeneratorOnnx

def get_execution_provider():
    # Check available execution providers
    available_providers = ort.get_available_providers()
    print("Available providers:", available_providers)

    # Prefer CUDA if available
    if 'CUDAExecutionProvider' in available_providers:
        return 'CUDAExecutionProvider'
    else:
        return 'CPUExecutionProvider'

def show_anns(anns):
    if len(anns) == 0:
        return
    sorted_anns = sorted(anns, key=(lambda x: x['area']), reverse=True)
    ax = plt.gca()
    ax.set_autoscale_on(False)

    img = np.ones((sorted_anns[0]['segmentation'].shape[0], sorted_anns[0]['segmentation'].shape[1], 4))
    img[:,:,3] = 0
    for ann in sorted_anns:
        m = ann['segmentation']
        color_mask = np.concatenate([np.random.random(3), [0.35]])
        img[m] = color_mask
    ax.imshow(img)

image_path = "C://Users//WYK//OneDrive - HKUST Connect//Mphil//Research//MarineVOS//ImageAnnotator//CoralSpecies//data//images//AUSTRALES_AUS_RAI1_20M_20190504_UTP_QUADRAT_AUSRAI1_20M_1.jpg"
# image_path = "C://Users//WYK//Desktop//project_2//data//images//coral_2.jpeg"
image = cv2.imread(image_path)
image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)

encoder_onnx_path = "./onnx_models/coralscop_encoder_quantized.onnx"
decoder_onnx_path = "./onnx_models/coralscop_decoder_quantized.onnx"

provider = get_execution_provider()

encoder = ort.InferenceSession(encoder_onnx_path, providers=[provider])
decoder = ort.InferenceSession(decoder_onnx_path, providers=[provider])
# sess_options = ort.SessionOptions()
# sess_options.intra_op_num_threads = 4

# encoder = ort.InferenceSession(encoder_onnx_path, sess_options=sess_options)
# decoder = ort.InferenceSession(decoder_onnx_path, sess_options=sess_options)

mask_generator = SamAutomaticMaskGeneratorOnnx(encoder, decoder,
                                               points_per_side=32,
                                                  pred_iou_thresh=0.85,
                                                    stability_score_thresh=0.85,
                                                    crop_n_layers=1,
                                                    crop_n_points_downscale_factor=2,
                                                    min_mask_region_area=100)

start_time = time.time()
masks = mask_generator.generate(image)
end_time = time.time()

print(f"number of masks generated: {len(masks)}")
print(f"Time taken: {end_time - start_time}")
plt.figure(figsize=(20,20))
plt.imshow(image)
show_anns(masks)
plt.axis('off')
plt.show() 

# model_path = "C://Users//WYK//OneDrive - HKUST Connect//Mphil//Research//MarineVOS//ImageAnnotator//CoralSpecies_eel//models//vit_b_coralscop.pth"
# model_type = "vit_b"

# device = "cuda"

# sam = sam_model_registry[model_type](checkpoint=model_path)
# sam.to(device=device)

# mask_generator = SamAutomaticMaskGenerator(sam,             
#             points_per_side=32,
#             pred_iou_thresh=0.62,
#             stability_score_thresh=0.62,
#             crop_n_layers=1,
#             crop_n_points_downscale_factor=2,
#             min_mask_region_area=100,)

# start_time = time.time()
# masks = mask_generator.generate(image)
# end_time = time.time()

# print(f"number of masks generated: {len(masks)}")
# print(f"Time taken: {end_time - start_time}")
# plt.figure(figsize=(20,20))
# plt.imshow(image)
# show_anns(masks)
# plt.axis('off')
# plt.show() 