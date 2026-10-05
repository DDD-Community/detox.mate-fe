//
//  ShowcaseReportScene.swift
//  DeviceActivityReportExtension
//
//  [임시] 리포트 익스텐션 안에서 UI를 어디까지 커스텀할 수 있는지 보여주는 샘플 갤러리.
//  my-lock-status의 임시 버튼 → ui-showcase 화면에서 쓴다. 확인이 끝나면 통째로 지워도 된다.
//

import DeviceActivity
import SwiftUI

extension DeviceActivityReport.Context {
  static let showcase = Self("DetoxShowcase")
}

private let showcaseGreen50 = Color(red: 0xEF / 255, green: 0xF3 / 255, blue: 0xF1 / 255)
private let showcaseGreen300 = Color(red: 0x5A / 255, green: 0x89 / 255, blue: 0x74 / 255)
private let showcaseGray400 = Color(red: 0x85 / 255, green: 0x8D / 255, blue: 0x9D / 255)

private let showcaseAppGroup = "group.com.detoxmate.app.dev2"

struct ShowcaseView: View {
  let data: TotalActivityData

  private var targetMinutes: Int {
    UserDefaults(suiteName: showcaseAppGroup)?.integer(forKey: "detox.targetMinutes") ?? 0
  }

  /// 보여줄 섹션 번호. JS(UiShowcaseScreen)가 앱 그룹 UserDefaults에 써둔다.
  /// 한 번에 전부 그리면 Label(token)이 20개 넘게 떠서(익스텐션 메모리 한도가 작다) 하나씩만 그린다.
  private var section: Int {
    UserDefaults(suiteName: showcaseAppGroup)?.integer(forKey: "detox.showcaseSection") ?? 0
  }

