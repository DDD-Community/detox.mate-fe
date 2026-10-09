//
//  SummaryReportScene.swift
//  DeviceActivityReportExtension
//
//  my-lock-status 상단에 들어가는 "N시간 N분 사용" 한 줄짜리 요약. 카드/배경/앱별
//  목록 없이 숫자 텍스트 하나만 그린다(피그마 "46분 사용" 참고).
//

import DeviceActivity
import SwiftUI

extension DeviceActivityReport.Context {
  static let usageSummary = Self("DetoxUsageSummary")
}

struct SummaryReportScene: DeviceActivityReportScene {
  let context: DeviceActivityReport.Context = .usageSummary
  let content: (TotalActivityData) -> UsageSummaryView = { UsageSummaryView(data: $0) }

  func makeConfiguration(
    representing data: DeviceActivityResults<DeviceActivityData>
  ) async -> TotalActivityData {
    await aggregateTotalActivityData(representing: data)
  }
}
