import Foundation
import SwiftUI
import UserNotifications
import WatchConnectivity
import WatchKit

#if canImport(WidgetKit)
import WidgetKit
#endif

private let gampetooWatchAppGroupId = "group.com.gampetoo.app"
private let gampetooWatchStateKey = "gampetoo_watch_state_v2"

struct WatchSetEntry: Identifiable, Codable, Hashable {
    var id: String
    var weight: Double
    var reps: Int
    var confirmed: Bool
}

struct WatchExerciseItem: Identifiable, Codable, Hashable {
    var id: String
    var name: String
    var unit: String
    var sets: Int
    var reps: Int
    var completedSets: Int
    var checked: Bool
    var entries: [WatchSetEntry]

    var unitLabel: String {
        switch unit {
        case "seconds": return "ثانیه"
        case "minutes": return "دقیقه"
        default: return "تکرار"
        }
    }

    var isDuration: Bool {
        unit == "seconds" || unit == "minutes"
    }

    var repsStep: Int {
        unit == "seconds" ? 5 : 1
    }

    var totalSetsCount: Int {
        max(entries.count, sets)
    }

    var confirmedSetsCount: Int {
        entries.isEmpty ? completedSets : entries.filter { $0.confirmed }.count
    }
}

struct WatchDailyState: Codable {
    var date: String
    var workoutTitle: String
    var workoutActivity: String
    var workoutCompleted: Bool
    var completedExercises: Int
    var totalExercises: Int
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
        completedExercises: 0,
        totalExercises: 0,
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
    @Published var restTotalSeconds: Int = 90
    @Published var restExerciseName: String = ""
    @Published var restSecondsLeft: Int = 0
    @Published var isReachable: Bool = false

    private var restTimer: Timer?
    private var extendedSession: WKExtendedRuntimeSession?
    private var lastHapticSecond: Int = -1
    private var lastFinishedHapticAt: Date = .distantPast
    private var lastWaterTapAt: Date = .distantPast
    private var lastWorkoutMutationAt: Date = .distantPast
    private var lastRestMutationAt: Date = .distantPast

    override init() {
        super.init()
        UNUserNotificationCenter.current().delegate = self
        loadCache()
        activateSession()
        requestNotificationAuthIfNeeded()
    }

    func handleScenePhaseChange(_ phase: ScenePhase) {
        if phase == .active {
            requestNotificationAuthIfNeeded()
            if let endAt = restEndAt {
                if endAt.timeIntervalSinceNow <= 0 {
                    tickRestTimer()
                } else {
                    ensureExtendedRuntimeSession()
                    tickRestTimer()
                }
            }
        }
    }

    private func sharedDefaults() -> UserDefaults {
        UserDefaults(suiteName: gampetooWatchAppGroupId) ?? UserDefaults.standard
    }

    private func loadCache() {
        let store = sharedDefaults()
        if let data = store.data(forKey: gampetooWatchStateKey)
            ?? UserDefaults.standard.data(forKey: gampetooWatchStateKey),
           let decoded = try? JSONDecoder().decode(WatchDailyState.self, from: data) {
            state = decoded
        }
    }

