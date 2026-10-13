//
//  AppPercentReportScene.swift
//  DeviceActivityReportExtension
//
//  "오늘 설정한 제한 시간 중 이 앱을 쓴 비율(%)". 사용 시간은 이 익스텐션 안에서만
//  알 수 있어서 퍼센트도 여기서 계산해 그린다. 제한 시간(분)은 메인 앱이 앱 그룹
//  UserDefaults("detox.targetMinutes")에 써둔 값을 읽는다.
//

import DeviceActivity
import SwiftUI

extension DeviceActivityReport.Context {
  static let appPercent = Self("DetoxAppPercent")
}

// 메인 앱(react-native-device-activity)이 쓰는 앱 그룹과 같아야 한다(expo-target.config.js 참고).
private let detoxAppGroup = "group.com.detoxmate.app.dev2"
private let targetMinutesKey = "detox.targetMinutes"

struct AppPercentView: View {
  let data: TotalActivityData

  private var text: String {
    let targetMinutes = UserDefaults(suiteName: detoxAppGroup)?.integer(forKey: targetMinutesKey) ?? 0
    guard targetMinutes > 0 else { return "-" }
    let usedMinutes = data.totalDuration / 60
    return "\(Int((usedMinutes / Double(targetMinutes) * 100).rounded()))%"
  }

  var body: some View {
    HStack {
      Spacer()
      Text(text)
        .font(.system(size: 16, weight: .medium))
        .foregroundColor(detoxGray900)
    }
  }
}

struct AppPercentReportScene: DeviceActivityReportScene {
  let context: DeviceActivityReport.Context = .appPercent
  let content: (TotalActivityData) -> AppPercentView = { AppPercentView(data: $0) }

  func makeConfiguration(
    representing data: DeviceActivityResults<DeviceActivityData>
  ) async -> TotalActivityData {
    await aggregateTotalActivityData(representing: data)
  }
}
