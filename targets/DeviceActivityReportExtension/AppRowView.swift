import SwiftUI

/// 행의 아이콘과 이름은 메인 앱이 표시하고, 이 리포트는 사용량만 그린다.
struct AppRowView: View {
  let data: TotalActivityData

  var body: some View {
    Text(data.apps.isEmpty ? "기록 없음" : "\(formatUsageDuration(data.totalDuration)) 사용")
      .font(.system(size: 16))
      .foregroundColor(detoxGray800)
      .lineLimit(1)
      .minimumScaleFactor(0.8)
      .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .trailing)
  }
}
