import Foundation
import UIKit
import Capacitor

#if canImport(ActivityKit)
import ActivityKit
#endif

#if canImport(WidgetKit)
import WidgetKit
#endif

private let gampetooAppGroupId = "group.com.gampetoo.app"
private let gampetooWidgetSnapshotKey = "gampetoo_widget_snapshot_v1"

/// Custom Capacitor bridge controller that registers `GampetooNativePlugin`,
/// activates Apple Watch connectivity, and configures dark native WebView
/// presentation.
class GampetooViewController: CAPBridgeViewController {
    override func viewDidLoad() {
        super.viewDidLoad()

        overrideUserInterfaceStyle = .dark

        let forestDark = UIColor(red: 19.0 / 255.0, green: 47.0 / 255.0, blue: 24.0 / 255.0, alpha: 1.0)
        view.backgroundColor = forestDark
        webView?.isOpaque = false
        webView?.backgroundColor = forestDark
        webView?.allowsBackForwardNavigationGestures = false
        webView?.scrollView.backgroundColor = forestDark
        webView?.scrollView.bounces = false
        webView?.scrollView.contentInsetAdjustmentBehavior = .never
    }

    override open func capacitorDidLoad() {
        let plugin = GampetooNativePlugin()
        bridge?.registerPluginInstance(plugin)
        GampetooWatchSessionManager.shared.activate()
    }
}

