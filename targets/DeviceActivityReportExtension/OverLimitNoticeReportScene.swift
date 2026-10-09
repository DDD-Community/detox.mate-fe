//
//  OverLimitNoticeReportScene.swift
//  DeviceActivityReportExtension
//
//  해제 10초 타이머 화면의 "{OO님}에게 알림이 가요." 안내. 이 문구는 "제한 시간을 넘긴 경우에만"
//  보여줘야 하는데, 사용 시간은 이 익스텐션만 알 수 있어서 넘겼을 때만 문구를 그리고 아니면 아무것도
//  그리지 않는다. selectionTokens는 잠근 앱 전체(제한 시간은 잠근 앱 합산 기준). 제한 시간과 받는
//  친구 이름은 메인 앱이 앱 그룹 UserDefaults에 써둔다.
//

import DeviceActivity
import SwiftUI

extension DeviceActivityReport.Context {
  static let overLimitNotice = Self("DetoxOverLimitNotice")
}

private let noticeAppGroup = "group.com.detoxmate.app.dev2"
private let noticeGreen = Color(red: 0x3A / 255, green: 0x8F / 255, blue: 0x46 / 255)

struct OverLimitNoticeView: View {
  let data: TotalActivityData

  var body: some View {
    let defaults = UserDefaults(suiteName: noticeAppGroup)
    let target = defaults?.integer(forKey: "detox.targetMinutes") ?? 0
    let usedMinutes = Int(data.totalDuration / 60)
    let names = defaults?.string(forKey: "detox.unlockNoticeNames") ?? ""

    if target > 0 && usedMinutes > target && !names.isEmpty {
      (Text(names).foregroundColor(noticeGreen)
        + Text("에게 알림이 가요.").foregroundColor(detoxGray800))
        .font(.system(size: 12))
        .frame(maxWidth: .infinity, alignment: .center)
    } else {
      Color.clear
    }
  }
}

struct OverLimitNoticeReportScene: DeviceActivityReportScene {
  let context: DeviceActivityReport.Context = .overLimitNotice
  let content: (TotalActivityData) -> OverLimitNoticeView = { OverLimitNoticeView(data: $0) }

  func makeConfiguration(
    representing data: DeviceActivityResults<DeviceActivityData>
  ) async -> TotalActivityData {
    await aggregateTotalActivityData(representing: data)
  }
}
