"""Fine-tune YOLOv8-Seg for GramSetu pothole and crack masks.

The script deliberately validates the local annotated dataset before starting a
training run. It expects YOLO segmentation labels, not bounding-box labels.
"""
from __future__ import annotations

import argparse
from pathlib import Path

import yaml
from ultralytics import YOLO

VALID_CLASSES = {0, 1}
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Fine-tune YOLOv8-Seg on pothole and crack masks.")
    parser.add_argument("--data", default="data/road_defects.yaml", help="YOLO dataset YAML file")
    parser.add_argument("--model", default="yolov8n-seg.pt", help="Pretrained YOLOv8 segmentation checkpoint")
    parser.add_argument("--epochs", type=int, default=150)
    parser.add_argument("--imgsz", type=int, default=640)
    parser.add_argument("--batch", type=int, default=-1, help="-1 automatically sizes batch for available VRAM")
    parser.add_argument("--device", default=None, help="CUDA device, cpu, or omit for automatic selection")
    parser.add_argument("--project", default="runs")
    parser.add_argument("--name", default="pothole-crack-seg")
    return parser.parse_args()


def load_dataset_paths(data_file: Path) -> tuple[Path, list[str]]:
    config = yaml.safe_load(data_file.read_text(encoding="utf-8"))
    root = (data_file.parent / config["path"]).resolve()
    splits = [split for split in ("train", "val") if config.get(split)]
    if not root.exists():
        raise FileNotFoundError(f"Dataset directory does not exist: {root}")
    return root, splits


def validate_dataset(data_file: Path) -> None:
    root, splits = load_dataset_paths(data_file)
    errors: list[str] = []
    summaries: list[str] = []

    for split in splits:
        images_dir = root / "images" / split
        labels_dir = root / "labels" / split
        images = [path for path in images_dir.rglob("*") if path.suffix.lower() in IMAGE_EXTENSIONS] if images_dir.exists() else []
        if not images:
            errors.append(f"No images found in {images_dir}")
            continue
        if not labels_dir.exists():
            errors.append(f"Missing labels directory: {labels_dir}")
            continue

        annotation_count = 0
        for image in images:
            label_file = labels_dir / f"{image.stem}.txt"
            if not label_file.exists():
                # Empty/background images may intentionally have no label file.
                continue
            for line_number, line in enumerate(label_file.read_text(encoding="utf-8").splitlines(), start=1):
                values = line.split()
                if not values:
                    continue
                try:
                    class_id = int(values[0])
                    polygon = [float(value) for value in values[1:]]
                except ValueError:
                    errors.append(f"Invalid numeric value in {label_file}:{line_number}")
                    continue
                if class_id not in VALID_CLASSES:
                    errors.append(f"Unsupported class {class_id} in {label_file}:{line_number}; use 0=pothole or 1=crack")
                if len(polygon) < 6 or len(polygon) % 2:
                    errors.append(f"Invalid polygon in {label_file}:{line_number}; expected at least 3 x/y points")
                elif any(value < 0 or value > 1 for value in polygon):
                    errors.append(f"Polygon coordinates must be normalized to 0..1 in {label_file}:{line_number}")
                annotation_count += 1
        summaries.append(f"{split}: {len(images)} images, {annotation_count} mask annotations")

    if errors:
        raise ValueError("Dataset validation failed:\n- " + "\n- ".join(errors[:30]))
    print("Dataset validated: " + "; ".join(summaries))


def main() -> None:
    args = parse_args()
    data_file = Path(args.data).resolve()
    if not data_file.is_file():
        raise FileNotFoundError(f"Dataset YAML not found: {data_file}")
    validate_dataset(data_file)

    model = YOLO(args.model)
    training_args = {
        "data": str(data_file),
        "epochs": args.epochs,
        "imgsz": args.imgsz,
        "batch": args.batch,
        "patience": 35,
        "optimizer": "auto",
        "cos_lr": True,
        "close_mosaic": 10,
        "project": args.project,
        "name": args.name,
        "seed": 42,
    }
    if args.device:
        training_args["device"] = args.device
    model.train(**training_args)


if __name__ == "__main__":
    main()