  var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      switch section {
      case 0: connectionCheck()
      case 9: limits()
      default:
        if let first = data.apps.first {
          switch section {
          case 1: labelStyles(first)
          case 2: iconSizeAndShape(first)
          case 3: nameFonts(first)
          case 4: durationFormats(first)
          case 5: progress(first)
          case 6: extraMetrics(first)
          case 7: rankedList()
          default: darkCard(first)
          }
        } else {
          Text("선택된 앱의 사용 기록이 아직 없어요.")
            .font(.system(size: 14))
            .foregroundColor(showcaseGray400)
        }
      }
    }
    .padding(16)
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .top)
  }

  // MARK: - 0. 연결 확인(Label 없이 글자만)

  private func connectionCheck() -> some View {
    card("0. 연결 확인", "이 카드가 보이면 샘플 씬은 정상적으로 뜬 것. 위 칩으로 섹션을 바꿔보세요.") {
      VStack(alignment: .leading, spacing: 4) {
        Text("집계된 앱 수: \(data.apps.count)개")
        Text("총 사용 시간: \(formatUsageDuration(data.totalDuration))")
        Text("제한 시간(앱 그룹 값): \(targetMinutes)분")
        Text("선택된 섹션 번호: \(section)")
      }
      .font(.system(size: 14))
      .foregroundColor(detoxGray800)
    }
  }

  // MARK: - 공통 카드

  private func card<Content: View>(
    _ title: String, _ note: String, @ViewBuilder content: () -> Content
  ) -> some View {
    VStack(alignment: .leading, spacing: 10) {
      Text(title)
        .font(.system(size: 14, weight: .bold))
        .foregroundColor(detoxGray800)
      Text(note)
        .font(.system(size: 12))
        .foregroundColor(showcaseGray400)
      content()
    }
    .padding(14)
    .frame(maxWidth: .infinity, alignment: .leading)
    .background(showcaseGreen50)
    .cornerRadius(16)
  }

  // MARK: - 1. Label 스타일

  private func labelStyles(_ app: AppUsage) -> some View {
    card("1. 아이콘/이름 조합", "Label(token)의 스타일 3종. 이름은 문자열이 아니라 이 뷰로만 그릴 수 있다.") {
      VStack(alignment: .leading, spacing: 8) {
        Label(app.id).labelStyle(.titleAndIcon).font(.system(size: 16))
        Label(app.id).labelStyle(.iconOnly)
        Label(app.id).labelStyle(.titleOnly).font(.system(size: 16))
      }
      .foregroundColor(detoxGray800)
    }
  }

  // MARK: - 2. 아이콘 크기/모양

  private func iconSizeAndShape(_ app: AppUsage) -> some View {
    card("2. 아이콘 크기·모양", "scaleEffect + clipShape로 크기/모양 변경(비율 0.25=기본, 0.5=원, 0.1=각진 사각).") {
      HStack(alignment: .bottom, spacing: 12) {
        AppIconView(token: app.id, size: 24)
        AppIconView(token: app.id, size: 44)
        AppIconView(token: app.id, size: 64)
        AppIconView(token: app.id, size: 64, cornerRatio: 0.5)
        AppIconView(token: app.id, size: 64, cornerRatio: 0.1)
      }
    }
  }

  // MARK: - 3. 이름 폰트

  private func nameFonts(_ app: AppUsage) -> some View {
    card("3. 이름 폰트·색", "Label에 font/색/자간을 그대로 적용할 수 있다(글자 자체는 못 바꿈).") {
      VStack(alignment: .leading, spacing: 8) {
        Label(app.id).labelStyle(.titleOnly)
          .font(.system(size: 20, weight: .heavy)).foregroundColor(detoxGray900)
        Label(app.id).labelStyle(.titleOnly)
          .font(.system(size: 18, design: .serif)).foregroundColor(showcaseGreen300)
        Label(app.id).labelStyle(.titleOnly)
          .font(.system(size: 16, design: .monospaced)).foregroundColor(.orange)
        Label(app.id).labelStyle(.titleOnly)
          .font(.system(size: 16, weight: .semibold, design: .rounded)).tracking(2)
          .foregroundColor(.purple)
      }
    }
  }

  // MARK: - 4. 사용 시간 표기

  private func durationFormats(_ app: AppUsage) -> some View {
    let totalMinutes = Int(app.duration / 60)
    let hours = totalMinutes / 60
    let minutes = totalMinutes % 60
    return card("4. 사용 시간 표기", "숫자(초)만 받아 표기는 마음대로 만든다.") {
      VStack(alignment: .leading, spacing: 6) {
        Text("\(hours)시간 \(minutes)분 사용")
        Text("총 \(totalMinutes)분")
        Text(String(format: "%02d:%02d", hours, minutes))
          .font(.system(size: 18, weight: .semibold, design: .monospaced))
        HStack(alignment: .firstTextBaseline, spacing: 2) {
          Text("\(hours)").font(.system(size: 40, weight: .bold))
          Text("시간").font(.system(size: 14))
          Text("\(minutes)").font(.system(size: 40, weight: .bold))
          Text("분").font(.system(size: 14))
        }
        .foregroundColor(showcaseGreen300)
      }
      .font(.system(size: 16))
      .foregroundColor(detoxGray800)
    }
  }

  // MARK: - 5. 제한 시간 대비 진행도

  private func progress(_ app: AppUsage) -> some View {
    let used = app.duration / 60
    let ratio = targetMinutes > 0 ? min(used / Double(targetMinutes), 1) : 0
    let tint: Color = ratio >= 1 ? .red : (ratio >= 0.7 ? .orange : showcaseGreen300)
    return card("5. 제한 시간 대비 진행도", "막대·원형 그래프도 직접 그린다(70%↑ 주황, 100% 빨강). 제한 시간 \(targetMinutes)분.") {
      HStack(spacing: 20) {
        VStack(alignment: .leading, spacing: 6) {
          GeometryReader { proxy in
            ZStack(alignment: .leading) {
              Capsule().fill(Color.white)
              Capsule().fill(tint).frame(width: proxy.size.width * ratio)
            }
          }
          .frame(height: 12)
          Text("\(Int((ratio * 100).rounded()))%")
            .font(.system(size: 14, weight: .medium))
            .foregroundColor(detoxGray800)
        }
        ZStack {
          Circle().stroke(Color.white, lineWidth: 8)
          Circle().trim(from: 0, to: ratio)
            .stroke(tint, style: StrokeStyle(lineWidth: 8, lineCap: .round))
            .rotationEffect(.degrees(-90))
          Text("\(Int((ratio * 100).rounded()))%")
            .font(.system(size: 12, weight: .bold))
            .foregroundColor(detoxGray800)
        }
        .frame(width: 56, height: 56)
      }
    }
  }

  // MARK: - 6. 추가 지표

  private func extraMetrics(_ app: AppUsage) -> some View {
    card("6. 애플이 같이 주는 추가 지표", "집어든 횟수·받은 알림 수도 집계되어 온다.") {
      HStack(spacing: 10) {
        metricBox("집어든 횟수", "\(app.pickups)회")
        metricBox("받은 알림", "\(app.notifications)개")
      }
    }
  }

  private func metricBox(_ title: String, _ value: String) -> some View {
    VStack(spacing: 4) {
      Text(value).font(.system(size: 20, weight: .bold)).foregroundColor(detoxGray900)
      Text(title).font(.system(size: 12)).foregroundColor(showcaseGray400)
    }
    .frame(maxWidth: .infinity)
    .padding(.vertical, 12)
    .background(Color.white)
    .cornerRadius(12)
  }

  // MARK: - 7. 여러 앱 랭킹

  private func rankedList() -> some View {
    let maxDuration = max(data.apps.map { $0.duration }.max() ?? 1, 1)
    return card("7. 여러 앱 랭킹 막대", "선택한 모든 앱을 사용 시간순으로 + 상대 막대.") {
      VStack(spacing: 10) {
        ForEach(Array(data.apps.prefix(5).enumerated()), id: \.element.id) { index, app in
          HStack(spacing: 10) {
            Text("\(index + 1)").font(.system(size: 12, weight: .bold)).frame(width: 14)
            AppIconView(token: app.id, size: 32)
            GeometryReader { proxy in
              Capsule().fill(showcaseGreen300)
                .frame(width: max(proxy.size.width * (app.duration / maxDuration), 6))
            }
            .frame(height: 8)
            Text("\(Int(app.duration / 60))분").font(.system(size: 12)).frame(width: 40, alignment: .trailing)
          }
          .foregroundColor(detoxGray800)
        }
      }
    }
  }

  // MARK: - 8. 다크 카드

  private func darkCard(_ app: AppUsage) -> some View {
    card("8. 배경/그라데이션", "배경·그라데이션·그림자 등 SwiftUI 스타일은 거의 다 된다.") {
      HStack(spacing: 12) {
        AppIconView(token: app.id, size: 48)
        VStack(alignment: .leading, spacing: 2) {
          Label(app.id).labelStyle(.titleOnly)
            .font(.system(size: 16, weight: .semibold)).foregroundColor(.white)
          Text("오늘 \(formatUsageDuration(app.duration))")
            .font(.system(size: 14)).foregroundColor(.white.opacity(0.8))
        }
        Spacer()
      }
      .padding(14)
      .background(
        LinearGradient(
          colors: [showcaseGreen300, Color(red: 0.1, green: 0.2, blue: 0.16)],
          startPoint: .topLeading, endPoint: .bottomTrailing)
      )
      .cornerRadius(16)
      .shadow(color: .black.opacity(0.2), radius: 6, y: 3)
    }
  }

  // MARK: - 안 되는 것

  private func limits() -> some View {
    card("안 되는 것(정책/기술)", "") {
      VStack(alignment: .leading, spacing: 4) {
        Text("• 앱 이름을 문자열로 읽기/가공(검색·정렬·번역)")
        Text("• 아이콘을 이미지 파일로 꺼내기(공유·저장·RN에서 그리기)")
        Text("• 이 화면의 숫자를 메인 앱(JS)으로 돌려받기")
        Text("• 이 안에서 네트워크 전송/서버 저장")
        Text("• 앱 열기·화면 이동 같은 동작(탭은 바깥 RN 쪽에서 처리)")
      }
      .font(.system(size: 12))
      .foregroundColor(detoxGray800)
    }
  }
}

struct ShowcaseReportScene: DeviceActivityReportScene {
  let context: DeviceActivityReport.Context = .showcase
  let content: (TotalActivityData) -> ShowcaseView = { ShowcaseView(data: $0) }

  func makeConfiguration(
    representing data: DeviceActivityResults<DeviceActivityData>
  ) async -> TotalActivityData {
    await aggregateTotalActivityData(representing: data)
  }
}
