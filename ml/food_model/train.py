"""
당마고치 CV 모델 학습 — EfficientNet-B4 Transfer Learning.

실행: python train.py
출력: food_model.pth, class_map.json
환경: RTX 5080 Laptop GPU (VRAM 16GB)
"""
import os
import time
import json
import torch
import torch.nn as nn
import torch.optim as optim
from torch.cuda.amp import autocast, GradScaler
from torchvision import transforms, models
from torch.utils.data import DataLoader

from config import (
    BATCH_SIZE, NUM_EPOCHS, LEARNING_RATE, NUM_WORKERS,
    LABEL_SMOOTHING, WARMUP_EPOCHS, IMG_SIZE, CROP_SIZE, EARLY_STOP_PATIENCE,
)
from dataset import FoodDataset, prepare_dataset, create_weighted_sampler

WORK_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(WORK_DIR, "food_model.pth")
CLASS_MAP_PATH = os.path.join(WORK_DIR, "class_map.json")

device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def create_model(num_classes):
    """EfficientNet-B4 Transfer Learning + 동결."""
    model = models.efficientnet_b4(weights=models.EfficientNet_B4_Weights.IMAGENET1K_V1)

    for param in model.features.parameters():
        param.requires_grad = False

    in_features = model.classifier[1].in_features
    model.classifier = nn.Sequential(
        nn.Dropout(p=0.4),
        nn.Linear(in_features, num_classes)
    )
    return model.to(device)


def save_class_map(class_to_idx):
    """클래스 매핑 JSON 저장."""
    idx_to_class = {str(v): k for k, v in class_to_idx.items()}
    with open(CLASS_MAP_PATH, "w", encoding="utf-8") as f:
        json.dump(idx_to_class, f, ensure_ascii=False, indent=2)
    print(f"  클래스 매핑: {CLASS_MAP_PATH}")


def train_model(model, train_loader, val_loader, class_to_idx):
    """2단계 학습 + AMP + Label Smoothing + Warmup + Early Stop."""
    num_classes = len(class_to_idx)
    criterion = nn.CrossEntropyLoss(label_smoothing=LABEL_SMOOTHING)
    optimizer = optim.AdamW(model.parameters(), lr=LEARNING_RATE, weight_decay=0.01)
    scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=NUM_EPOCHS)
    scaler = GradScaler()

    best_val_acc = 0.0
    best_top3 = 0.0
    no_improve = 0
    start_time = time.time()

    for epoch in range(NUM_EPOCHS):
        epoch_start = time.time()

        # Warmup
        if epoch < WARMUP_EPOCHS:
            warmup_lr = LEARNING_RATE * (epoch + 1) / WARMUP_EPOCHS
            for pg in optimizer.param_groups:
                pg['lr'] = warmup_lr

        # 5 에폭 이후 Fine-tuning
        if epoch == 5:
            print(f"\n  === Feature extractor 동결 해제 ===")
            for param in model.features.parameters():
                param.requires_grad = True
            optimizer = optim.AdamW(model.parameters(), lr=LEARNING_RATE * 0.1, weight_decay=0.01)
            scheduler = optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=NUM_EPOCHS - 5)
            scaler = GradScaler()

        # Train
        model.train()
        train_correct = 0
        train_total = 0

        for batch_idx, (inputs, labels) in enumerate(train_loader):
            inputs, labels = inputs.to(device), labels.to(device)
            optimizer.zero_grad()
            with autocast():
                outputs = model(inputs)
                loss = criterion(outputs, labels)
            scaler.scale(loss).backward()
            scaler.step(optimizer)
            scaler.update()

            _, predicted = outputs.max(1)
            train_total += labels.size(0)
            train_correct += predicted.eq(labels).sum().item()

            if (batch_idx + 1) % 200 == 0:
                elapsed = time.time() - epoch_start
                progress = (batch_idx + 1) / len(train_loader) * 100
                print(f"    Epoch {epoch+1} | {progress:.0f}% | "
                      f"Loss: {loss.item():.4f} | 경과: {elapsed/60:.1f}분")

        train_acc = 100.0 * train_correct / train_total

        # Validation
        model.eval()
        val_correct = 0
        val_total = 0
        top3_correct = 0

        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(device), labels.to(device)
                with autocast():
                    outputs = model(inputs)
                _, predicted = outputs.max(1)
                val_total += labels.size(0)
                val_correct += predicted.eq(labels).sum().item()

                _, top3_pred = outputs.topk(3, 1, True, True)
                for i in range(labels.size(0)):
                    if labels[i] in top3_pred[i]:
                        top3_correct += 1

        val_acc = 100.0 * val_correct / val_total
        top3_acc = 100.0 * top3_correct / val_total
        epoch_time = time.time() - epoch_start

        print(f"  Epoch {epoch+1}/{NUM_EPOCHS} | Train: {train_acc:.1f}% | "
              f"Val Top-1: {val_acc:.1f}% | Top-3: {top3_acc:.1f}% | "
              f"시간: {epoch_time/60:.1f}분")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            best_top3 = top3_acc
            no_improve = 0
            torch.save({
                "model_state_dict": model.state_dict(),
                "class_to_idx": class_to_idx,
                "idx_to_class": {v: k for k, v in class_to_idx.items()},
                "num_classes": num_classes,
                "best_val_acc": best_val_acc,
                "best_top3_acc": best_top3,
                "epoch": epoch + 1,
            }, MODEL_PATH)
            print(f"  ★ 최고 모델 저장! (Top-1: {val_acc:.1f}%, Top-3: {top3_acc:.1f}%)")
        else:
            no_improve += 1
            if no_improve >= EARLY_STOP_PATIENCE:
                print(f"\n  ■ Early Stopping")
                break

        if epoch >= WARMUP_EPOCHS:
            scheduler.step()

    total_time = (time.time() - start_time) / 60
    print(f"\n  학습 완료! 총 {total_time:.1f}분")
    print(f"  Top-1: {best_val_acc:.1f}% | Top-3: {best_top3:.1f}%")
    return best_val_acc, best_top3


def main():
    print("=" * 60)
    print("  당마고치 CV 모델 학습 — EfficientNet-B4")
    print("=" * 60)
    print(f"  GPU: {torch.cuda.get_device_name(0)}")

    train_samples, val_samples, class_to_idx = prepare_dataset()
    if len(class_to_idx) == 0:
        print("학습할 음식이 없습니다!")
        return

    save_class_map(class_to_idx)

    train_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.RandomCrop(CROP_SIZE),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.1),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    val_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.CenterCrop(CROP_SIZE),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225]),
    ])

    train_dataset = FoodDataset(train_samples, class_to_idx, train_transform)
    val_dataset = FoodDataset(val_samples, class_to_idx, val_transform)
    sampler = create_weighted_sampler(train_samples)

    train_loader = DataLoader(
        train_dataset, batch_size=BATCH_SIZE, sampler=sampler,
        num_workers=NUM_WORKERS, pin_memory=True
    )
    val_loader = DataLoader(
        val_dataset, batch_size=BATCH_SIZE, shuffle=False,
        num_workers=NUM_WORKERS, pin_memory=True
    )

    model = create_model(len(class_to_idx))
    train_model(model, train_loader, val_loader, class_to_idx)


if __name__ == "__main__":
    main()