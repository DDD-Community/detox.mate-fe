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

// 익스텐션(DeviceActivityReportExtension.swift 등)에 정의된 것과 반드시 같은 raw value여야
// 한다. DeviceActivityReport 타입 자체가 iOS 16+ 전용이라(DeviceActivity 프레임워크의 다른
// API는 대부분 15+), 여기만 16.0으로 가드한다.
@available(iOS 16.0, *)
extension DeviceActivityReport.Context {
  static let totalActivity = Self("DetoxTotalActivity")
  static let usageSummary = Self("DetoxUsageSummary")
  static let appRow = Self("DetoxAppRow")
  static let appBreakdown = Self("DetoxAppBreakdown")
  static let appHeaderLabel = Self("DetoxAppHeaderLabel")
  static let appHero = Self("DetoxAppHero")
  static let appPercent = Self("DetoxAppPercent")
  static let showcase = Self("DetoxShowcase")
  static let usageBar = Self("DetoxUsageBar")
}

/// JS의 `reportStyle` prop과 1:1로 매핑된다.
enum ReportStyle: String {
  case total
  case summary
  case appRow
  case breakdown
  case headerLabel
  case hero
  case percent
  case showcase
  case nameCenter
  case usageBar

  /// nameCenter는 익스텐션을 거치지 않고 메인 앱에서 직접 그린다(nil).
  @available(iOS 16.0, *)
  var context: DeviceActivityReport.Context? {
    switch self {
    case .total: return .totalActivity
    case .summary: return .usageSummary
    case .appRow: return .appRow
    case .breakdown: return .appBreakdown
    case .headerLabel: return .appHeaderLabel
    case .hero: return .appHero
    case .percent: return .appPercent
    case .showcase: return .showcase
    case .nameCenter: return nil
    case .usageBar: return .usageBar
    }
  }
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

/// 해제 시간 설정 화면 제목 첫 줄 앱 이름(피그마 title3 24/Regular). 앱 이름은
/// Label(token)으로만 그릴 수 있는데, 메인 앱에서도 그릴 수 있어서 리포트 익스텐션(사용 기록
/// 집계가 끝나야 뜨고, 오늘 기록이 없는 앱은 안 뜬다)을 거치지 않고 바로 그린다.
@available(iOS 16.0, *)
struct HostAppNameView: View {
  let token: ApplicationToken

  var body: some View {
    // 가운데 정렬: Label(token)의 제목 뷰는 글자 폭을 레이아웃에 알려주지 않아서(fixedSize()를 걸면
    // 폭이 실제보다 작게 잡혀 글자가 잘렸다) 폭을 줄이는 방식은 못 쓴다. 대신 뷰 전체 폭을 유지한 채
    // 텍스트 정렬만 가운데로 지정한다 — 이 속성이 이 뷰에 먹히지 않으면 왼쪽 정렬로 보일 뿐 잘리진 않는다.
    Label(token)
      .labelStyle(.titleOnly)
      .font(.system(size: 24))
      .foregroundColor(Color(red: 0x38 / 255, green: 0x3E / 255, blue: 0x49 / 255))
      .multilineTextAlignment(.center)
      .frame(maxWidth: .infinity, alignment: .center)
  }
}

class ScreenTimeReportNativeView: ExpoView {
  private var hostingController: UIViewController?

  var selectionTokens: [String] = [] {
    didSet { updateReport() }
  }

  var reportStyle: ReportStyle = .total {
    didSet { updateReport() }
  }

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    // DeviceActivityReport 내부 콘텐츠가 우리가 RN에서 잡아준 높이보다 커지면(시스템이
    // 자체적으로 여백/리스트 스타일을 덧붙이는 경우가 있다), 잘라내지 않으면 바로 위/아래
    // RN 요소 위로 글자가 번져 보인다. 무조건 이 뷰 경계 안으로만 그리게 강제한다.
    clipsToBounds = true
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
    let controller: UIHostingController<AnyView>
    if let context = reportStyle.context {
      controller = UIHostingController(
        rootView: AnyView(DeviceActivityReport(context, filter: filter)))
    } else if let token = selection.applicationTokens.first {
      controller = UIHostingController(rootView: AnyView(HostAppNameView(token: token)))
    } else {
      return
    }

    controller.view.translatesAutoresizingMaskIntoConstraints = false
    controller.view.backgroundColor = .clear
    controller.view.clipsToBounds = true
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
