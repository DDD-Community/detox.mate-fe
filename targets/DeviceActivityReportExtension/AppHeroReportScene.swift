//
//  AppHeroReportScene.swift
//  DeviceActivityReportExtension
//
//  앱 상세 화면의 오늘 사용 시간. 아이콘과 이름은 메인 앱에서 선택 토큰으로 표시한다.
//

import DeviceActivity
import SwiftUI

extension DeviceActivityReport.Context {
  static let appHero = Self("DetoxAppHero")
}

struct AppHeroView: View {
  let data: TotalActivityData

  var body: some View {
    Text(data.apps.isEmpty ? "조회된 사용 기록 없음" : formatUsageDuration(data.totalDuration))
      .font(.system(size: 24, weight: .medium))
      .foregroundColor(detoxGray900)
      .lineLimit(1)
      .minimumScaleFactor(0.8)
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }
}

struct AppHeroReportScene: DeviceActivityReportScene {
  let context: DeviceActivityReport.Context = .appHero
  let content: (TotalActivityData) -> AppHeroView = { AppHeroView(data: $0) }

  func makeConfiguration(
    representing data: DeviceActivityResults<DeviceActivityData>
  ) async -> TotalActivityData {
    await aggregateTotalActivityData(representing: data)
  }
}
