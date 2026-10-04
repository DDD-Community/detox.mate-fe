//
//  TotalActivityReportScene.swift
//  DeviceActivityReportExtension
//

import DeviceActivity
import FamilyControls
import ManagedSettings
import SwiftUI

struct AppUsage: Identifiable {
  let id: ApplicationToken
  let duration: TimeInterval
}

struct TotalActivityData {
  let totalDuration: TimeInterval
  let apps: [AppUsage]
}

/// 3개 씬(전체 카드/상단 요약/행 하나)이 전부 같은 방식으로 집계하므로 공용 함수로 뺐다.
func aggregateTotalActivityData(
  representing data: DeviceActivityResults<DeviceActivityData>
) async -> TotalActivityData {
  var totalDuration: TimeInterval = 0
  var appDurations: [ApplicationToken: TimeInterval] = [:]

  for await datum in data {
    for await segment in datum.activitySegments {
      totalDuration += segment.totalActivityDuration

      for await category in segment.categories {
        for await app in category.applications {
          guard let token = app.application.token else { continue }
          appDurations[token, default: 0] += app.totalActivityDuration
        }
      }
    }
  }

  let apps = appDurations
    .map { AppUsage(id: $0.key, duration: $0.value) }
    .sorted { $0.duration > $1.duration }

  return TotalActivityData(totalDuration: totalDuration, apps: apps)
}

struct TotalActivityReportScene: DeviceActivityReportScene {
  let context: DeviceActivityReport.Context = .totalActivity
  let content: (TotalActivityData) -> TotalActivityView = { TotalActivityView(data: $0) }

  func makeConfiguration(
    representing data: DeviceActivityResults<DeviceActivityData>
  ) async -> TotalActivityData {
    await aggregateTotalActivityData(representing: data)
  }
}
