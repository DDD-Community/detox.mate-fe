//
//  DeviceActivityReportExtension.swift
//  DeviceActivityReportExtension
//
//  선택된 앱들의 실제 스크린타임(정확한 분 단위)을 보여주는 화면.
//  이 코드는 메인 앱과 완전히 분리된 프로세스(익스텐션)에서 실행된다 — Apple이
//  개인정보 보호 때문에 이 데이터를 메인 앱(React Native 쪽)으로는 절대 못 넘기게
//  막아놔서, 화면 자체를 여기서 그린다. 대신 색/레이아웃은 우리 마음대로 커스텀 가능하다.
//

import DeviceActivity
import SwiftUI

extension DeviceActivityReport.Context {
  static let totalActivity = Self("DetoxTotalActivity")
}

@main
struct DetoxDeviceActivityReportExtension: DeviceActivityReportExtension {
  var body: some DeviceActivityReportScene {
    TotalActivityReportScene()
    SummaryReportScene()
    AppRowReportScene()
    BreakdownReportScene()
    HeaderLabelReportScene()
    AppHeroReportScene()
    AppPercentReportScene()
    ShowcaseReportScene()
    UsageBarReportScene()
  }
}
