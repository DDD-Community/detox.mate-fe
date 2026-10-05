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
  /// 화면을 켜고 이 앱을 집어든(pickup) 횟수 / 받은 알림 수 — 애플이 같이 집계해준다.
  var pickups: Int = 0
  var notifications: Int = 0
}

struct TotalActivityData {
  let totalDuration: TimeInterval
  let apps: [AppUsage]
}

/// 3개 씬(전체 카드/상단 요약/행 하나)이 전부 같은 방식으로 집계하므로 공용 함수로 뺐다.
func aggregateTotalActivityData(
  representing data: DeviceActivityResults<DeviceActivityData>
) async -> TotalActivityData {
  var appDurations: [ApplicationToken: TimeInterval] = [:]
  var appPickups: [ApplicationToken: Int] = [:]
  var appNotifications: [ApplicationToken: Int] = [:]

  for await datum in data {
    for await segment in datum.activitySegments {
      for await category in segment.categories {
        for await app in category.applications {
          guard let token = app.application.token else { continue }
          appDurations[token, default: 0] += app.totalActivityDuration
          appPickups[token, default: 0] += app.numberOfPickups
          appNotifications[token, default: 0] += app.numberOfNotifications
        }
      }
    }
  }

  let apps = appDurations
    .map {
      AppUsage(
        id: $0.key,
        duration: $0.value,
        pickups: appPickups[$0.key] ?? 0,
        notifications: appNotifications[$0.key] ?? 0
      )
    }
    .sorted { $0.duration > $1.duration }

  // segment.totalActivityDuration은 앱 필터와 무관하게 "그 시간대 전체"라서(선택한 앱이 12분이어도
  // 기기 전체 2시간 38분이 나왔다) 쓰지 않고, 필터에 걸린 앱들의 사용 시간을 직접 합산한다.
  let totalDuration = apps.reduce(0) { $0 + $1.duration }

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
