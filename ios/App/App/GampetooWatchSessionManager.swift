import Foundation
import UIKit

#if canImport(ActivityKit)
import ActivityKit
#endif

#if canImport(WatchConnectivity)
import WatchConnectivity
#endif

private let gampetooWatchQueueKey = "gampetoo_pending_watch_actions_v1"

/// Manages two-way WatchConnectivity between the Gampetoo iOS app and the
/// standalone GampetooWatch SwiftUI companion app.
final class GampetooWatchSessionManager: NSObject {
    static let shared = GampetooWatchSessionManager()

    var onWatchAction: (([String: Any]) -> Void)?
    private var lastContext: [String: Any] = [:]
    private var lastTransferredRestEndAtUnix: Double = -1
    private var isBridgeReady: Bool = false

    private override init() {
        super.init()
    }

    func activate() {
        #if canImport(WatchConnectivity)
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        if session.delegate !== self {
            session.delegate = self
        }
        if session.activationState != .activated {
            session.activate()
        }
        #endif
    }

    func markBridgeReady() {
        if Thread.isMainThread {
            isBridgeReady = true
        } else {
            DispatchQueue.main.async { [weak self] in
                self?.isBridgeReady = true
            }
        }
    }

    func status() -> [String: Any] {
        #if canImport(WatchConnectivity)
        guard WCSession.isSupported() else {
            return [
                "supported": false,
                "paired": false,
                "watchAppInstalled": false,
                "reachable": false,
            ]
        }
        let session = WCSession.default
        return [
            "supported": true,
            "paired": session.isPaired,
            "watchAppInstalled": session.isWatchAppInstalled,
            "reachable": session.isReachable,
        ]
        #else
        return [
            "supported": false,
            "paired": false,
            "watchAppInstalled": false,
            "reachable": false,
        ]
        #endif
    }

    func pushContext(_ context: [String: Any]) {
        let sendBlock = {
            self.lastContext = context

            #if canImport(WatchConnectivity)
            guard WCSession.isSupported() else { return }
            let session = WCSession.default
            guard session.activationState == .activated else { return }

            do {
                try session.updateApplicationContext(context)
            } catch {
                // Application context updates can fail if the watch isn't paired yet.
            }

            if session.isReachable {
                session.sendMessage(context, replyHandler: nil, errorHandler: nil)
            }

            // When a rest timer starts/changes/cancels while the Watch app is
            // not open in the foreground, also enqueue a compact transferUserInfo
            // payload so watchOS wakes the Watch app in the background to
            // schedule its local wrist-haptic notification promptly.
            let incomingRestEnd = (context["restEndAtUnix"] as? Double)
                ?? (context["restEndAtUnix"] as? NSNumber)?.doubleValue
                ?? 0
            let restChanged = abs(incomingRestEnd - self.lastTransferredRestEndAtUnix) > 1.0
                || (incomingRestEnd == 0 && self.lastTransferredRestEndAtUnix > 0)
            if restChanged {
                self.lastTransferredRestEndAtUnix = incomingRestEnd
                if !session.isReachable {
                    var restPayload: [String: Any] = [
                        "restEndAtUnix": incomingRestEnd,
                        "restTotalSeconds": context["restTotalSeconds"] ?? 0,
                        "restExerciseName": context["restExerciseName"] ?? "",
                    ]
                    if let title = context["workoutTitle"] {
                        restPayload["workoutTitle"] = title
                    }
                    if let restSec = context["restSeconds"] {
                        restPayload["restSeconds"] = restSec
                    }
                    session.transferUserInfo(restPayload)
                }
            }
            #endif
        }

        if Thread.isMainThread {
            sendBlock()
        } else {
            DispatchQueue.main.async(execute: sendBlock)
        }
    }

    func enqueueAction(_ action: [String: Any]) {
        var queue = loadPendingActions()
        queue.append(action)
        if let data = try? JSONSerialization.data(withJSONObject: queue) {
            UserDefaults.standard.set(data, forKey: gampetooWatchQueueKey)
        }
    }

    func drainPendingActions() -> [[String: Any]] {
        let items = loadPendingActions()
        UserDefaults.standard.removeObject(forKey: gampetooWatchQueueKey)
        return items
    }

    private func loadPendingActions() -> [[String: Any]] {
        guard let data = UserDefaults.standard.data(forKey: gampetooWatchQueueKey),
              let parsed = try? JSONSerialization.jsonObject(with: data) as? [[String: Any]] else {
            return []
        }
        return parsed
    }

    private func handleIncoming(_ payload: [String: Any]) {
        let type = payload["type"] as? String

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }

            if type == "requestRefresh" {
                if !self.lastContext.isEmpty {
                    self.pushContext(self.lastContext)
                }
                return
            }

