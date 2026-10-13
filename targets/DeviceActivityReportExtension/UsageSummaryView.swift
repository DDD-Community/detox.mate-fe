//
//  UsageSummaryView.swift
//  DeviceActivityReportExtension
//

import SwiftUI

private func formatSummaryDuration(_ seconds: TimeInterval) -> String {
  let totalMinutes = Int(seconds / 60)
  let hours = totalMinutes / 60
  let minutes = totalMinutes % 60
  if hours == 0 { return "\(minutes)분 사용" }
  if minutes == 0 { return "\(hours)시간 사용" }
  return "\(hours)시간 \(minutes)분 사용"
}

struct UsageSummaryView: View {
  let data: TotalActivityData

  var body: some View {
    // 왼쪽 정렬(피그마). Text만 두면 리포트 뷰 안에서 가운데로 놓인다.
    HStack {
      Text(formatSummaryDuration(data.totalDuration))
        .font(.system(size: 24, weight: .medium))
        .foregroundColor(.black)
      Spacer(minLength: 0)
    }
  }
}
