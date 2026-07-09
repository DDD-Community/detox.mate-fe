#!/usr/bin/env python3
"""
NanumSquareRound + Pretendard 폰트 병합 스크립트

NanumSquareRound에 없는 글리프(힣, 팉 등)를 Pretendard에서 보충해
단일 폰트 파일로 만든다.

사전 준비:
  1. pip install fonttools
  2. Pretendard 폰트 다운로드
     https://github.com/orioncactus/pretendard/releases/latest
     → Pretendard.zip 다운로드 후 압축 해제
     → .ttf 파일들을 scripts/pretendard/ 폴더에 복사
     (필요한 파일: Pretendard-Light.ttf, Pretendard-Regular.ttf,
                   Pretendard-SemiBold.ttf, Pretendard-Bold.ttf)

사용법:
  python scripts/merge-fonts.py

결과:
  assets/fonts/nanum-pretendard/ 폴더에 병합된 폰트 4개 생성
"""

import shutil
from pathlib import Path

PROJECT_ROOT = Path(__file__).parent.parent
NANUM_DIR = PROJECT_ROOT / "assets/fonts/nanum-square-round"
PRETENDARD_DIR = Path(__file__).parent / "pretendard"
OUTPUT_DIR = PROJECT_ROOT / "assets/fonts/nanum-pretendard"

# NanumSquareRound 웨이트 ↔ Pretendard 웨이트 매핑
# 출력 파일명은 기존 NanumSquareRound와 동일하게 유지
#   (fonts.ts 변경 없이 경로만 바꾸기 위해)
WEIGHT_PAIRS = [
    ("NanumSquareRoundL.ttf",  "Pretendard-Light.ttf",    "NanumSquareRoundL.ttf"),
    ("NanumSquareRoundR.ttf",  "Pretendard-Regular.ttf",  "NanumSquareRoundR.ttf"),
    ("NanumSquareRoundB.ttf",  "Pretendard-SemiBold.ttf", "NanumSquareRoundB.ttf"),
    ("NanumSquareRoundEB.ttf", "Pretendard-Bold.ttf",     "NanumSquareRoundEB.ttf"),
]


def get_codepoints(font):
    cmap = font.getBestCmap()
    return set(cmap.keys()) if cmap else set()


def merge_pair(nanum_path, pretendard_path, output_path):
    from fontTools.ttLib import TTFont
    from fontTools.merge import Merger
    from fontTools.subset import Subsetter, Options

    print(f"\n[{nanum_path.name}]")

    nanum = TTFont(nanum_path)
    nanum_codepoints = get_codepoints(nanum)
    nanum.close()

    pretendard = TTFont(pretendard_path)
    pretendard_codepoints = get_codepoints(pretendard)
    pretendard.close()

    missing = pretendard_codepoints - nanum_codepoints
    print(f"  NanumSquare 미지원 글리프: {len(missing)}개 → Pretendard에서 보충")

    if not missing:
        print("  추가할 글리프 없음, 원본 복사")
        shutil.copy(nanum_path, output_path)
        return

    # Pretendard를 미지원 글리프만 남기도록 서브셋
    subset_path = OUTPUT_DIR / f"_tmp_{pretendard_path.name}"
    try:
        pretendard_sub = TTFont(pretendard_path)
        opts = Options()
        opts.layout_features = ["*"]
        opts.name_IDs = ["*"]
        opts.notdef_outline = True
        subsetter = Subsetter(options=opts)
        subsetter.populate(unicodes=missing)
        subsetter.subset(pretendard_sub)
        pretendard_sub.save(str(subset_path))
        pretendard_sub.close()

        # NanumSquare(우선) + Pretendard 서브셋 병합
        merger = Merger()
        merged = merger.merge([str(nanum_path), str(subset_path)])
        merged.save(str(output_path))
        print(f"  저장 완료 → {output_path}")
    finally:
        if subset_path.exists():
            subset_path.unlink()


def check_pretendard():
    missing_files = []
    for _, pretendard_name, _ in WEIGHT_PAIRS:
        p = PRETENDARD_DIR / pretendard_name
        if not p.exists():
            missing_files.append(pretendard_name)
    return missing_files


def main():
    missing = check_pretendard()
    if missing:
        print("[오류] Pretendard 폰트 파일을 scripts/pretendard/ 폴더에 넣어주세요:")
        for f in missing:
            print(f"  - {f}")
        print("\n다운로드: https://github.com/orioncactus/pretendard/releases/latest")
        return

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    for nanum_name, pretendard_name, output_name in WEIGHT_PAIRS:
        merge_pair(
            NANUM_DIR / nanum_name,
            PRETENDARD_DIR / pretendard_name,
            OUTPUT_DIR / output_name,
        )

    print("\n완료!")
    print(f"생성된 폰트: {OUTPUT_DIR}")
    print("\n다음 단계 — fonts.ts에서 import 경로를 변경하세요:")
    print("  assets/fonts/nanum-square-round/ → assets/fonts/nanum-pretendard/")


if __name__ == "__main__":
    main()
