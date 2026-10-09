//
//  HeaderLabelView.swift
//  DeviceActivityReportExtension
//
//  앱 상세 화면 헤더에 쓰는 아이콘+이름만 있는 아주 작은 라벨. 실제 앱 이름은
//  애플이 Label(token)로만 보여주게 강제하기 때문에(토큰 자체가 JS에선 무엇인지
//  알 수 없는 암호화 값), 이 작은 네이티브 조각을 헤더 자리에 그대로 끼워 넣는다.
//

import DeviceActivity
import SwiftUI

private let gray800 = Color(red: 0x38 / 255, green: 0x3E / 255, blue: 0x49 / 255)
private let gray400 = Color(red: 0x85 / 255, green: 0x8D / 255, blue: 0x9D / 255)

struct HeaderLabelView: View {
  let data: TotalActivityData

  var body: some View {
    HStack {
      if let app = data.apps.first {
        Label(app.id)
          .labelStyle(.titleAndIcon)
          .font(.system(size: 20, weight: .medium))
          .foregroundColor(gray800)
      } else {
        Text("잠긴 앱")
          .font(.system(size: 20, weight: .medium))
          .foregroundColor(gray400)
      }
      Spacer()
    }
    .padding(.leading, 8)
  }
}
