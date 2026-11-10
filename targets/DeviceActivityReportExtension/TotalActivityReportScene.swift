//
//  TotalActivityReportScene.swift
//  DeviceActivityReportExtension
//

import DeviceActivity
import FamilyControls
import ManagedSettings
import SwiftUI

// 앱 그룹에 "앱별 오늘 사용 시간"을 남겨 두면, 메인 앱이 리포트가 그려지기 전에 직전 값을 먼저 보여 준다.
// 키 구조와 날짜 형식은 modules/screen-time-report/ios/ScreenTimeReportView.swift의 읽는 쪽과 같아야 한다.
private let usageCacheAppGroup = "group.com.detoxmate.app.dev2"
private let usageCacheKey = "detox.usageCache"
private let usageCacheUpdatedNotification = "detox.usageCache.updated"

private func usageCacheDayKey(_ date: Date) -> String {
  let parts = Calendar.current.dateComponents([.year, .month, .day], from: date)
  return String(format: "%04d-%02d-%02d", parts.year ?? 0, parts.month ?? 0, parts.day ?? 0)
}

private func usageCacheTokenKey(_ token: ApplicationToken) -> String? {
  guard let data = try? JSONEncoder().encode(token) else { return nil }
  var hash: UInt64 = 5381
  for byte in data { hash = (hash &* 33) &+ UInt64(byte) }
  return String(hash, radix: 16)
}

private func writeUsageCache(_ durations: [ApplicationToken: TimeInterval]) {
  guard !durations.isEmpty, let defaults = UserDefaults(suiteName: usageCacheAppGroup) else { return }
  let day = usageCacheDayKey(Date())
  let now = Date().timeIntervalSince1970
  var cache = defaults.dictionary(forKey: usageCacheKey) ?? [:]
  for (token, duration) in durations {
    guard let key = usageCacheTokenKey(token) else { continue }
    cache[key] = ["seconds": duration, "day": day, "writtenAt": now]
  }
  defaults.set(cache, forKey: usageCacheKey)
  defaults.synchronize()
  CFNotificationCenterPostNotification(
    CFNotificationCenterGetDarwinNotifyCenter(),
    CFNotificationName(usageCacheUpdatedNotification as CFString),
    nil, nil, true
  )
}

struct AppUsage: Identifiable {
  let id: ApplicationToken
  let duration: TimeInterval
  /// 화면을 켜고 이 앱을 집어든(pickup) 횟수 / 받은 알림 수 — 애플이 같이 집계해준다.
  var pickups: Int = 0
  var notifications: Int = 0
  /// 리포트 확장 안에서는 앱 이름을 문자열로 읽을 수 있다(메인 앱에서는 Label(token)으로만 가능).
  var name: String? = nil
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
  var appNames: [ApplicationToken: String] = [:]

  for await datum in data {
    for await segment in datum.activitySegments {
      for await category in segment.categories {
        for await app in category.applications {
          guard let token = app.application.token else { continue }
          appDurations[token, default: 0] += app.totalActivityDuration
          appPickups[token, default: 0] += app.numberOfPickups
          appNotifications[token, default: 0] += app.numberOfNotifications
          if let name = app.application.localizedDisplayName { appNames[token] = name }
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
        notifications: appNotifications[$0.key] ?? 0,
        name: appNames[$0.key]
      )
    }
    .sorted { $0.duration > $1.duration }

  // segment.totalActivityDuration은 앱 필터와 무관하게 "그 시간대 전체"라서(선택한 앱이 12분이어도
  // 기기 전체 2시간 38분이 나왔다) 쓰지 않고, 필터에 걸린 앱들의 사용 시간을 직접 합산한다.
  let totalDuration = apps.reduce(0) { $0 + $1.duration }

  writeUsageCache(appDurations)

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
