//
//  ScreenTimeReportView.swift
//  ScreenTimeReport
//
//  DeviceActivityReportExtension(targets/DeviceActivityReportExtension)이 그리는
//  네이티브 화면을 React Native 컴포넌트처럼 끼워 넣기 위한 래퍼.
//
//  `selectionTokens`는 JS 쪽 lockStore.familyActivitySelectionsByAppId 값들
//  (base64 인코딩된 FamilyActivitySelection)을 그대로 전달받는다 — 실제 사용시간
//  숫자 자체는 이 뷰가 아니라 익스텐션 프로세스 안에서만 계산되고 그려진다.
//

import DeviceActivity
import ExpoModulesCore
import FamilyControls
import ManagedSettings
import SwiftUI

// 익스텐션(DeviceActivityReportExtension.swift)에 정의된 것과 반드시 같은 raw value여야 한다.
// DeviceActivityReport 타입 자체가 iOS 16+ 전용이라(DeviceActivity 프레임워크의 다른
// API는 대부분 15+), 여기만 16.0으로 가드한다.
@available(iOS 16.0, *)
extension DeviceActivityReport.Context {
  static let totalActivity = Self("DetoxTotalActivity")
}

@available(iOS 15.0, *)
private func decodeSelection(from tokens: [String]) -> FamilyActivitySelection {
  var combined = FamilyActivitySelection()
  let decoder = JSONDecoder()

  for tokenString in tokens {
    guard let data = Data(base64Encoded: tokenString) else { continue }
    guard let selection = try? decoder.decode(FamilyActivitySelection.self, from: data) else {
      continue
    }
    combined.applicationTokens.formUnion(selection.applicationTokens)
    combined.categoryTokens.formUnion(selection.categoryTokens)
    combined.webDomainTokens.formUnion(selection.webDomainTokens)
  }

  return combined
}

class ScreenTimeReportNativeView: ExpoView {
  private var hostingController: UIViewController?

  var selectionTokens: [String] = [] {
    didSet { updateReport() }
  }

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
  }

  private func updateReport() {
    guard #available(iOS 16.0, *) else { return }

    hostingController?.view.removeFromSuperview()

    let selection = decodeSelection(from: selectionTokens)
    let filter = DeviceActivityFilter(
      segment: .daily(during: Calendar.current.dateInterval(of: .day, for: .now)!),
      users: .all,
      devices: .init([.iPhone]),
      applications: selection.applicationTokens,
      categories: selection.categoryTokens,
      webDomains: selection.webDomainTokens
    )
    let report = DeviceActivityReport(.totalActivity, filter: filter)
    let controller = UIHostingController(rootView: report)

    controller.view.translatesAutoresizingMaskIntoConstraints = false
    controller.view.backgroundColor = .clear
    addSubview(controller.view)
    NSLayoutConstraint.activate([
      controller.view.topAnchor.constraint(equalTo: topAnchor),
      controller.view.bottomAnchor.constraint(equalTo: bottomAnchor),
      controller.view.leadingAnchor.constraint(equalTo: leadingAnchor),
      controller.view.trailingAnchor.constraint(equalTo: trailingAnchor),
    ])
    hostingController = controller
  }
}
