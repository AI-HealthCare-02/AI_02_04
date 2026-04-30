"""
음식 이미지 데이터셋 클래스.
원본 폴더에서 직접 읽어 파일 복사 불필요.
"""
import os
import random
from collections import Counter
from torch.utils.data import Dataset, WeightedRandomSampler
from PIL import Image
from config import TARGET_FOODS, DATA_SRC, MAX_IMAGES_PER_CLASS, VAL_RATIO, IMG_SIZE


class FoodDataset(Dataset):
    """원본 폴더에서 직접 읽는 데이터셋."""

    def __init__(self, samples, class_to_idx, transform=None):
        self.samples = samples
        self.class_to_idx = class_to_idx
        self.classes = list(class_to_idx.keys())
        self.transform = transform

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, idx):
        path, label = self.samples[idx]
        try:
            image = Image.open(path).convert("RGB")
        except Exception:
            image = Image.new("RGB", (IMG_SIZE, IMG_SIZE), (128, 128, 128))
        if self.transform:
            image = self.transform(image)
        return image, label


def prepare_dataset():
    """원본 폴더에서 이미지 경로 수집 + train/val 분리."""
    print("\n=== 데이터셋 준비 ===")

    class_to_idx = {}
    all_train = []
    all_val = []
    class_idx = 0

    for food in sorted(TARGET_FOODS):
        src_folder = os.path.join(DATA_SRC, food)
        if not os.path.isdir(src_folder):
            print(f"  SKIP {food}: 폴더 없음")
            continue

        images = [
            os.path.join(src_folder, f) for f in os.listdir(src_folder)
            if f.lower().endswith((".jpg", ".jpeg", ".png"))
        ]

        if len(images) < 10:
            print(f"  SKIP {food}: {len(images)}장 (부족)")
            continue

        random.shuffle(images)
        if len(images) > MAX_IMAGES_PER_CLASS:
            images = images[:MAX_IMAGES_PER_CLASS]

        split = int(len(images) * (1 - VAL_RATIO))
        train_imgs = images[:split]
        val_imgs = images[split:]

        class_to_idx[food] = class_idx
        for img in train_imgs:
            all_train.append((img, class_idx))
        for img in val_imgs:
            all_val.append((img, class_idx))

        print(f"  OK {food}: {len(train_imgs)} train + {len(val_imgs)} val")
        class_idx += 1

    random.shuffle(all_train)
    print(f"\n  총 {class_idx}개 클래스")
    print(f"  Train: {len(all_train)}장 | Val: {len(all_val)}장")

    return all_train, all_val, class_to_idx


def create_weighted_sampler(samples):
    """클래스 불균형 해결용 WeightedRandomSampler."""
    labels = [s[1] for s in samples]
    class_counts = Counter(labels)
    weights = [1.0 / class_counts[label] for label in labels]
    return WeightedRandomSampler(weights, len(weights), replacement=True)