    private func saveCache() {
        if let data = try? JSONEncoder().encode(state) {
            UserDefaults.standard.set(data, forKey: gampetooWatchStateKey)
            sharedDefaults().set(data, forKey: gampetooWatchStateKey)
        }
        #if canImport(WidgetKit)
        WidgetCenter.shared.reloadAllTimelines()
        #endif
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

    // MARK: - Water

    func addWaterGlass() {
        WKInterfaceDevice.current().play(.click)
        lastWaterTapAt = Date()
        state.waterGlasses += 1
        saveCache()
        sendAction([
            "type": "logWater",
            "glasses": 1,
            "timestamp": Date().timeIntervalSince1970,
        ])
    }

    // MARK: - Workout & Sets

    func exercise(for id: String) -> WatchExerciseItem? {
        state.exercises.first(where: { $0.id == id })
    }

    func updateSet(exerciseId: String, setIndex: Int, weight: Double, reps: Int) {
        guard let exIdx = state.exercises.firstIndex(where: { $0.id == exerciseId }),
              setIndex >= 0, setIndex < state.exercises[exIdx].entries.count else { return }

        let safeWeight = max(0, weight)
        let safeReps = max(0, reps)
        lastWorkoutMutationAt = Date()
        state.exercises[exIdx].entries[setIndex].weight = safeWeight
        state.exercises[exIdx].entries[setIndex].reps = safeReps
        let setId = state.exercises[exIdx].entries[setIndex].id
        saveCache()

        sendAction([
            "type": "updateSet",
            "exerciseId": exerciseId,
            "setId": setId,
            "setIndex": setIndex,
            "weight": safeWeight,
            "reps": safeReps,
            "timestamp": Date().timeIntervalSince1970,
        ])
    }

    func confirmSet(exerciseId: String, setIndex: Int) {
        guard let exIdx = state.exercises.firstIndex(where: { $0.id == exerciseId }) else { return }

        WKInterfaceDevice.current().play(.success)
        lastWorkoutMutationAt = Date()

        var setId = ""
        var weight: Double = 0
        var reps: Int = state.exercises[exIdx].reps

        if setIndex >= 0, setIndex < state.exercises[exIdx].entries.count {
            state.exercises[exIdx].entries[setIndex].confirmed = true
            setId = state.exercises[exIdx].entries[setIndex].id
            weight = state.exercises[exIdx].entries[setIndex].weight
            reps = state.exercises[exIdx].entries[setIndex].reps
        }
        state.exercises[exIdx].completedSets = state.exercises[exIdx].confirmedSetsCount
        let exerciseName = state.exercises[exIdx].name
        saveCache()

        let restDuration = max(15, state.restSeconds)
        let endAt = Date().addingTimeInterval(TimeInterval(restDuration))
        startRestTimer(
            endAt: endAt,
            totalSeconds: restDuration,
            exerciseName: exerciseName,
            broadcastToPhone: false
        )

        sendAction([
            "type": "completeSet",
            "exerciseId": exerciseId,
            "exerciseName": exerciseName,
            "setId": setId,
            "setIndex": setIndex,
            "weight": weight,
            "reps": reps,
            "restEndAtUnix": endAt.timeIntervalSince1970,
            "restTotalSeconds": restDuration,
            "timestamp": Date().timeIntervalSince1970,
        ])
    }

    func addSet(exerciseId: String) {
        guard let exIdx = state.exercises.firstIndex(where: { $0.id == exerciseId }) else { return }
        WKInterfaceDevice.current().play(.click)
        lastWorkoutMutationAt = Date()

        let last = state.exercises[exIdx].entries.last
        let newEntry = WatchSetEntry(
            id: "watch-\(UUID().uuidString.prefix(8))",
            weight: last?.weight ?? 0,
            reps: last?.reps ?? state.exercises[exIdx].reps,
            confirmed: false
        )
        state.exercises[exIdx].entries.append(newEntry)
        state.exercises[exIdx].sets = state.exercises[exIdx].entries.count
        saveCache()

        sendAction([
            "type": "addSet",
            "exerciseId": exerciseId,
            "timestamp": Date().timeIntervalSince1970,
        ])
    }

    func toggleExerciseChecked(exerciseId: String) {
        guard let exIdx = state.exercises.firstIndex(where: { $0.id == exerciseId }) else { return }
        WKInterfaceDevice.current().play(.click)
        lastWorkoutMutationAt = Date()

        let nextChecked = !state.exercises[exIdx].checked
        state.exercises[exIdx].checked = nextChecked
        if nextChecked {
            for i in state.exercises[exIdx].entries.indices {
                if state.exercises[exIdx].entries[i].weight > 0 || state.exercises[exIdx].entries[i].reps > 0 {
                    state.exercises[exIdx].entries[i].confirmed = true
                }
            }
            state.exercises[exIdx].completedSets = state.exercises[exIdx].confirmedSetsCount
        }
        state.completedExercises = state.exercises.filter { $0.checked }.count
        state.totalExercises = state.exercises.count
        saveCache()

        sendAction([
            "type": "toggleExercise",
            "exerciseId": exerciseId,
            "checked": nextChecked,
            "timestamp": Date().timeIntervalSince1970,
        ])
    }

    func completeTodayWorkout() {
        WKInterfaceDevice.current().play(.success)
        lastWorkoutMutationAt = Date()
        state.workoutCompleted = true
        stopRestTimer(broadcastToPhone: false)
        saveCache()
        sendAction([
            "type": "completeWorkout",
            "timestamp": Date().timeIntervalSince1970,
        ])
    }

    // MARK: - Synced Rest Timer + Last-5-Second Haptic Countdown

    func startRestTimer(
        endAt: Date,
        totalSeconds: Int,
        exerciseName: String,
        broadcastToPhone: Bool = true
    ) {
        let remaining = Int(ceil(endAt.timeIntervalSinceNow))
        guard remaining > 0 else {
            stopRestTimer(broadcastToPhone: broadcastToPhone)
            return
        }

        if broadcastToPhone {
            lastRestMutationAt = Date()
        }

        restTimer?.invalidate()
        restExerciseName = exerciseName
        restEndAt = endAt
        restTotalSeconds = max(remaining, totalSeconds)
        restSecondsLeft = remaining
        lastHapticSecond = -1

        ensureExtendedRuntimeSession()
        let hasActiveExtendedSession = extendedSession != nil && extendedSession?.state != .invalid
        scheduleWatchRestNotification(
            endAt: endAt,
            exerciseName: exerciseName,
            deferSlightlyForForegroundHaptic: hasActiveExtendedSession
        )

        let timer = Timer(timeInterval: 0.25, repeats: true) { [weak self] _ in
            self?.tickRestTimer()
        }
        RunLoop.main.add(timer, forMode: .common)
        restTimer = timer

        if broadcastToPhone {
            sendAction([
                "type": "syncRestTimer",
                "exerciseName": exerciseName,
                "restEndAtUnix": endAt.timeIntervalSince1970,
                "restTotalSeconds": restTotalSeconds,
                "timestamp": Date().timeIntervalSince1970,
            ])
        }
    }

    func extendRestTimer(by deltaSeconds: Int) {
        guard let currentEnd = restEndAt else { return }
        WKInterfaceDevice.current().play(.click)
        let nextEnd = max(Date().addingTimeInterval(5), currentEnd.addingTimeInterval(TimeInterval(deltaSeconds)))
        let nextTotal = max(restTotalSeconds + max(0, deltaSeconds), Int(ceil(nextEnd.timeIntervalSinceNow)))
        startRestTimer(
            endAt: nextEnd,
            totalSeconds: nextTotal,
            exerciseName: restExerciseName,
            broadcastToPhone: true
        )
    }

    func stopRestTimer(broadcastToPhone: Bool = true, delaySessionInvalidation: Bool = false) {
        if broadcastToPhone {
            WKInterfaceDevice.current().play(.click)
            lastRestMutationAt = Date()
        }
        restTimer?.invalidate()
        restTimer = nil
        restEndAt = nil
        restSecondsLeft = 0
        lastHapticSecond = -1
        cancelWatchRestNotification()

        if delaySessionInvalidation {
            let sessionToEnd = extendedSession
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) { [weak self] in
                guard let self else { return }
                // Only invalidate if no new rest timer started in the meantime.
                if self.restEndAt == nil, self.extendedSession === sessionToEnd {
                    self.invalidateExtendedRuntimeSession()
                }
            }
        } else {
            invalidateExtendedRuntimeSession()
        }

        if broadcastToPhone {
            sendAction([
                "type": "syncRestTimer",
                "exerciseName": restExerciseName,
                "restEndAtUnix": 0,
                "restTotalSeconds": 0,
                "timestamp": Date().timeIntervalSince1970,
            ])
        }
    }

