//
//  AppRowReportScene.swift
//  DeviceActivityReportExtension
//
//  my-lock-status 리스트의 앱 한 줄(아이콘 + 이름 + 오늘 사용 시간 + 화살표)만 그리는
//  컴팩트한 씬. selectionTokens로 앱 하나짜리 토큰을 넘기면 그 앱만 집계된다.
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
