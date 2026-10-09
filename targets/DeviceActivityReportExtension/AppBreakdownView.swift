//
//  AppBreakdownView.swift
//  DeviceActivityReportExtension
//
//  my-lock-status 리스트용 — 한 번에 여러 앱을 선택해 등록한 경우("잠긴 앱 N" 한
//  그룹 안에 앱이 여러 개 들어있는 경우) AppRowView(앱 1개 가정)는 첫 번째 앱만
//  보여주고 나머지는 조용히 누락시켰다. 그룹 안의 앱이 몇 개든 전부 행으로 보여주되,
//  (summary 씬에서 이미 보여주는) "오늘 N 사용" 총합 타이틀은 중복이라 뺀다.
//

import DeviceActivity
import SwiftUI

private let gray800 = Color(red: 0x38 / 255, green: 0x3E / 255, blue: 0x49 / 255)
private let gray400 = Color(red: 0x85 / 255, green: 0x8D / 255, blue: 0x9D / 255)
private let gray100 = Color(red: 0xD0 / 255, green: 0xD3 / 255, blue: 0xD9 / 255)

private func formatBreakdownDuration(_ seconds: TimeInterval) -> String {
  let totalMinutes = Int(seconds / 60)
  let hours = totalMinutes / 60
  let minutes = totalMinutes % 60
  if hours == 0 { return "\(minutes)분 사용" }
  if minutes == 0 { return "\(hours)시간 사용" }
  return "\(hours)시간 \(minutes)분 사용"
}

struct AppBreakdownView: View {
  let data: TotalActivityData

  var body: some View {
    if data.apps.isEmpty {
      Text("불러오는 중…")
        .font(.system(size: 14))
        .foregroundColor(gray400)
        .padding(.horizontal, 16)
    } else {
      VStack(spacing: 0) {
        ForEach(Array(data.apps.enumerated()), id: \.element.id) { index, app in
          if index > 0 {
            Divider().background(gray100)
          }
          HStack {
            Label(app.id)
              .labelStyle(.titleAndIcon)
              .font(.system(size: 16, weight: .semibold))
              .foregroundColor(gray800)
            Spacer()
            Text(formatBreakdownDuration(app.duration))
              .font(.system(size: 16, weight: .semibold))
              .foregroundColor(gray800)
            Image(systemName: "chevron.right")
              .font(.system(size: 14, weight: .semibold))
              .foregroundColor(gray400)
          }
          .padding(.vertical, 10)
        }
      }
      .padding(.horizontal, 16)
    }
  }
}
