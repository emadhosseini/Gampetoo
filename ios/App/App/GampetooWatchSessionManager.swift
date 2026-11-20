import Foundation

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

    private override init() {
        super.init()
    }

    func activate() {
        #if canImport(WatchConnectivity)
        guard WCSession.isSupported() else { return }
        let session = WCSession.default
        session.delegate = self
        session.activate()
        #endif
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
        lastContext = context

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
        #endif
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
        if let type = payload["type"] as? String, type == "requestRefresh" {
            if !lastContext.isEmpty {
                pushContext(lastContext)
            }
            return
        }

        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            if let listener = self.onWatchAction {
                listener(payload)
            } else {
                self.enqueueAction(payload)
            }
        }
    }
}

#if canImport(WatchConnectivity)
extension GampetooWatchSessionManager: WCSessionDelegate {
    func session(
        _ session: WCSession,
        activationDidCompleteWith activationState: WCSessionActivationState,
        error: Error?
    ) {
        if activationState == .activated, !lastContext.isEmpty {
            pushContext(lastContext)
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
        handleIncoming(message)
        replyHandler(lastContext.isEmpty ? ["ok": true] : lastContext)
    }

    func session(_ session: WCSession, didReceiveUserInfo userInfo: [String: Any] = [:]) {
        handleIncoming(userInfo)
    }
}
#endif