    private func ensureExtendedRuntimeSession() {
        // WKExtendedRuntimeSession (self-care mode) keeps the Watch app and
        // its Timer + wrist haptics alive even after the user drops their wrist
        // and the Always-On display dims.
        if let current = extendedSession, current.state == .running || current.state == .scheduled {
            return
        }
        let session = WKExtendedRuntimeSession()
        session.delegate = self
        extendedSession = session
        session.start()
    }

    private func invalidateExtendedRuntimeSession() {
        if let current = extendedSession {
            if current.state == .running || current.state == .scheduled {
                current.invalidate()
            }
            extendedSession = nil
        }
    }

    private func tickRestTimer() {
        guard let endAt = restEndAt else { return }
        let remaining = Int(ceil(endAt.timeIntervalSinceNow))

        if remaining <= 0 {
            if lastHapticSecond != 0 {
                lastHapticSecond = 0
                lastFinishedHapticAt = Date()
                WKInterfaceDevice.current().play(.notification)
                DispatchQueue.main.asyncAfter(deadline: .now() + 0.45) {
                    WKInterfaceDevice.current().play(.success)
                }
            }
            stopRestTimer(broadcastToPhone: false, delaySessionInvalidation: true)
            return
        }

        if remaining != restSecondsLeft {
            restSecondsLeft = remaining
            // Tactile wrist pulse on every second during the final 5 seconds (5, 4, 3, 2, 1)
            if remaining <= 5 && remaining != lastHapticSecond {
                lastHapticSecond = remaining
                WKInterfaceDevice.current().play(.start)
            }
        }
    }

