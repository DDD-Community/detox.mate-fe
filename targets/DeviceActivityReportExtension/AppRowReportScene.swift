//
//  AppRowReportScene.swift
//  DeviceActivityReportExtension
//
//  my-lock-status 리스트 행의 오늘 사용 시간만 그리는 씬.
//  아이콘과 이름은 메인 앱에서 선택 토큰으로 표시한다.
//

import DeviceActivity
import SwiftUI

extension DeviceActivityReport.Context {
  static let appRow = Self("DetoxAppRow")
}

struct AppRowReportScene: DeviceActivityReportScene {
  let context: DeviceActivityReport.Context = .appRow
  let content: (TotalActivityData) -> AppRowView = { AppRowView(data: $0) }

  func makeConfiguration(
    representing data: DeviceActivityResults<DeviceActivityData>
  ) async -> TotalActivityData {
    await aggregateTotalActivityData(representing: data)
  }
}
