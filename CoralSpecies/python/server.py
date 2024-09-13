import sys
import json
import os

from sam.editor import MaskEidtor, MaskProcessor
from coco.mask import process_json, read_json
import time
from typing import Dict, List

class Util:
    def __init__(self):
        pass

    def extract_operation(self, input_data:Dict) -> str:
        task = input_data["task"]
        task_list = task.split("/")
        return task_list[1]
    
class ProcessUtil(Util):
    TASK_NAME = "process"

    def __init__(self):
        super(ProcessUtil, self).__init__()

    def process_input(self, input_data:Dict) -> Dict:
        json_path = input_data["json_path"]
        json_data = read_json(json_path)
        processed_json_data = process_json(json_data)

        response = {
            "task": input_data["task"],
            "status": "success",
            "processed_json_data": processed_json_data
        }
        return response
        
class MaskEditorUtil(Util):
    TASK_NAME = "edit-mask"

    ADD_INPUT_POINT = "add-input-point"
    UNDO_INPUT_POINT = "undo-input-point"
    CLEAR_INPUT_POINTS = "clear-input-points"
    CONFIRM_INPUT = "confirm-input"
    SET_IMAGE = "set-image"

    def __init__(self, onnx_path:str):
        super(MaskEditorUtil, self).__init__()
        self.mask_editor = MaskEidtor(onnx_path)
        self.mask_processor = MaskProcessor()

    def process_input(self, input_data):
        operation = self.extract_operation(input_data)
        response = None

        if operation == MaskEditorUtil.ADD_INPUT_POINT:
            response = self.add_input_point(input_data)
        elif operation == MaskEditorUtil.UNDO_INPUT_POINT:
            response = self.undo_input_point(input_data)
        elif operation == MaskEditorUtil.CLEAR_INPUT_POINTS:
            response = self.clear_input_points(input_data)
        elif operation == MaskEditorUtil.CONFIRM_INPUT:
            response = self.confirm_input(input_data)
        elif operation == MaskEditorUtil.SET_IMAGE:
            response = self.set_image(input_data)
        else:
            pass

        return response

    def add_input_point(self, input_data:Dict) -> Dict:
        image_x = int(input_data["imageX"])
        image_y = int(input_data["imageY"])
        label = int(input_data["label"])
        self.mask_editor.add_input(image_x, image_y, label)
        mask = self.mask_editor.infer_mask()
        response = self.mask_processor.mask_to_json(mask)

        selected_points = self.mask_editor.get_input_points()
        response["selected_points"] = selected_points

        labels = self.mask_editor.get_input_labels()
        response["labels"] = labels
        
        response["task"] = input_data["task"]
        return response


    def undo_input_point(self, input_data: Dict) -> Dict:
        self.mask_editor.undo_input()
        mask = self.mask_editor.infer_mask()
        response = self.mask_processor.mask_to_json(mask)

        selected_points = self.mask_editor.get_input_points()
        response["selected_points"] = selected_points

        labels = self.mask_editor.get_input_labels()
        response["labels"] = labels
        
        response["task"] = input_data["task"]
        return response

    def clear_input_points(self, input_data: Dict) -> Dict: 
        self.mask_editor.clear_inputs()
        mask = self.mask_editor.infer_mask()
        response = self.mask_processor.mask_to_json(mask)

        selected_points = self.mask_editor.get_input_points()
        response["selected_points"] = selected_points

        labels = self.mask_editor.get_input_labels()
        response["labels"] = labels
        
        response["task"] = input_data["task"]
        return response

    def confirm_input(self, input_data: Dict) -> Dict:
        self.mask_editor.clear_inputs()
        mask = self.mask_editor.infer_mask()
        response = self.mask_processor.mask_to_json(mask)

        selected_points = self.mask_editor.get_input_points()
        response["selected_points"] = selected_points

        labels = self.mask_editor.get_input_labels()
        response["labels"] = labels
        
        response["task"] = input_data["task"]
        return response

    def set_image(self, input_data: Dict) -> Dict:
        image_path = input_data["image_path"]
        image_embedding_path = input_data["image_embedding_path"]
        self.mask_editor.set_image(image_path, image_embedding_path)

        response = {
            "task": input_data["task"],
            "status": "success"
        }

        return response
        
class Server:
    def __init__(self, onnx_path:str):
        self.mask_editor_util = MaskEditorUtil(self.adjust_data_path(onnx_path))
        self.process_util = ProcessUtil()

    def send_response(self, response):
        print(json.dumps(response))
        sys.stdout.flush()
    
    def process_input(self, input_data):
        if "task" not in input_data:
            raise Exception(f"Task is not provided in the input data: {input_data}")
        task = input_data["task"]
        task_list = task.split("/")
        response = None
        if task_list[0] == MaskEditorUtil.TASK_NAME:
            response = self.mask_editor_util.process_input(input_data)
        elif task_list[0] == ProcessUtil.TASK_NAME:
            response = self.process_util.process_input(input_data)
        else:
            response = { 
                "task": input_data["task"],
                "status": "not-implemented"
            }

        return response
    
    def extract_main_task(self, input_data):
        task = input_data["task"]
        task_list = task.split("/")
        return task_list[0]
    
    def run(self):
        for line in sys.stdin:
            try:
                input_data = json.loads(line)
                response = self.process_input(input_data["message"])
                self.send_response(response)
            except Exception as e:
                response = {
                    "task": "error",
                    "status": "error",
                    "message": str(e)
                }
                self.send_response(response)

    def adjust_data_path(self, data_path:str) -> str:
        if hasattr(sys, '_MEIPASS'):
            # Running from a PyInstaller bundle
            base_path = sys._MEIPASS
        else:
            # Running in a normal Python environment
            base_path = os.path.abspath(".")

        return os.path.join(base_path, data_path)

def main():
    onnx_path = "models/sam_onnx_example.onnx"
    server = Server(onnx_path)
    server.run()

if __name__ == "__main__":
    main()