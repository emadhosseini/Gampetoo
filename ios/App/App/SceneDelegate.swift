import UIKit
import UserNotifications
import Capacitor

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?

    func scene(
        _ scene: UIScene,
        willConnectTo session: UISceneSession,
        options connectionOptions: UIScene.ConnectionOptions
    ) {
        guard let windowScene = scene as? UIWindowScene else { return }

        window = UIWindow(windowScene: windowScene)
        window?.backgroundColor = UIColor(red: 19.0 / 255.0, green: 47.0 / 255.0, blue: 24.0 / 255.0, alpha: 1.0)
        window?.rootViewController = GampetooViewController()
        window?.makeKeyAndVisible()

        SceneDelegateProxy.shared.scene(scene, willConnectTo: session, options: connectionOptions)
    }

    func sceneDidBecomeActive(_ scene: UIScene) {
        let center = UNUserNotificationCenter.current()
        center.removeAllDeliveredNotifications()
        if #available(iOS 16.0, *) {
            center.setBadgeCount(0, withCompletionHandler: nil)
        } else {
            UIApplication.shared.applicationIconBadgeNumber = 0
        }
    }

    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        SceneDelegateProxy.shared.scene(scene, openURLContexts: URLContexts)
    }

    func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
        SceneDelegateProxy.shared.scene(scene, continue: userActivity)
    }
}
