import ExpoModulesCore
import UIKit

public class ScreenTimeReportModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ScreenTimeReport")

    View(ScreenTimeReportNativeView.self) {
      Prop("selectionTokens") { (view: ScreenTimeReportNativeView, tokens: [String]) in
        view.selectionTokens = tokens
      }
    }

    // iOS는 앱이 스스로 프로세스를 종료(exit)하는 걸 허용하지 않는다(애플 심사 가이드라인 위반).
    // 대신 홈 버튼을 누른 것처럼 백그라운드로 내려보내는, 앱들이 흔히 쓰는 방식으로 대체한다.
    Function("minimizeApp") {
      UIControl().sendAction(#selector(NSXPCConnection.suspend), to: UIApplication.shared, for: nil)
    }
  }
}