    private func requestNotificationAuthIfNeeded() {
        let center = UNUserNotificationCenter.current()
        center.getNotificationSettings { settings in
            if settings.authorizationStatus == .notDetermined {
                center.requestAuthorization(options: [.alert, .sound]) { _, _ in }
            }
        }
    }

    private func scheduleWatchRestNotification(
        endAt: Date,
        exerciseName: String,
        deferSlightlyForForegroundHaptic: Bool
    ) {
        let rawInterval = endAt.timeIntervalSinceNow
        guard rawInterval > 1 else { return }
        // Slight offset when an extended runtime session is active lets the
        // in-app haptic fire first and cancel this backup cleanly (no double
        // buzz), while guaranteeing a wrist tap if watchOS suspends the app.
        let fireInterval = max(1.0, rawInterval + (deferSlightlyForForegroundHaptic ? 0.5 : 0.0))

        let center = UNUserNotificationCenter.current()
        let scheduleBlock = {
            center.removePendingNotificationRequests(withIdentifiers: ["gampetoo_watch_rest_done"])
            let content = UNMutableNotificationContent()
            content.title = "استراحت تموم شد 💪"
            content.body = exerciseName.isEmpty ? "وقت ست بعدی!" : "ست بعدی: \(exerciseName)"
            content.sound = .default
            content.interruptionLevel = .timeSensitive
            let trigger = UNTimeIntervalNotificationTrigger(timeInterval: fireInterval, repeats: false)
            let req = UNNotificationRequest(identifier: "gampetoo_watch_rest_done", content: content, trigger: trigger)
            center.add(req, withCompletionHandler: nil)
        }

        center.getNotificationSettings { settings in
            switch settings.authorizationStatus {
            case .authorized, .provisional, .ephemeral:
                scheduleBlock()
            case .notDetermined:
                center.requestAuthorization(options: [.alert, .sound]) { granted, _ in
                    if granted { scheduleBlock() }
                }
            default:
                break
            }
        }
    }

