//
//  UsageBarReportScene.swift
//  DeviceActivityReportExtension
//
//  해제 시간 설정 화면의 "이 앱의 오늘 사용 시간 막대"(피그마 해제 시간 설정). 사용 시간은 이
//  익스텐션만 알 수 있어서 막대와 "사용 시간 N분 / 제한 시간 M분" 라벨을 여기서 그린다.
//  selectionTokens는 앱 하나짜리 전제. 제한 시간은 메인 앱이 앱 그룹 UserDefaults에 써둔 값.
//

import DeviceActivity
import SwiftUI

extension DeviceActivityReport.Context {
  static let usageBar = Self("DetoxUsageBar")
}

private let barAppGroup = "group.com.detoxmate.app.dev2"
private let barGreen300 = Color(red: 0x5A / 255, green: 0x89 / 255, blue: 0x74 / 255)
private let barGray600 = Color(red: 0x5D / 255, green: 0x66 / 255, blue: 0x79 / 255)
private let barRed = Color(red: 0xFF / 255, green: 0x4D / 255, blue: 0x4F / 255)

private let extraMinutesKey = "detox.usageBarExtraMinutes"
// 메인 앱이 스테퍼를 움직일 때마다 쏘는 Darwin 알림 이름(modules/screen-time-report와 같아야 한다).
private let extraMinutesChangedName = "detox.usageBarExtraMinutes.changed"

private func readExtraMinutes() -> Int {
  let defaults = UserDefaults(suiteName: barAppGroup)
  defaults?.synchronize()
  return defaults?.integer(forKey: extraMinutesKey) ?? 0
}

/// 해제 시간 설정 화면의 스테퍼 값(추가로 쓸 분)을 실시간으로 받는다. 리포트는 데이터가 바뀔 때만
/// 다시 집계되므로, 메인 앱이 앱 그룹에 값을 쓰고 Darwin 알림을 쏘면 여기서 값을 다시 읽는다.
private final class ExtraMinutesObserver: ObservableObject {
  @Published var minutes: Int = readExtraMinutes()
  private var timer: Timer?

  init() {
    // Darwin 알림이 확장에 전달되지 않는 경우를 대비해, 값도 짧은 간격으로 직접 다시 읽는다.
    timer = Timer.scheduledTimer(withTimeInterval: 0.25, repeats: true) { [weak self] _ in
      guard let self = self else { return }
      let latest = readExtraMinutes()
      if latest != self.minutes { self.minutes = latest }
    }

    CFNotificationCenterAddObserver(
      CFNotificationCenterGetDarwinNotifyCenter(),
      Unmanaged.passUnretained(self).toOpaque(),
      { _, observer, _, _, _ in
        guard let observer = observer else { return }
        let object = Unmanaged<ExtraMinutesObserver>.fromOpaque(observer).takeUnretainedValue()
        DispatchQueue.main.async { object.minutes = readExtraMinutes() }
      },
      extraMinutesChangedName as CFString,
      nil,
      .deliverImmediately
    )
  }

  deinit {
    timer?.invalidate()
    CFNotificationCenterRemoveObserver(
      CFNotificationCenterGetDarwinNotifyCenter(),
      Unmanaged.passUnretained(self).toOpaque(),
      CFNotificationName(extraMinutesChangedName as CFString),
      nil
    )
  }
}

struct UsageBarView: View {
  let data: TotalActivityData
  @StateObject private var extra = ExtraMinutesObserver()

  private var targetMinutes: Int {
    UserDefaults(suiteName: barAppGroup)?.integer(forKey: "detox.targetMinutes") ?? 0
  }

  var body: some View {
    // 스테퍼로 정한 "추가로 쓸 시간"만큼 사용 시간과 막대를 함께 늘린다.
    let usedMinutes = Int(data.totalDuration / 60) + extra.minutes
    let target = targetMinutes
    let ratio = target > 0 ? min(Double(usedMinutes) / Double(target), 1) : 0
    let isOver = target > 0 && usedMinutes > target
    let tint = isOver ? barRed : barGreen300

    VStack(spacing: 8) {
      GeometryReader { proxy in
        ZStack(alignment: .leading) {
          Capsule().fill(tint.opacity(0.3))
          Capsule().fill(tint).frame(width: proxy.size.width * ratio)
        }
      }
      .frame(height: 11)

      HStack {
        (Text("사용 시간").foregroundColor(detoxGray800) + Text(" \(usedMinutes)분").foregroundColor(tint))
        Spacer()
        (Text("제한 시간 ").foregroundColor(barGray600)
          + Text(target > 0 ? "\(target)분" : "-").foregroundColor(barGreen300))
      }
      .font(.system(size: 11))
    }
  }
}

struct UsageBarReportScene: DeviceActivityReportScene {
  let context: DeviceActivityReport.Context = .usageBar
  let content: (TotalActivityData) -> UsageBarView = { UsageBarView(data: $0) }

  func makeConfiguration(
    representing data: DeviceActivityResults<DeviceActivityData>
  ) async -> TotalActivityData {
    await aggregateTotalActivityData(representing: data)
  }
}
