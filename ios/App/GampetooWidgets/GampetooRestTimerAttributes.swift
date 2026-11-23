import Foundation

#if canImport(ActivityKit)
import ActivityKit

@available(iOS 16.2, *)
public struct GampetooRestTimerAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var workoutTitle: String
        public var exerciseName: String
        public var completedSets: Int
        public var totalSets: Int
        public var completedExercises: Int
        public var totalExercises: Int
        public var isResting: Bool
        public var endAt: Date
        public var totalSeconds: Int

        public init(
            workoutTitle: String,
            exerciseName: String,
            completedSets: Int,
            totalSets: Int,
            completedExercises: Int,
            totalExercises: Int,
            isResting: Bool,
            endAt: Date,
            totalSeconds: Int
        ) {
            self.workoutTitle = workoutTitle
            self.exerciseName = exerciseName
            self.completedSets = completedSets
            self.totalSets = totalSets
            self.completedExercises = completedExercises
            self.totalExercises = totalExercises
            self.isResting = isResting
            self.endAt = endAt
            self.totalSeconds = totalSeconds
        }
    }

    public var sessionId: String

    public init(sessionId: String = "today") {
        self.sessionId = sessionId
    }
}
#endif
