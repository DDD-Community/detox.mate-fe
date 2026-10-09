//
//  AppRowView.swift
//  DeviceActivityReportExtension
//

import DeviceActivity
import SwiftUI

/// my-lock-status 리스트 한 줄(피그마 Row, 높이 68). selectionTokens로 앱 하나만 넘겨받는
/// 전제라 apps.first만 쓴다. 이름 아래 "N회 해제" 자리(20pt)는 RN이 위에 얹어 그리므로 비워둔다.
struct AppRowView: View {
  let data: TotalActivityData

  var body: some View {
    HStack(spacing: 8) {
      if let app = data.apps.first {
        AppIconView(token: app.id, size: 44)
        VStack(alignment: .leading, spacing: 0) {
          Label(app.id)
            .labelStyle(.titleOnly)
            .font(.system(size: 16))
            .foregroundColor(.black)
            .frame(height: 22, alignment: .leading)
          Color.clear.frame(height: 20)
        }
        Spacer()
        Text("\(formatUsageDuration(app.duration)) 사용")
          .font(.system(size: 16))
          .foregroundColor(detoxGray800)
      } else {
        Text("불러오는 중…")
          .font(.system(size: 14))
          .foregroundColor(.gray)
        Spacer()
      }
      Image(systemName: "chevron.right")
        .font(.system(size: 14, weight: .semibold))
        .foregroundColor(Color(red: 0x3C / 255, green: 0x3C / 255, blue: 0x43 / 255).opacity(0.3))
        .padding(.leading, 8)
    }
    .padding(.horizontal, 16)
  }
}
