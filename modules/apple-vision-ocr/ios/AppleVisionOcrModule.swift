import ExpoModulesCore
import ImageIO
import QuartzCore
import Vision

public class AppleVisionOcrModule: Module {
  public func definition() -> ModuleDefinition {
    Name("AppleVisionOcr")

    AsyncFunction("recognizeText") { (uri: String, options: [String: Any]?) async throws -> [String: Any] in
      let startedAt = CACurrentMediaTime()
      let cgImage = try await self.loadCGImage(from: uri)
      let request = VNRecognizeTextRequest()

      if let recognitionLevel = options?["recognitionLevel"] as? String, recognitionLevel == "fast" {
        request.recognitionLevel = .fast
      } else {
        request.recognitionLevel = .accurate
      }

      if let usesLanguageCorrection = options?["usesLanguageCorrection"] as? Bool {
        request.usesLanguageCorrection = usesLanguageCorrection
      } else {
        request.usesLanguageCorrection = false
      }

      if let minimumTextHeight = options?["minimumTextHeight"] as? Double {
        request.minimumTextHeight = Float(minimumTextHeight)
      }

      if let recognitionLanguages = options?["recognitionLanguages"] as? [String], !recognitionLanguages.isEmpty {
        request.recognitionLanguages = recognitionLanguages
      } else {
        request.recognitionLanguages = ["ko-KR", "en-US"]
      }

      let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
      try handler.perform([request])

      let observations = (request.results ?? []).compactMap { observation -> [String: Any]? in
        guard let candidate = observation.topCandidates(1).first else {
          return nil
        }

        let boundingBox = observation.boundingBox
        return [
          "text": candidate.string,
          "confidence": Double(candidate.confidence),
          "boundingBox": [
            "x": boundingBox.origin.x,
            "y": boundingBox.origin.y,
            "width": boundingBox.size.width,
            "height": boundingBox.size.height
          ]
        ]
      }

      let elapsedMs = Int(((CACurrentMediaTime() - startedAt) * 1000.0).rounded())

      return [
        "imageWidth": cgImage.width,
        "imageHeight": cgImage.height,
        "elapsedMs": elapsedMs,
        "observations": observations
      ]
    }
  }

  private func loadCGImage(from uri: String) async throws -> CGImage {
    if let url = URL(string: uri), url.isFileURL {
      return try loadCGImage(fromFileURL: url)
    }

    if uri.hasPrefix("/") {
      return try loadCGImage(fromFileURL: URL(fileURLWithPath: uri))
    }

    guard let url = URL(string: uri) else {
      throw InvalidImageURLError(uri)
    }

    let (data, _) = try await URLSession.shared.data(from: url)
    guard let source = CGImageSourceCreateWithData(data as CFData, nil),
          let cgImage = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
      throw ImageLoadingFailedError(uri)
    }

    return cgImage
  }

  private func loadCGImage(fromFileURL url: URL) throws -> CGImage {
    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
          let cgImage = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
      throw ImageLoadingFailedError(url.absoluteString)
    }

    return cgImage
  }
}

private struct InvalidImageURLError: LocalizedError {
  let uri: String

  init(_ uri: String) {
    self.uri = uri
  }

  var errorDescription: String? {
    "Invalid image uri: \(uri)"
  }
}

private struct ImageLoadingFailedError: LocalizedError {
  let uri: String

  init(_ uri: String) {
    self.uri = uri
  }

  var errorDescription: String? {
    "Failed to load image data from \(uri)"
  }
}
