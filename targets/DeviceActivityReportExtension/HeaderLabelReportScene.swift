//
//  HeaderLabelReportScene.swift
//  DeviceActivityReportExtension
//

import DeviceActivity
import SwiftUI

extension DeviceActivityReport.Context {
  static let appHeaderLabel = Self("DetoxAppHeaderLabel")
}

struct HeaderLabelReportScene: DeviceActivityReportScene {
  let context: DeviceActivityReport.Context = .appHeaderLabel
  let content: (TotalActivityData) -> HeaderLabelView = { HeaderLabelView(data: $0) }

  func makeConfiguration(
    representing data: DeviceActivityResults<DeviceActivityData>
  ) async -> TotalActivityData {
    await aggregateTotalActivityData(representing: data)
  }
}
