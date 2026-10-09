//
//  TotalActivityView.swift
//  DeviceActivityReportExtension
//
//  실제 스크린타임 숫자를 보여주는 커스텀 화면. 앱 아이콘+이름은 Apple이 주는
//  Label(token)만 쓸 수 있지만, 그 외 색/레이아웃/카드 모양은 전부 우리 브랜드
//  톤(src/lib/token/primitive/colors.ts의 green/gray 팔레트)에 맞춰 직접 그렸다.
//

import DeviceActivity
import SwiftUI

private let green50 = Color(red: 0xEF / 255, green: 0xF3 / 255, blue: 0xF1 / 255)
private let green300 = Color(red: 0x5A / 255, green: 0x89 / 255, blue: 0x74 / 255)
private let gray800 = Color(red: 0x38 / 255, green: 0x3E / 255, blue: 0x49 / 255)
private let gray400 = Color(red: 0x85 / 255, green: 0x8D / 255, blue: 0x9D / 255)
private let gray100 = Color(red: 0xD0 / 255, green: 0xD3 / 255, blue: 0xD9 / 255)

private func formatDuration(_ seconds: TimeInterval) -> String {
  let totalMinutes = Int(seconds / 60)
  let hours = totalMinutes / 60
  let minutes = totalMinutes % 60
  if hours == 0 { return "\(minutes)분" }
  if minutes == 0 { return "\(hours)시간" }
  return "\(hours)시간 \(minutes)분"
}

struct TotalActivityView: View {
  let data: TotalActivityData

  var body: some View {
    VStack(alignment: .leading, spacing: 16) {
      Text("오늘 \(formatDuration(data.totalDuration)) 사용")
        .font(.system(size: 20, weight: .bold))
        .foregroundColor(gray800)

      if data.apps.isEmpty {
        Text("아직 기록된 사용 시간이 없어요.")
          .font(.system(size: 14))
          .foregroundColor(gray400)
      } else {
        VStack(spacing: 0) {
          ForEach(Array(data.apps.enumerated()), id: \.element.id) { index, app in
            if index > 0 {
              Divider().background(gray100)
            }
            HStack {
              Label(app.id)
                .labelStyle(.titleAndIcon)
                .font(.system(size: 15))
                .foregroundColor(gray800)
              Spacer()
              Text(formatDuration(app.duration))
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(gray800)
            }
            .padding(.vertical, 10)
          }
        }
      }
    }
    .padding(16)
    .background(green50)
    .cornerRadius(16)
  }
}
