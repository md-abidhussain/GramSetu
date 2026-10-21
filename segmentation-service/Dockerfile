# CPU image for the defect-detection service. Build from this folder:
#   docker build -t gramsetu-detector .
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1 \
    SEGMENTATION_ENV=production MODEL_PATH=/app/models/model.onnx PORT=8001

RUN apt-get update && apt-get install -y --no-install-recommends libgl1 libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu torch torchvision \
    && pip install --no-cache-dir -r requirements.txt

COPY app.py inference.py settings.py ./
COPY models/model.onnx ./models/model.onnx

RUN useradd --create-home detector
USER detector

EXPOSE 8001
HEALTHCHECK CMD python -c "import urllib.request,sys; sys.exit(0 if urllib.request.urlopen('http://127.0.0.1:8001/health/live').status==200 else 1)"
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT}"]
