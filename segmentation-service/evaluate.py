"""Evaluate a trained GramSetu YOLOv8-Seg road-defect checkpoint."""
from __future__ import annotations

import argparse
from pathlib import Path

from train import validate_dataset
from ultralytics import YOLO


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate pothole/crack segmentation weights.")
    parser.add_argument("--weights", required=True, help="Path to best.pt from a training run")
    parser.add_argument("--data", default="data/road_defects.yaml")
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--device", default=None)
    args = parser.parse_args()

    data_file = Path(args.data).resolve()
    weights = Path(args.weights).resolve()
    if not weights.is_file():
        raise FileNotFoundError(f"Weights not found: {weights}")
    validate_dataset(data_file)

    options = {"data": str(data_file), "imgsz": args.imgsz, "split": "val"}
    if args.device:
        options["device"] = args.device
    metrics = YOLO(str(weights)).val(**options)
    print(f"Validation complete. Segmentation mAP50-95: {metrics.seg.map:.4f}")


if __name__ == "__main__":
    main()
