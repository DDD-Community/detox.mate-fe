import ExpoModulesCore
import FamilyControls
import UIKit

/// 여러 앱이 합쳐진 FamilyActivitySelection 토큰을 "앱 하나짜리 토큰들"로 쪼갠다. 앱 토큰은 JS에선
/// 암호화된 문자열이지만 네이티브에선 applicationTokens 집합이라 하나씩 꺼낼 수 있다. 카테고리와
/// 웹사이트는 그 안의 앱을 꺼낼 수 없어서 합쳐서 토큰 하나(묶음)로 남긴다. 해석에 실패하면 원본을 그대로 돌려준다.
// includeEntireCategory가 iOS 15.2부터라서 함수 전체를 15.2로 가드한다.
@available(iOS 15.2, *)
private func splitFamilyActivitySelection(_ token: String) -> [String] {
  guard let data = Data(base64Encoded: token),
    let selection = try? JSONDecoder().decode(FamilyActivitySelection.self, from: data)
  else {
    return [token]
  }

  let encoder = JSONEncoder()
  func encode(_ selection: FamilyActivitySelection) -> String? {
    (try? encoder.encode(selection))?.base64EncodedString()
  }

  var tokens: [String] = []

  for applicationToken in selection.applicationTokens {
    var single = FamilyActivitySelection(includeEntireCategory: selection.includeEntireCategory)
    single.applicationTokens = [applicationToken]
    if let encoded = encode(single) { tokens.append(encoded) }
  }

  if !selection.categoryTokens.isEmpty || !selection.webDomainTokens.isEmpty {
    var rest = FamilyActivitySelection(includeEntireCategory: selection.includeEntireCategory)
    rest.categoryTokens = selection.categoryTokens
    rest.webDomainTokens = selection.webDomainTokens
    if let encoded = encode(rest) { tokens.append(encoded) }
  }

  return tokens.isEmpty ? [token] : tokens
}

public class ScreenTimeReportModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ScreenTimeReport")

    View(ScreenTimeReportNativeView.self) {
      Prop("selectionTokens") { (view: ScreenTimeReportNativeView, tokens: [String]) in
        view.selectionTokens = tokens
      }
      Prop("reportStyle") { (view: ScreenTimeReportNativeView, style: String) in
        view.reportStyle = ReportStyle(rawValue: style) ?? .total
      }
    }

    // 해제 시간 설정 화면에서 스테퍼 값이 바뀌었음을 리포트 확장에 알린다(값 자체는 JS가 앱 그룹
    // UserDefaults에 먼저 써둔다). 확장은 이 Darwin 알림을 받으면 값을 다시 읽어 막대를 갱신한다.
    Function("notifyUsageBarExtraMinutesChanged") {
      CFNotificationCenterPostNotification(
        CFNotificationCenterGetDarwinNotifyCenter(),
        CFNotificationName("detox.usageBarExtraMinutes.changed" as CFString),
        nil,
        nil,
        true
      )
    }

    Function("splitSelection") { (token: String) -> [String] in
      if #available(iOS 15.2, *) {
        return splitFamilyActivitySelection(token)
      }
      return [token]
    }

    // iOS는 앱이 스스로 프로세스를 종료(exit)하는 걸 허용하지 않는다(애플 심사 가이드라인 위반).
    // 대신 홈 버튼을 누른 것처럼 백그라운드로 내려보내는, 앱들이 흔히 쓰는 방식으로 대체한다.
    Function("minimizeApp") {
      UIControl().sendAction(#selector(NSXPCConnection.suspend), to: UIApplication.shared, for: nil)
    }
  }
}
