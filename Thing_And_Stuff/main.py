import base64
import os
import argparse

from tkinter import Tk, filedialog, messagebox
from typing import Dict, List

import eel
from server.server import Server
from server.lockmanager import LockManager

lock_manager = LockManager()


@lock_manager.with_lock("get_last_working_idx")
@eel.expose
def get_last_working_idx() -> int:
    return server.get_last_working_idx()


@lock_manager.with_lock("get_data")
@eel.expose
def get_data(idx: int) -> Dict:
    print(f"Getting data for index {idx} ...")
    data = server.get_data(idx)
    print(f"Data: {data}")
    return data


@lock_manager.with_lock("save_current_data")
@eel.expose
def save_current_data(idx: int, label: int) -> None:
    print(f"Saving data for index {idx} with label {label} ...")
    server.save_current_data(idx, label)


# @eel.expose
# def select_folder(message: str) -> str:
#     root = Tk()
#     root.withdraw()
#     root.wm_attributes("-topmost", 1)
#     if message is not None:
#         messagebox.showinfo("Select Folder", message)

#     folder = filedialog.askdirectory()
#     return folder


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input_dir",
        type=str,
        help="Path to the data folder that containing the image folder",
    )

    args = parser.parse_args()

    input_dir = args.input_dir

    print("Please wait for the tool to be ready ...")
    eel.init("web")

    print(f"About to start the server ...")
    server = Server(input_dir)

    print(f"Server initialized ...")
    eel.start("main.html", size=(1200, 800))
    print(f"Server started ...")


# @eel.expose
# def create_project(data_folder: str, output_folder: str) -> Dict:
#     return server.create_project(data_folder, output_folder)


# @eel.expose
# def load_project(project_folder: str) -> Dict:
#     return server.load_project(project_folder)


# @eel.expose
# def load_video(video_path: str) -> str:
#     with open(video_path, "rb") as f:
#         video = f.read()
#     return base64.b64encode(video).decode("utf-8")


# @eel.expose
# def export_result(data: Dict, output_folder: str) -> None:
#     server.export_result(data, output_folder)


# @eel.expose
# def save(project_data: Dict) -> None:
#     server.save_project_data(project_data)