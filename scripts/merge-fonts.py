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


# NanumSquare에 없는 한국어 관련 유니코드 범위만 보충 대상으로 한정
KOREAN_RANGES = [
    (0xAC00, 0xD7A3),   # Hangul Syllables
    (0x1100, 0x11FF),   # Hangul Jamo
    (0x3130, 0x318F),   # Hangul Compatibility Jamo
    (0xA960, 0xA97F),   # Hangul Jamo Extended-A
    (0xD7B0, 0xD7FF),   # Hangul Jamo Extended-B
]


def is_korean(codepoint):
    return any(lo <= codepoint <= hi for lo, hi in KOREAN_RANGES)


def get_codepoints(font):
    cmap = font.getBestCmap()
    return set(cmap.keys()) if cmap else set()


def is_empty_glyph(glyph):
    """빈 글리프(외곽선 없음, 합성 아님) 여부 확인."""
    try:
        return not glyph.isComposite() and glyph.numberOfContours == 0
    except Exception:
        return False


def collect_glyph_deps(glyf_table, glyph_name, out=None):
    """glyph_name 과 그것이 참조하는 합성 글리프 구성 요소를 재귀적으로 수집."""
    if out is None:
        out = set()
    if glyph_name in out:
        return out
    out.add(glyph_name)
    try:
        glyph = glyf_table[glyph_name]
        if glyph.isComposite():
            for comp in glyph.components:
                collect_glyph_deps(glyf_table, comp.glyphName, out)
    except KeyError:
        pass
    return out


def merge_pair(nanum_path, pretendard_path, output_path):
    from fontTools.ttLib import TTFont
    from fontTools.ttLib.scaleUpem import scale_upem

    print(f"\n[{nanum_path.name}]")

    nanum = TTFont(nanum_path)
    pretendard = TTFont(pretendard_path)

    nanum_cmap_dict = nanum.getBestCmap() or {}
    pretendard_cmap_dict = pretendard.getBestCmap() or {}

    nanum_glyf = nanum['glyf']
    pretendard_glyf = pretendard['glyf']

    # NanumSquare에서 한국어 범위의 빈 글리프(contours=0)를 찾아 Pretendard로 교체
    empty_codepoints = set()
    for cp in range(0xAC00, 0xD7A4):
        gn = nanum_cmap_dict.get(cp)
        if gn:
            try:
                if is_empty_glyph(nanum_glyf[gn]) and cp in pretendard_cmap_dict:
                    empty_codepoints.add(cp)
            except KeyError:
                pass

    print(f"  빈 한국어 글리프: {len(empty_codepoints)}개 → Pretendard로 교체")

    if not empty_codepoints:
        print("  교체할 글리프 없음, 원본 복사")
        shutil.copy(nanum_path, output_path)
        nanum.close()
        pretendard.close()
        return

    # Pretendard를 NanumSquare UPM으로 스케일 조정
    nanum_upem = nanum['head'].unitsPerEm
    pretendard_upem = pretendard['head'].unitsPerEm
    if pretendard_upem != nanum_upem:
        print(f"  UPM 조정: {pretendard_upem} → {nanum_upem}")
        scale_upem(pretendard, nanum_upem)

    pretendard_hmtx = pretendard['hmtx'].metrics
    nanum_hmtx = nanum['hmtx'].metrics
    nanum_existing = set(nanum.getGlyphOrder())
    glyph_order = list(nanum.getGlyphOrder())

    # Pretendard 글리프 의존성(합성 구성 요소) 수집
    src_names_needed = set()
    cp_to_src = {}
    for cp in empty_codepoints:
        src = pretendard_cmap_dict.get(cp)
        if src is None:
            continue
        deps = collect_glyph_deps(pretendard_glyf, src)
        src_names_needed.update(deps)
        cp_to_src[cp] = src

    # Pretendard 구성 요소 글리프를 NanumSquare에 추가 (이름 충돌 시 'prd.' 접두어)
    name_map = {}
    for src in src_names_needed:
        nanum_gn = nanum_cmap_dict.get(
            next((cp for cp, s in cp_to_src.items() if s == src), -1), None
        )
        # 이미 NanumSquare에 같은 이름 존재하면 접두어
        dst = src if src not in nanum_existing else f"prd.{src}"
        name_map[src] = dst
        if dst not in nanum_existing:
            try:
                nanum_glyf[dst] = pretendard_glyf[src]
                nanum_hmtx[dst] = pretendard_hmtx.get(src, (nanum_upem, 0))
                glyph_order.append(dst)
                nanum_existing.add(dst)
            except KeyError:
                pass

    # 합성 글리프 구성 요소 이름 업데이트
    for dst in list(name_map.values()):
        try:
            glyph = nanum_glyf[dst]
            if glyph.isComposite():
                for comp in glyph.components:
                    if comp.glyphName in name_map:
                        comp.glyphName = name_map[comp.glyphName]
        except KeyError:
            pass

    # NanumSquare의 빈 글리프를 Pretendard 글리프로 교체
    replaced = 0
    for cp, src in cp_to_src.items():
        dst = name_map.get(src, src)
        nanum_gn = nanum_cmap_dict.get(cp)
        if nanum_gn and dst in nanum_glyf:
            # 기존 빈 글리프를 Pretendard 글리프로 덮어씀
            nanum_glyf[nanum_gn] = nanum_glyf[dst]
            nanum_hmtx[nanum_gn] = nanum_hmtx.get(dst, (nanum_upem, 0))
            replaced += 1

    nanum.setGlyphOrder(glyph_order)
    nanum.save(str(output_path))
    print(f"  {replaced}개 글리프 교체 → {output_path}")

    nanum.close()
    pretendard.close()


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
