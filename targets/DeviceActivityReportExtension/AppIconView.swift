//
//  AppIconView.swift
//  DeviceActivityReportExtension
//
//  앱 아이콘/이름은 토큰으로만 그릴 수 있다(애플 정책 — JS는 이미지를 받을 수 없다).
//  Label(token)이 그리는 아이콘 크기는 폰트 크기에 묶여 있어 직접 지정이 안 되므로,
//  기본 크기로 그린 뒤 scaleEffect로 원하는 크기에 맞춘다.
//

import FamilyControls
import ManagedSettings
import SwiftUI

let detoxGray800 = Color(red: 0x38 / 255, green: 0x3E / 255, blue: 0x49 / 255)
let detoxGray900 = Color(red: 0x2B / 255, green: 0x2F / 255, blue: 0x38 / 255)

/// Label(token) 아이콘의 기본 한 변(pt). 기기에서 아이콘이 작거나 크게 나오면 이 값만 조정한다.
private let nativeIconPoint: CGFloat = 28

struct AppIconView: View {
  let token: ApplicationToken
  let size: CGFloat

  var body: some View {
    Label(token)
      .labelStyle(.iconOnly)
      .scaleEffect(size / nativeIconPoint)
      .frame(width: size, height: size)
      .clipShape(RoundedRectangle(cornerRadius: size * 0.25, style: .continuous))
  }
}

func formatUsageDuration(_ seconds: TimeInterval) -> String {
  let totalMinutes = Int(seconds / 60)
  let hours = totalMinutes / 60
  let minutes = totalMinutes % 60
  if hours == 0 { return "\(minutes)분" }
  if minutes == 0 { return "\(hours)시간" }
  return "\(hours)시간 \(minutes)분"
}
