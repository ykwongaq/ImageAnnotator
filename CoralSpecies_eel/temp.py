import cv2

image_path ="C://Users//WYK//Desktop//Corals-reefcheck//Corals-reefcheck//Coral survey//35.png"
image = cv2.imread(image_path)
image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
print(f"Image shape: {image.shape}")