            // Optimistically keep lastContext in sync so a quick follow-up
            // requestRefresh never overwrites the Watch with stale numbers
            // before the WebView finishes processing the action.
            if type == "logWater", let current = self.lastContext["waterGlasses"] as? Int {
                let delta = max(1, (payload["glasses"] as? Int) ?? 1)
                self.lastContext["waterGlasses"] = current + delta
            } else if type == "completeWorkout", !self.lastContext.isEmpty {
                self.lastContext["workoutCompleted"] = true
                self.lastContext["restEndAtUnix"] = 0
                self.endLiveActivityIfRunning()
            } else if type == "completeSet" || type == "syncRestTimer" {
                let endUnix = (payload["restEndAtUnix"] as? Double)
                    ?? Double((payload["restEndAtUnix"] as? Int) ?? 0)
                let totalSec = (payload["restTotalSeconds"] as? Int)
                    ?? (self.lastContext["restSeconds"] as? Int)
                    ?? 90
                let exName = (payload["exerciseName"] as? String) ?? ""
                if !self.lastContext.isEmpty {
                    self.lastContext["restEndAtUnix"] = endUnix
                    self.lastContext["restTotalSeconds"] = endUnix > Date().timeIntervalSince1970 ? totalSec : 0
                    if !exName.isEmpty {
                        self.lastContext["restExerciseName"] = exName
                    }
                }
                self.updateRunningLiveActivityFromWatch(
                    exerciseName: exName,
                    restEndAtUnix: endUnix,
                    restTotalSeconds: totalSec
                )
            }

            let isAppActive = UIApplication.shared.applicationState == .active
            if self.isBridgeReady, isAppActive, let listener = self.onWatchAction {
                listener(payload)
            } else {
                self.enqueueAction(payload)
            }
        }
    }

    private func updateRunningLiveActivityFromWatch(
        exerciseName: String,
        restEndAtUnix: Double,
        restTotalSeconds: Int
    ) {
        #if canImport(ActivityKit)
        if #available(iOS 16.2, *) {
            Task {
                guard let existing = Activity<GampetooRestTimerAttributes>.activities.first else {
                    return
                }
                let now = Date().timeIntervalSince1970
                let isResting = restEndAtUnix > now
                let prev = existing.content.state
                let endDate = isResting ? Date(timeIntervalSince1970: restEndAtUnix) : Date()
                let nextState = GampetooRestTimerAttributes.ContentState(
                    workoutTitle: prev.workoutTitle,
                    exerciseName: exerciseName.isEmpty ? prev.exerciseName : exerciseName,
                    completedSets: prev.completedSets,
                    totalSets: prev.totalSets,
                    completedExercises: prev.completedExercises,
                    totalExercises: prev.totalExercises,
                    isResting: isResting,
                    endAt: endDate,
                    totalSeconds: isResting ? max(1, restTotalSeconds) : 0
                )
                let content = ActivityContent(
                    state: nextState,
                    staleDate: endDate.addingTimeInterval(3600)
                )
                await existing.update(content)
            }
        }
        #endif
    }

    private func endLiveActivityIfRunning() {
        #if canImport(ActivityKit)
        if #available(iOS 16.2, *) {
            Task {
                for existing in Activity<GampetooRestTimerAttributes>.activities {
                    await existing.end(nil, dismissalPolicy: .immediate)
                }
            }
        }
        #endif
    }
}

#if canImport(WatchConnectivity)
extension GampetooWatchSessionManager: WCSessionDelegate {
    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            if activationState == .activated, !self.lastContext.isEmpty {
                self.pushContext(self.lastContext)
            }
        }
    }

    func sessionDidBecomeInactive(_ session: WCSession) {}

    func sessionDidDeactivate(_ session: WCSession) {
        session.activate()
    }

    func session(_ session: WCSession, didReceiveMessage message: [String: Any]) {
        handleIncoming(message)
    }

    func session(
        _ session: WCSession,
        didReceiveMessage message: [String: Any],
        replyHandler: @escaping ([String: Any]) -> Void
    ) {
        let type = message["type"] as? String
        if type == "requestRefresh" {
            DispatchQueue.main.async { [weak self] in
                guard let self = self else {
                    replyHandler(["ok": true])
                    return
                }
                replyHandler(self.lastContext.isEmpty ? ["ok": true] : self.lastContext)
            }
            return
        }

        // For mutating actions (logWater, completeSet, completeWorkout), NEVER
        // reply with lastContext — it may still hold pre-mutation values and
        // would immediately revert the optimistic update on Apple Watch.
        handleIncoming(message)
        replyHandler(["ok": true])
    }

    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
        handleIncoming(userInfo)
    }
}
#endif
