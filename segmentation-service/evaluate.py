"""Evaluate GramSetu road-defect weights on a held-out labelled split.

Prints box metrics for detection models and mask metrics for segmentation
models. These numbers are the only basis for any accuracy claim; record them
in docs/AI_LIMITATIONS.md together with the dataset used.
"""
from __future__ import annotations

import argparse
from pathlib import Path

from ultralytics import YOLO

from train import validate_dataset


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate pothole/crack segmentation weights.")
    parser.add_argument("--weights", required=True, help="Path to weights (.pt or .onnx)")
    parser.add_argument("--split", default="test", choices=["val", "test"], help="Use a split the model never trained on")
    parser.add_argument("--data", default="data/road_defects.yaml")
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--device", default=None)
    args = parser.parse_args()

    data_file = Path(args.data).resolve()
    weights = Path(args.weights).resolve()
    if not weights.is_file():
        raise FileNotFoundError(f"Weights not found: {weights}")
    validate_dataset(data_file)

    options = {"data": str(data_file), "imgsz": args.imgsz, "split": args.split}
    if args.device:
        options["device"] = args.device
    model = YOLO(str(weights))
    metrics = model.val(**options)
    print(f"Split: {args.split}  task: {model.task}")
    print(f"Box  precision {metrics.box.mp:.3f}  recall {metrics.box.mr:.3f}  mAP50 {metrics.box.map50:.3f}  mAP50-95 {metrics.box.map:.3f}")
    if model.task == "segment":
        print(f"Mask mAP50 {metrics.seg.map50:.3f}  mAP50-95 {metrics.seg.map:.3f}")


if __name__ == "__main__":
    main()
