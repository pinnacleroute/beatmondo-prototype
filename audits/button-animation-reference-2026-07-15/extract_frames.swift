import AppKit
import AVFoundation

guard CommandLine.arguments.count == 3 else {
  fputs("Usage: extract_frames <video> <output-directory>\n", stderr)
  exit(1)
}

let videoURL = URL(fileURLWithPath: CommandLine.arguments[1])
let outputURL = URL(fileURLWithPath: CommandLine.arguments[2], isDirectory: true)
try FileManager.default.createDirectory(at: outputURL, withIntermediateDirectories: true)

let asset = AVURLAsset(url: videoURL)
let generator = AVAssetImageGenerator(asset: asset)
generator.appliesPreferredTrackTransform = true
generator.requestedTimeToleranceBefore = .zero
generator.requestedTimeToleranceAfter = .zero

let sampleTimes: [Double] = [0.0, 1.0, 2.0, 3.0, 4.0, 5.0, 6.0, 7.0, 8.0, 9.0]

for (index, seconds) in sampleTimes.enumerated() {
  let requestedTime = CMTime(seconds: seconds, preferredTimescale: 600)
  let image = try generator.copyCGImage(at: requestedTime, actualTime: nil)
  let bitmap = NSBitmapImageRep(cgImage: image)
  guard let png = bitmap.representation(using: .png, properties: [:]) else {
    throw NSError(domain: "FrameExtraction", code: 2)
  }
  let filename = String(format: "%02d-%04.1fs.png", index + 1, seconds)
  try png.write(to: outputURL.appendingPathComponent(filename))
}
