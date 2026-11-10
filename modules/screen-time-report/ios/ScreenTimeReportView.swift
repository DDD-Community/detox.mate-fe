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
  static let appHero = Self("DetoxAppHero")
  static let appPercent = Self("DetoxAppPercent")
  static let usageBar = Self("DetoxUsageBar")
  static let overLimitNotice = Self("DetoxOverLimitNotice")
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
  case nameCenter
  case usageBar
  case overLimitNotice

  /// 앱 표시용 스타일은 메인 앱에서 라벨과 사용량 리포트를 조합한다(nil).
  @available(iOS 16.0, *)
  var context: DeviceActivityReport.Context? {
    switch self {
    case .total: return .totalActivity
    case .summary: return .usageSummary
    case .breakdown: return .appBreakdown
    case .percent: return .appPercent
    case .appRow, .headerLabel, .hero, .nameCenter: return nil
    case .usageBar: return .usageBar
    case .overLimitNotice: return .overLimitNotice
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

// 리포트 익스텐션이 앱 그룹에 남긴 "앱별 오늘 사용 시간"을 읽어, 익스텐션이 그리기 전까지 직전 값을
// 먼저 보여 준다. 쓰는 쪽은 targets/DeviceActivityReportExtension/TotalActivityReportScene.swift이고
// 키 구조와 날짜 형식이 같아야 한다. 값이 없거나 오늘 것이 아니면 아무것도 덮지 않는다.
private let usageCacheKey = "detox.usageCache"
private let usageCacheUpdatedNotification = "detox.usageCache.updated"
// 익스텐션이 값을 못 써 주는 환경에서도 직전 값이 실제 리포트를 가리지 않도록 덮는 최대 시간.
private let usageCacheMaxCoverSeconds: UInt64 = 4

private func usageCacheDayKey(_ date: Date) -> String {
  let parts = Calendar.current.dateComponents([.year, .month, .day], from: date)
  return String(format: "%04d-%02d-%02d", parts.year ?? 0, parts.month ?? 0, parts.day ?? 0)
}

@available(iOS 15.0, *)
private func usageCacheKeys(for selection: FamilyActivitySelection) -> [String] {
  selection.applicationTokens.compactMap { token in
    guard let data = try? JSONEncoder().encode(token) else { return nil }
    var hash: UInt64 = 5381
    for byte in data { hash = (hash &* 33) &+ UInt64(byte) }
    return String(hash, radix: 16)
  }
}

private func readUsageCache(keys: [String]) -> (seconds: TimeInterval, writtenAt: TimeInterval)? {
  guard
    let group = Bundle.main.object(forInfoDictionaryKey: "REACT_NATIVE_DEVICE_ACTIVITY_APP_GROUP")
      as? String,
    let cache = UserDefaults(suiteName: group)?.dictionary(forKey: usageCacheKey)
  else { return nil }
  let today = usageCacheDayKey(Date())
  var seconds: TimeInterval = 0
  var latestWrite: TimeInterval = 0
  var found = false
  for key in keys {
    guard let entry = cache[key] as? [String: Any], entry["day"] as? String == today,
      let value = entry["seconds"] as? Double
    else { continue }
    seconds += value
    latestWrite = max(latestWrite, entry["writtenAt"] as? Double ?? 0)
    found = true
  }
  return found ? (seconds, latestWrite) : nil
}

private func cachedDurationText(_ seconds: TimeInterval, summary: Bool) -> String {
  let totalMinutes = Int(seconds / 60)
  let hours = totalMinutes / 60
  let minutes = totalMinutes % 60
  let duration: String
  if hours == 0 {
    duration = "\(minutes)분"
  } else if minutes == 0 {
    duration = "\(hours)시간"
  } else {
    duration = "\(hours)시간 \(minutes)분"
  }
  return "\(duration) 사용"
}

/// 익스텐션이 값을 새로 써 줬다는 Darwin 알림을 받아 뷰를 갱신한다.
private final class UsageCacheObserver: ObservableObject {
  @Published var tick = 0

  init() {
    CFNotificationCenterAddObserver(
      CFNotificationCenterGetDarwinNotifyCenter(),
      Unmanaged.passUnretained(self).toOpaque(),
      { _, observer, _, _, _ in
        guard let observer else { return }
        let me = Unmanaged<UsageCacheObserver>.fromOpaque(observer).takeUnretainedValue()
        DispatchQueue.main.async { me.tick += 1 }
      },
      usageCacheUpdatedNotification as CFString,
      nil,
      .deliverImmediately
    )
  }

  deinit {
    CFNotificationCenterRemoveObserver(
      CFNotificationCenterGetDarwinNotifyCenter(),
      Unmanaged.passUnretained(self).toOpaque(),
      CFNotificationName(usageCacheUpdatedNotification as CFString),
      nil
    )
  }
}

/// 실제 리포트 위에 직전 사용 시간을 하얀 배경으로 덮어 두었다가, 익스텐션이 새 값을 쓰면 걷어낸다.
@available(iOS 16.0, *)
private struct CachedUsageOverlay: View {
  let keys: [String]
  let fontSize: CGFloat
  let weight: Font.Weight
  let color: Color
  let alignment: Alignment

  @StateObject private var observer = UsageCacheObserver()
  @State private var appearedAt = Date().timeIntervalSince1970
  @State private var dismissed = false

  var body: some View {
    Group {
      if !dismissed, let cached = readUsageCache(keys: keys) {
        Text(cachedDurationText(cached.seconds, summary: false))
          .font(.system(size: fontSize, weight: weight))
          .foregroundColor(color)
          .lineLimit(1)
          .minimumScaleFactor(0.8)
          .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: alignment)
          .background(Color.white)
      }
    }
    .onChange(of: observer.tick) { _ in
      if let cached = readUsageCache(keys: keys), cached.writtenAt >= appearedAt { dismissed = true }
    }
    .task {
      try? await Task.sleep(nanoseconds: usageCacheMaxCoverSeconds * 1_000_000_000)
      dismissed = true
    }
  }
}

/// 선택 토큰으로 앱 정보를 표시한다. 사용 기록의 유무와 집계를 기다리지 않는다.
@available(iOS 16.0, *)
private struct SelectedActivityLabel: View {
  let selection: FamilyActivitySelection

  var body: some View {
    if let token = selection.applicationTokens.first {
      Label(token)
    } else if let token = selection.categoryTokens.first {
      Label(token)
    } else if let token = selection.webDomainTokens.first {
      Label(token)
    }
  }
}

@available(iOS 16.0, *)
private struct SelectedActivityIcon: View {
  let selection: FamilyActivitySelection
  let size: CGFloat

  var body: some View {
    SelectedActivityLabel(selection: selection)
      .labelStyle(.iconOnly)
      .scaleEffect(size / 28)
      .frame(width: size, height: size)
      .clipShape(RoundedRectangle(cornerRadius: size * 0.25, style: .continuous))
  }
}

@available(iOS 16.0, *)
private struct ScreenTimeContentView: View {
  let selection: FamilyActivitySelection
  let reportStyle: ReportStyle
  let filter: DeviceActivityFilter

  private let gray800 = Color(red: 0x38 / 255, green: 0x3E / 255, blue: 0x49 / 255)

  var body: some View {
    switch reportStyle {
    case .appRow:
      HStack(spacing: 8) {
        SelectedActivityIcon(selection: selection, size: 44)
        VStack(alignment: .leading, spacing: 0) {
          SelectedActivityLabel(selection: selection)
            .labelStyle(.titleOnly)
            .font(.system(size: 16))
            .foregroundColor(.black)
            .frame(height: 22, alignment: .leading)
          // 이름 아래 해제 횟수는 React Native가 그린다.
          Color.clear.frame(height: 20)
        }
        Spacer(minLength: 0)
        DeviceActivityReport(.appRow, filter: filter)
          .frame(width: 120, height: 22)
          .overlay(
            CachedUsageOverlay(
              keys: usageCacheKeys(for: selection), fontSize: 16, weight: .regular,
              color: gray800, alignment: .trailing))
        Image(systemName: "chevron.right")
          .font(.system(size: 14, weight: .semibold))
          .foregroundColor(Color(red: 0x3C / 255, green: 0x3C / 255, blue: 0x43 / 255).opacity(0.3))
          .padding(.leading, 8)
      }
      .padding(.horizontal, 16)
    case .headerLabel:
      HStack {
        SelectedActivityLabel(selection: selection)
          .labelStyle(.titleAndIcon)
          .font(.system(size: 20, weight: .medium))
          .foregroundColor(gray800)
        Spacer()
      }
      .padding(.leading, 8)
    case .hero:
      VStack(spacing: 0) {
        SelectedActivityIcon(selection: selection, size: 83)
        SelectedActivityLabel(selection: selection)
          .labelStyle(.titleOnly)
          .font(.system(size: 16, weight: .medium))
          .foregroundColor(gray800)
          .frame(maxWidth: .infinity, alignment: .leading)
          .frame(height: 26)
          .padding(.top, 12)
        DeviceActivityReport(.appHero, filter: filter)
          .frame(height: 32)
          .padding(.top, 4)
      }
      .frame(maxWidth: .infinity)
    case .nameCenter:
      SelectedActivityLabel(selection: selection)
        .labelStyle(.titleOnly)
        .font(.system(size: 24))
        .foregroundColor(gray800)
        .multilineTextAlignment(.center)
        .frame(maxWidth: .infinity, alignment: .center)
    default:
      if let context = reportStyle.context {
        DeviceActivityReport(context, filter: filter)
          .overlay(
            Group {
              if reportStyle == .summary {
                CachedUsageOverlay(
                  keys: usageCacheKeys(for: selection), fontSize: 24, weight: .medium,
                  color: .black, alignment: .leading)
              }
            })
      }
    }
  }
}

class ScreenTimeReportNativeView: ExpoView {
  private var hostingController: UIViewController?
  private var renderedTokens: [String]?
  private var renderedStyle: ReportStyle?
  private var renderedDay: Date?

  var selectionTokens: [String] = []
  var reportStyle: ReportStyle = .total

  required init(appContext: AppContext? = nil) {
    super.init(appContext: appContext)
    clipsToBounds = true
  }

  // Expo가 모든 prop을 적용한 뒤 한 번만 반영한다. 같은 입력이면 시스템 라벨도 유지한다.
  func updateReport() {
    guard #available(iOS 16.0, *) else { return }
    let day = Calendar.current.startOfDay(for: .now)
    guard selectionTokens != renderedTokens || reportStyle != renderedStyle || day != renderedDay
    else { return }

    let selection = decodeSelection(from: selectionTokens)
    let filter = DeviceActivityFilter(
      segment: .daily(during: Calendar.current.dateInterval(of: .day, for: day)!),
      users: .all,
      devices: .init([.iPhone]),
      applications: selection.applicationTokens,
      categories: selection.categoryTokens,
      webDomains: selection.webDomainTokens
    )
    let content = ScreenTimeContentView(
      selection: selection, reportStyle: reportStyle, filter: filter)

    if let controller = hostingController as? UIHostingController<ScreenTimeContentView> {
      controller.rootView = content
    } else {
      let controller = UIHostingController(rootView: content)
      controller.view.translatesAutoresizingMaskIntoConstraints = false
      controller.view.backgroundColor = .clear
      controller.view.clipsToBounds = true
      hostingController = controller
      addSubview(controller.view)
      NSLayoutConstraint.activate([
        controller.view.topAnchor.constraint(equalTo: topAnchor),
        controller.view.bottomAnchor.constraint(equalTo: bottomAnchor),
        controller.view.leadingAnchor.constraint(equalTo: leadingAnchor),
        controller.view.trailingAnchor.constraint(equalTo: trailingAnchor),
      ])
      attachHostingController()
    }
    renderedTokens = selectionTokens
    renderedStyle = reportStyle
    renderedDay = day
  }

  override func didMoveToWindow() {
    super.didMoveToWindow()
    if window != nil {
      if renderedTokens != nil { updateReport() }
      attachHostingController()
    } else if let controller = hostingController, controller.parent != nil {
      controller.willMove(toParent: nil)
      controller.removeFromParent()
    }
  }

  private func attachHostingController() {
    guard window != nil, let controller = hostingController, controller.parent == nil else {
      return
    }
    var responder: UIResponder? = next
    while let current = responder {
      if let parent = current as? UIViewController {
        parent.addChild(controller)
        controller.didMove(toParent: parent)
        return
      }
      responder = current.next
    }
  }
}