    private func cancelWatchRestNotification() {
        UNUserNotificationCenter.current().removePendingNotificationRequests(
            withIdentifiers: ["gampetoo_watch_rest_done"]
        )
    }

    // MARK: - WatchConnectivity Transport

    private func sendAction(_ payload: [String: Any]) {
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        guard session.activationState == .activated else { return }

        let isRefresh = (payload["type"] as? String) == "requestRefresh"

        if session.isReachable {
            session.sendMessage(payload, replyHandler: { [weak self] reply in
                if isRefresh {
                    self?.applyIncoming(reply)
                }
            }, errorHandler: { _ in
                if !isRefresh {
                    session.transferUserInfo(payload)
                }
            })
        } else if !isRefresh {
            session.transferUserInfo(payload)
        }
    }

    private func applyIncoming(_ dict: [String: Any]) {
        guard dict["workoutTitle"] != nil || dict["waterGlasses"] != nil || dict["restEndAtUnix"] != nil else { return }

        DispatchQueue.main.async {
            var next = self.state
            if let date = dict["date"] as? String { next.date = date }
            if let title = dict["workoutTitle"] as? String { next.workoutTitle = title }
            if let activity = dict["workoutActivity"] as? String { next.workoutActivity = activity }
            if let c = dict["caloriesConsumed"] as? Int { next.caloriesConsumed = c }
            if let ct = dict["caloriesTarget"] as? Int { next.caloriesTarget = ct }
            if let p = dict["proteinGrams"] as? Int { next.proteinGrams = p }
            if let pt = dict["proteinTarget"] as? Int { next.proteinTarget = pt }
            if let w = dict["waterGlasses"] as? Int {
                let sameDay = next.date.isEmpty || self.state.date.isEmpty || next.date == self.state.date
                if sameDay && Date().timeIntervalSince(self.lastWaterTapAt) < 5.0 {
                    next.waterGlasses = max(w, self.state.waterGlasses)
                } else {
                    next.waterGlasses = w
                }
            }
            if let wg = dict["waterGoal"] as? Int { next.waterGoal = wg }
            if let rs = dict["restSeconds"] as? Int, rs > 0 { next.restSeconds = rs }

            let skipWorkoutOverwrite = Date().timeIntervalSince(self.lastWorkoutMutationAt) < 3.5
            if !skipWorkoutOverwrite {
                if let completed = dict["workoutCompleted"] as? Bool { next.workoutCompleted = completed }
                if let ce = dict["completedExercises"] as? Int { next.completedExercises = ce }
                if let te = dict["totalExercises"] as? Int { next.totalExercises = te }

                if let rawExercises = dict["exercises"] as? [[String: Any]] {
                    next.exercises = rawExercises.compactMap { item in
                        guard let id = item["id"] as? String,
                              let name = item["name"] as? String else { return nil }

                        let setsCount = item["sets"] as? Int ?? 3
                        let defaultReps = item["reps"] as? Int ?? 10
                        let completedSets = item["completedSets"] as? Int ?? 0
                        let checked = item["checked"] as? Bool ?? false
                        let unit = item["unit"] as? String ?? "reps"

                        var entries: [WatchSetEntry] = []
                        if let rawEntries = item["entries"] as? [[String: Any]] {
                            entries = rawEntries.enumerated().map { idx, entry in
                                let weightVal: Double
                                if let d = entry["weight"] as? Double {
                                    weightVal = d
                                } else if let n = entry["weight"] as? NSNumber {
                                    weightVal = n.doubleValue
                                } else {
                                    weightVal = 0
                                }
                                return WatchSetEntry(
                                    id: (entry["id"] as? String) ?? "set-\(idx)",
                                    weight: weightVal,
                                    reps: entry["reps"] as? Int ?? defaultReps,
                                    confirmed: entry["confirmed"] as? Bool ?? false
                                )
                            }
                        } else {
                            entries = (0..<max(1, setsCount)).map { idx in
                                WatchSetEntry(
                                    id: "seed-\(idx)",
                                    weight: 0,
                                    reps: defaultReps,
                                    confirmed: idx < completedSets
                                )
                            }
                        }

                        return WatchExerciseItem(
                            id: id,
                            name: name,
                            unit: unit,
                            sets: max(setsCount, entries.count),
                            reps: defaultReps,
                            completedSets: entries.filter { $0.confirmed }.count,
                            checked: checked,
                            entries: entries
                        )
                    }
                    next.totalExercises = next.exercises.count
                    next.completedExercises = next.exercises.filter { $0.checked }.count
                }
            }

            self.state = next
            self.saveCache()

            // Sync active rest timer pushed from iPhone!
            if Date().timeIntervalSince(self.lastRestMutationAt) >= 3.0,
               let rawEnd = (dict["restEndAtUnix"] as? Double)
                ?? (dict["restEndAtUnix"] as? NSNumber)?.doubleValue {
                let now = Date().timeIntervalSince1970
                if rawEnd > now + 1.0 {
                    let incomingEnd = Date(timeIntervalSince1970: rawEnd)
                    let currentDiff = abs((self.restEndAt?.timeIntervalSince1970 ?? 0) - rawEnd)
                    if self.restEndAt == nil || currentDiff > 2.0 {
                        let incomingTotal = (dict["restTotalSeconds"] as? Int) ?? max(15, next.restSeconds)
                        let incomingName = (dict["restExerciseName"] as? String) ?? next.workoutTitle
                        self.startRestTimer(
                            endAt: incomingEnd,
                            totalSeconds: incomingTotal,
                            exerciseName: incomingName,
                            broadcastToPhone: false
                        )
                    }
                } else if rawEnd == 0, let currentEnd = self.restEndAt, currentEnd.timeIntervalSinceNow > 2.0 {
                    // Only cancel remotely when the timer was explicitly skipped
                    // early — never kill a timer that is within 2 seconds of
                    // finishing so Watch's own finish haptic/notification fires.
                    self.stopRestTimer(broadcastToPhone: false)
                }
            }
        }
    }
}

