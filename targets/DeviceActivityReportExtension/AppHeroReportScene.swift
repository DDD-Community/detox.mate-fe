//
//  AppHeroReportScene.swift
//  DeviceActivityReportExtension
//
//  앱 상세 화면 상단: 큰 아이콘 + 앱 이름 + 오늘 사용 시간(피그마 "제한 앱별 리포트").
//  selectionTokens로 앱 하나짜리 토큰을 넘기는 전제라 apps.first만 쓴다.
//

import DeviceActivity
import SwiftUI

extension DeviceActivityReport.Context {
  static let appHero = Self("DetoxAppHero")
}

struct AppHeroView: View {
  let data: TotalActivityData

  var body: some View {
    // 앱 이름과 사용 시간은 왼쪽 정렬(아이콘만 가운데). 이름은 Label(token)을 쓰면 가로 폭을 꽉 채우고
    // 왼쪽 정렬로 그려지므로 그대로 둔다 — 가운데 정렬은 이름이 잘려서 포기했다.
    VStack(spacing: 0) {
      if let app = data.apps.first {
        AppIconView(token: app.id, size: 83)
        Label(app.id)
          .labelStyle(.titleOnly)
          .font(.system(size: 16, weight: .medium))
          .foregroundColor(detoxGray800)
          .frame(maxWidth: .infinity, alignment: .leading)
          .frame(height: 26)
          .padding(.top, 12)
        Text(formatUsageDuration(data.totalDuration))
          .font(.system(size: 24, weight: .medium))
          .foregroundColor(detoxGray900)
          .frame(maxWidth: .infinity, alignment: .leading)
          .frame(height: 32)
          .padding(.top, 4)
      } else {
        Text("불러오는 중…")
          .font(.system(size: 14))
          .foregroundColor(.gray)
      }
    }
    .frame(maxWidth: .infinity)
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
