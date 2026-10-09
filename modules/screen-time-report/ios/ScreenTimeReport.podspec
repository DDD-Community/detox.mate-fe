Pod::Spec.new do |s|
  s.name           = 'ScreenTimeReport'
  s.version        = '1.0.0'
  s.summary        = '선택한 앱들의 실제 스크린타임을 보여주는 네이티브 뷰 (DeviceActivityReport 래핑)'
  s.description    = '선택한 앱들의 실제 스크린타임을 보여주는 네이티브 뷰 (DeviceActivityReport 래핑)'
  s.author         = ''
  s.homepage       = 'https://docs.expo.dev/modules/'
  s.platforms      = {
    :ios => '15.1'
  }
  s.source         = { git: '' }
  s.static_framework = true

  s.dependency 'ExpoModulesCore'

  s.pod_target_xcconfig = {
    'DEFINES_MODULE' => 'YES',
  }

  s.source_files = "**/*.{h,m,mm,swift,hpp,cpp}"
end