extension GampetooWatchStore: UNUserNotificationCenterDelegate {
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification,
        withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void
    ) {
        if notification.request.identifier == "gampetoo_watch_rest_done",
           Date().timeIntervalSince(lastFinishedHapticAt) < 3.0 {
            // Foreground/extended runtime timer already played the finish haptic.
            completionHandler([])
            return
        }
        completionHandler([.banner, .sound])
    }
}

extension GampetooWatchStore: WKExtendedRuntimeSessionDelegate {
    func extendedRuntimeSessionDidStart(_ extendedRuntimeSession: WKExtendedRuntimeSession) {
        // Extended runtime active — Timer & wrist haptics stay alive with wrist down.
    }

    func extendedRuntimeSessionWillExpire(_ extendedRuntimeSession: WKExtendedRuntimeSession) {
        DispatchQueue.main.async {
            if self.extendedSession === extendedRuntimeSession {
                self.extendedSession = nil
            }
        }
    }

    func extendedRuntimeSession(
        _ extendedRuntimeSession: WKExtendedRuntimeSession,
        didInvalidateWith reason: WKExtendedRuntimeSessionInvalidationReason,
        error: Error?
    ) {
        DispatchQueue.main.async {
            if self.extendedSession === extendedRuntimeSession {
                self.extendedSession = nil
            }
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

    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
        applyIncoming(userInfo)
    }
}

@main
struct GampetooWatchApp: App {
    @StateObject private var store = GampetooWatchStore()
    @Environment(\.scenePhase) private var scenePhase

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
                .environment(\.layoutDirection, .rightToLeft)
                .onChange(of: scenePhase) { _, newPhase in
                    store.handleScenePhaseChange(newPhase)
                }
        }
    }
}
