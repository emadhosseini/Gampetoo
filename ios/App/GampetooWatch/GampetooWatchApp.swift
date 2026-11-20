import Foundation
import SwiftUI
import WatchConnectivity
import WatchKit

struct WatchExerciseItem: Identifiable, Codable, Hashable {
    var id: String
    var name: String
    var sets: Int
    var reps: Int
    var completedSets: Int
}

struct WatchDailyState: Codable {
    var date: String
    var workoutTitle: String
    var workoutActivity: String
    var workoutCompleted: Bool
    var caloriesConsumed: Int
    var caloriesTarget: Int
    var proteinGrams: Int
    var proteinTarget: Int
    var waterGlasses: Int
    var waterGoal: Int
    var restSeconds: Int
    var exercises: [WatchExerciseItem]

    static let empty = WatchDailyState(
        date: "",
        workoutTitle: "برنامه امروز",
        workoutActivity: "workout",
        workoutCompleted: false,
        caloriesConsumed: 0,
        caloriesTarget: 2200,
        proteinGrams: 0,
        proteinTarget: 150,
        waterGlasses: 0,
        waterGoal: 8,
        restSeconds: 90,
        exercises: []
    )
}

final class GampetooWatchStore: NSObject, ObservableObject {
    @Published var state: WatchDailyState = .empty
    @Published var restEndAt: Date?
    @Published var restExerciseName: String = ""
    @Published var restSecondsLeft: Int = 0
    @Published var isReachable: Bool = false

    private let cacheKey = "gampetoo_watch_state_v1"
    private var restTimer: Timer?

    override init() {
        super.init()
        loadCache()
        activateSession()
    }

    private func loadCache() {
        if let data = UserDefaults.standard.data(forKey: cacheKey),
           let decoded = try? JSONDecoder().decode(WatchDailyState.self, from: data) {
            state = decoded
        }
    }

    private func saveCache() {
        if let data = try? JSONEncoder().encode(state) {
            UserDefaults.standard.set(data, forKey: cacheKey)
        }
    }

    private func activateSession() {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        session.delegate = self
        session.activate()
    }

    func requestRefresh() {
        sendAction(["type": "requestRefresh"])
    }

    func addWaterGlass() {
        WKInterfaceDevice.current().play(.click)
        state.waterGlasses += 1
        saveCache()
        sendAction([
            "type": "logWater",
            "glasses": 1,
            "timestamp": Date().timeIntervalSince1970,
        ])
    }

    func logExerciseSet(_ exercise: WatchExerciseItem) {
        WKInterfaceDevice.current().play(.success)

        if let idx = state.exercises.firstIndex(where: { $0.id == exercise.id }) {
            state.exercises[idx].completedSets += 1
            saveCache()
        }

        startRestTimer(seconds: max(15, state.restSeconds), exerciseName: exercise.name)

        sendAction([
            "type": "completeSet",
            "exerciseId": exercise.id,
            "timestamp": Date().timeIntervalSince1970,
        ])
    }

    func completeTodayWorkout() {
        WKInterfaceDevice.current().play(.success)
        state.workoutCompleted = true
        stopRestTimer()
        saveCache()
        sendAction([
            "type": "completeWorkout",
            "timestamp": Date().timeIntervalSince1970,
        ])
    }

    func startRestTimer(seconds: Int, exerciseName: String) {
        restTimer?.invalidate()
        restExerciseName = exerciseName
        restEndAt = Date().addingTimeInterval(TimeInterval(seconds))
        restSecondsLeft = seconds

        restTimer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { [weak self] _ in
            guard let self = self, let endAt = self.restEndAt else { return }
            let remaining = Int(ceil(endAt.timeIntervalSinceNow))
            if remaining <= 0 {
                WKInterfaceDevice.current().play(.notification)
                self.stopRestTimer()
            } else {
                self.restSecondsLeft = remaining
            }
        }
    }

    func stopRestTimer() {
        restTimer?.invalidate()
        restTimer = nil
        restEndAt = nil
        restSecondsLeft = 0
    }

    private func sendAction(_ payload: [String: Any]) {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        guard session.activationState == .activated else { return }

        if session.isReachable {
            session.sendMessage(payload, replyHandler: { [weak self] reply in
                self?.applyIncoming(reply)
            }, errorHandler: { _ in
                session.transferUserInfo(payload)
            })
        } else {
            session.transferUserInfo(payload)
        }
    }

    private func applyIncoming(_ dict: [String: Any]) {
        guard dict["workoutTitle"] != nil || dict["waterGlasses"] != nil else { return }

        var next = state
        if let date = dict["date"] as? String { next.date = date }
        if let title = dict["workoutTitle"] as? String { next.workoutTitle = title }
        if let activity = dict["workoutActivity"] as? String { next.workoutActivity = activity }
        if let completed = dict["workoutCompleted"] as? Bool { next.workoutCompleted = completed }
        if let c = dict["caloriesConsumed"] as? Int { next.caloriesConsumed = c }
        if let ct = dict["caloriesTarget"] as? Int { next.caloriesTarget = ct }
        if let p = dict["proteinGrams"] as? Int { next.proteinGrams = p }
        if let pt = dict["proteinTarget"] as? Int { next.proteinTarget = pt }
        if let w = dict["waterGlasses"] as? Int { next.waterGlasses = w }
        if let wg = dict["waterGoal"] as? Int { next.waterGoal = wg }
        if let rs = dict["restSeconds"] as? Int, rs > 0 { next.restSeconds = rs }

        if let rawExercises = dict["exercises"] as? [[String: Any]] {
            next.exercises = rawExercises.compactMap { item in
                guard let id = item["id"] as? String,
                      let name = item["name"] as? String else { return nil }
                return WatchExerciseItem(
                    id: id,
                    name: name,
                    sets: item["sets"] as? Int ?? 3,
                    reps: item["reps"] as? Int ?? 10,
                    completedSets: item["completedSets"] as? Int ?? 0
                )
            }
        }

        DispatchQueue.main.async {
            self.state = next
            self.saveCache()
        }
    }
}

extension GampetooWatchStore: WCSessionDelegate {
    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {
        DispatchQueue.main.async {
            self.isReachable = session.isReachable
        }
        if !session.receivedApplicationContext.isEmpty {
            applyIncoming(session.receivedApplicationContext)
        }
        requestRefresh()
    }

    func sessionReachabilityDidChange(_ session: WCSession) {
        DispatchQueue.main.async {
            self.isReachable = session.isReachable
        }
    }

    func session(_ session: WCSession, didReceiveApplicationContext applicationContext: [String: Any]) {
        applyIncoming(applicationContext)
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        applyIncoming(message)
    }
}

@main
struct GampetooWatchApp: App {
    @StateObject private var store = GampetooWatchStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
                .environment(\.layoutDirection, .rightToLeft)
        }
    }
}
