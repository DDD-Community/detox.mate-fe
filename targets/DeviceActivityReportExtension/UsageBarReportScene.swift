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

struct UsageBarView: View {
  let data: TotalActivityData

  private var targetMinutes: Int {
    UserDefaults(suiteName: barAppGroup)?.integer(forKey: "detox.targetMinutes") ?? 0
  }

  var body: some View {
    let usedMinutes = Int(data.totalDuration / 60)
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