/// Native iOS bridge exposed to TypeScript as `GampetooNative`.
/// Handles:
/// - Shared App Group snapshot persistence + WidgetKit timeline reload
/// - ActivityKit (Dynamic Island / Lock Screen) workout rest countdown
/// - Apple Health (HealthKit) two-way sync
/// - Apple Watch (WatchConnectivity) two-way sync & live wrist actions
@objc(GampetooNativePlugin)
public class GampetooNativePlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "GampetooNativePlugin"
    public let jsName = "GampetooNative"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "startRestTimerActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "endRestTimerActivity", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "updateWidgetSnapshot", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getCapabilities", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "requestHealthKitAuth", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "syncHealthKitToday", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeHealthKitWater", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeHealthKitWeight", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "writeHealthKitWorkout", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "syncWatchContext", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "drainWatchActions", returnType: CAPPluginReturnPromise),
        CAPPluginMethod(name: "getWatchStatus", returnType: CAPPluginReturnPromise),
    ]

    override public func load() {
        GampetooWatchSessionManager.shared.onWatchAction = { [weak self] payload in
            self?.notifyListeners("watchAction", data: payload, retainUntilConsumed: true)
        }
    }

    // MARK: - Live Activities (Dynamic Island)

    @objc func startRestTimerActivity(_ call: CAPPluginCall) {
        let exerciseName = call.getString("exerciseName") ?? "تمرین"
        let endAtUnix = call.getDouble("endAtUnixSeconds") ?? 0
        let totalSeconds = call.getInt("totalSeconds") ?? 90

        guard endAtUnix > Date().timeIntervalSince1970 else {
            call.resolve(["started": false])
            return
        }

        #if canImport(ActivityKit)
        if #available(iOS 16.2, *) {
            let authInfo = ActivityAuthorizationInfo()
            guard authInfo.areActivitiesEnabled else {
                call.resolve(["started": false])
                return
            }

            Task {
                for existing in Activity<GampetooRestTimerAttributes>.activities {
                    await existing.end(nil, dismissalPolicy: .immediate)
                }

                let attributes = GampetooRestTimerAttributes(exerciseName: exerciseName)
                let endDate = Date(timeIntervalSince1970: endAtUnix)
                let state = GampetooRestTimerAttributes.ContentState(
                    endAt: endDate,
                    totalSeconds: totalSeconds
                )
                let content = ActivityContent(state: state, staleDate: endDate)

                do {
                    _ = try Activity.request(attributes: attributes, content: content, pushType: nil)
                    call.resolve(["started": true])
                } catch {
                    call.resolve(["started": false])
                }
            }
            return
        }
        #endif

        call.resolve(["started": false])
    }

    @objc func endRestTimerActivity(_ call: CAPPluginCall) {
        #if canImport(ActivityKit)
        if #available(iOS 16.2, *) {
            Task {
                for existing in Activity<GampetooRestTimerAttributes>.activities {
                    await existing.end(nil, dismissalPolicy: .immediate)
                }
                call.resolve()
            }
            return
        }
        #endif

        call.resolve()
    }

    // MARK: - Widget Snapshot & Capabilities

    @objc func updateWidgetSnapshot(_ call: CAPPluginCall) {
        let payload: [String: Any] = [
            "date": call.getString("date") ?? "",
            "workoutTitle": call.getString("workoutTitle") ?? "",
            "workoutActivity": call.getString("workoutActivity") ?? "rest",
            "workoutCompleted": call.getBool("workoutCompleted") ?? false,
            "caloriesConsumed": call.getInt("caloriesConsumed") ?? 0,
            "caloriesTarget": call.getInt("caloriesTarget") ?? 0,
            "proteinGrams": call.getInt("proteinGrams") ?? 0,
            "waterGlasses": call.getInt("waterGlasses") ?? 0,
            "waterGoal": call.getInt("waterGoal") ?? 8,
            "updatedAt": call.getString("updatedAt") ?? "",
        ]

        if let data = try? JSONSerialization.data(withJSONObject: payload) {
            let store = UserDefaults(suiteName: gampetooAppGroupId) ?? UserDefaults.standard
            store.set(data, forKey: gampetooWidgetSnapshotKey)
        }

        #if canImport(WidgetKit)
        if #available(iOS 14.0, *) {
            WidgetCenter.shared.reloadAllTimelines()
        }
        #endif

        call.resolve()
    }

    @objc func getCapabilities(_ call: CAPPluginCall) {
        let appGroupAvailable = UserDefaults(suiteName: gampetooAppGroupId) != nil
        var liveActivitiesEnabled = false

        #if canImport(ActivityKit)
        if #available(iOS 16.2, *) {
            liveActivitiesEnabled = ActivityAuthorizationInfo().areActivitiesEnabled
        }
        #endif

        call.resolve([
            "liveActivitiesEnabled": liveActivitiesEnabled,
            "appGroupAvailable": appGroupAvailable,
            "healthKitAvailable": GampetooHealthManager.shared.isAvailable,
        ])
    }

    // MARK: - Apple Health (HealthKit)

    @objc func requestHealthKitAuth(_ call: CAPPluginCall) {
        GampetooHealthManager.shared.requestAuthorization { granted, errorMessage in
            var result: [String: Any] = ["granted": granted]
            if let errorMessage = errorMessage {
                result["error"] = errorMessage
            }
            call.resolve(result)
        }
    }

    @objc func syncHealthKitToday(_ call: CAPPluginCall) {
        GampetooHealthManager.shared.fetchTodaySummary { summary in
            call.resolve(summary)
        }
    }

    @objc func writeHealthKitWater(_ call: CAPPluginCall) {
        let glasses = call.getDouble("glasses") ?? 1.0
        let ml = glasses * 250.0
        GampetooHealthManager.shared.logWater(milliliters: ml) { saved in
            call.resolve(["saved": saved])
        }
    }

    @objc func writeHealthKitWeight(_ call: CAPPluginCall) {
        let kg = call.getDouble("kg") ?? 0
        GampetooHealthManager.shared.logWeight(kg: kg) { saved in
            call.resolve(["saved": saved])
        }
    }

    @objc func writeHealthKitWorkout(_ call: CAPPluginCall) {
        let kind = call.getString("kind") ?? "workout"
        let durationMinutes = call.getDouble("durationMinutes") ?? 45.0
        let calories = call.getDouble("calories") ?? 0
        let title = call.getString("title") ?? "تمرین گمپتو"

        GampetooHealthManager.shared.logWorkout(
            kind: kind,
            durationMinutes: durationMinutes,
            activeCalories: calories,
            title: title
        ) { saved in
            call.resolve(["saved": saved])
        }
    }

    // MARK: - Apple Watch (WatchConnectivity)

    @objc func syncWatchContext(_ call: CAPPluginCall) {
        var context: [String: Any] = [
            "date": call.getString("date") ?? "",
            "workoutTitle": call.getString("workoutTitle") ?? "",
            "workoutActivity": call.getString("workoutActivity") ?? "rest",
            "workoutCompleted": call.getBool("workoutCompleted") ?? false,
            "caloriesConsumed": call.getInt("caloriesConsumed") ?? 0,
            "caloriesTarget": call.getInt("caloriesTarget") ?? 0,
            "proteinGrams": call.getInt("proteinGrams") ?? 0,
            "proteinTarget": call.getInt("proteinTarget") ?? 0,
            "waterGlasses": call.getInt("waterGlasses") ?? 0,
            "waterGoal": call.getInt("waterGoal") ?? 8,
            "restSeconds": call.getInt("restSeconds") ?? 90,
            "updatedAt": call.getString("updatedAt") ?? "",
        ]

        if let exercises = call.getArray("exercises") {
            context["exercises"] = exercises
        }

        GampetooWatchSessionManager.shared.pushContext(context)
        call.resolve()
    }

    @objc func drainWatchActions(_ call: CAPPluginCall) {
        let actions = GampetooWatchSessionManager.shared.drainPendingActions()
        call.resolve(["actions": actions])
    }

    @objc func getWatchStatus(_ call: CAPPluginCall) {
        call.resolve(GampetooWatchSessionManager.shared.status())
    }
}
