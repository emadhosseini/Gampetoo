import Foundation

#if canImport(ActivityKit)
import ActivityKit

@available(iOS 16.2, *)
public struct GampetooRestTimerAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var endAt: Date
        public var totalSeconds: Int

        public init(endAt: Date, totalSeconds: Int) {
            self.endAt = endAt
            self.totalSeconds = totalSeconds
        }
    }

    public var exerciseName: String

    public init(exerciseName: String) {
        self.exerciseName = exerciseName
    }
}
#endif
