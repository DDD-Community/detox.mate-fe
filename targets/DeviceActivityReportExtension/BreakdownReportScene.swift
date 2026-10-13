//
//  BreakdownReportScene.swift
//  DeviceActivityReportExtension
//

import DeviceActivity
import SwiftUI

extension DeviceActivityReport.Context {
  static let appBreakdown = Self("DetoxAppBreakdown")
}

struct BreakdownReportScene: DeviceActivityReportScene {
  let context: DeviceActivityReport.Context = .appBreakdown
  let content: (TotalActivityData) -> AppBreakdownView = { AppBreakdownView(data: $0) }

  func makeConfiguration(
    representing data: DeviceActivityResults<DeviceActivityData>
  ) async -> TotalActivityData {
    await aggregateTotalActivityData(representing: data)
  }
}
