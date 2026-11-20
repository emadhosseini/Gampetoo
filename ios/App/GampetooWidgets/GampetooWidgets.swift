import ActivityKit
import SwiftUI
import WidgetKit

private let gampetooAppGroupId = "group.com.gampetoo.app"
private let gampetooWidgetSnapshotKey = "gampetoo_widget_snapshot_v1"

struct GampetooSnapshot: Codable {
    var date: String
    var workoutTitle: String
    var workoutActivity: String
    var workoutCompleted: Bool
    var caloriesConsumed: Int
    var caloriesTarget: Int
    var proteinGrams: Int
    var waterGlasses: Int
    var waterGoal: Int

    static let placeholder = GampetooSnapshot(
        date: "",
        workoutTitle: "تمرین بالاتنه",
        workoutActivity: "workout",
        workoutCompleted: false,
        caloriesConsumed: 1250,
        caloriesTarget: 2100,
        proteinGrams: 95,
        waterGlasses: 5,
        waterGoal: 8
    )

    static func load() -> GampetooSnapshot {
        let store = UserDefaults(suiteName: gampetooAppGroupId) ?? UserDefaults.standard
        guard let data = store.data(forKey: gampetooWidgetSnapshotKey),
              let decoded = try? JSONDecoder().decode(GampetooSnapshot.self, from: data) else {
            return .placeholder
        }
        return decoded
    }
}

struct GampetooWidgetEntry: TimelineEntry {
    let date: Date
    let snapshot: GampetooSnapshot
}

struct GampetooTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> GampetooWidgetEntry {
        GampetooWidgetEntry(date: Date(), snapshot: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (GampetooWidgetEntry) -> Void) {
        completion(GampetooWidgetEntry(date: Date(), snapshot: .load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<GampetooWidgetEntry>) -> Void) {
        let entry = GampetooWidgetEntry(date: Date(), snapshot: .load())
        let nextRefresh = Calendar.current.date(byAdding: .minute, value: 30, to: Date()) ?? Date()
        completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
    }
}

private struct ForestWidgetBackground: View {
    private let bgTop = Color(red: 29 / 255, green: 71 / 255, blue: 36 / 255)
    private let bgBottom = Color(red: 19 / 255, green: 47 / 255, blue: 24 / 255)

    var body: some View {
        LinearGradient(colors: [bgTop, bgBottom], startPoint: .topLeading, endPoint: .bottomTrailing)
    }
}

private extension View {
    @ViewBuilder
    func gampetooWidgetBackground() -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            self.containerBackground(for: .widget) {
                ForestWidgetBackground()
            }
        } else {
            self.background(ForestWidgetBackground())
        }
    }
}

struct GampetooDailyWidgetView: View {
    let entry: GampetooWidgetEntry
    @Environment(\.widgetFamily) private var family

    private let accentYellow = Color(red: 250 / 255, green: 234 / 255, blue: 92 / 255)
    private let accentLime = Color(red: 157 / 255, green: 199 / 255, blue: 48 / 255)

    var body: some View {
        let s = entry.snapshot
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Gampetoo")
                    .font(.caption.bold())
                    .foregroundStyle(accentYellow)
                Spacer()
                Image(systemName: s.workoutCompleted ? "checkmark.circle.fill" : "figure.strengthtraining.traditional")
                    .foregroundStyle(s.workoutCompleted ? accentLime : .white)
            }

            Text(s.workoutTitle.isEmpty ? "برنامه امروز" : s.workoutTitle)
                .font(.headline.bold())
                .foregroundStyle(.white)
                .lineLimit(1)

            Spacer(minLength: 0)

            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 2) {
                    Text("کالری")
                        .font(.caption2)
                        .foregroundStyle(.white.opacity(0.65))
                    Text(s.caloriesTarget > 0 ? "\(s.caloriesConsumed)/\(s.caloriesTarget)" : "\(s.caloriesConsumed)")
                        .font(.caption.bold())
                        .monospacedDigit()
                        .foregroundStyle(.white)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text("آب")
                        .font(.caption2)
                        .foregroundStyle(.white.opacity(0.65))
                    Text("\(s.waterGlasses)/\(s.waterGoal) 💧")
                        .font(.caption.bold())
                        .monospacedDigit()
                        .foregroundStyle(.white)
                }

                if family == .systemMedium {
                    VStack(alignment: .leading, spacing: 2) {
                        Text("پروتئین")
                            .font(.caption2)
                            .foregroundStyle(.white.opacity(0.65))
                        Text("\(s.proteinGrams)g")
                            .font(.caption.bold())
                            .monospacedDigit()
                            .foregroundStyle(accentLime)
                    }
                }
            }
        }
        .environment(\.layoutDirection, .rightToLeft)
        .padding()
        .gampetooWidgetBackground()
    }
}

struct GampetooDailyWidget: Widget {
    let kind: String = "GampetooDailyWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: GampetooTimelineProvider()) { entry in
            GampetooDailyWidgetView(entry: entry)
        }
        .configurationDisplayName("برنامه امروز گمپتو")
        .description("خلاصه تمرین امروز، کالری و مصرف آب")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

@available(iOS 16.2, *)
struct GampetooRestLiveActivity: Widget {
    private let accentYellow = Color(red: 250 / 255, green: 234 / 255, blue: 92 / 255)
    private let bgForest = Color(red: 19 / 255, green: 47 / 255, blue: 24 / 255)

    var body: some WidgetConfiguration {
        ActivityConfiguration(for: GampetooRestTimerAttributes.self) { context in
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("استراحت بین ست‌ها")
                        .font(.caption)
                        .foregroundStyle(.white.opacity(0.75))
                    Text(context.attributes.exerciseName)
                        .font(.headline.bold())
                        .foregroundStyle(.white)
                        .lineLimit(1)
                }
                Spacer()
                Text(timerInterval: Date()...context.state.endAt, countsDown: true)
                    .font(.title2.monospacedDigit().bold())
                    .foregroundStyle(accentYellow)
            }
            .environment(\.layoutDirection, .rightToLeft)
            .padding()
            .activityBackgroundTint(bgForest)
        } dynamicIsland: { context in
            DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    Text(context.attributes.exerciseName)
                        .font(.caption.bold())
                        .lineLimit(1)
                }
                DynamicIslandExpandedRegion(.trailing) {
                    Text(timerInterval: Date()...context.state.endAt, countsDown: true)
                        .font(.headline.monospacedDigit().bold())
                        .foregroundStyle(accentYellow)
                }
                DynamicIslandExpandedRegion(.bottom) {
                    Text("زمان استراحت تا ست بعدی ⏱️")
                        .font(.caption2)
                        .foregroundStyle(.secondary)
                }
            } compactLeading: {
                Image(systemName: "timer")
                    .foregroundStyle(accentYellow)
            } compactTrailing: {
                Text(timerInterval: Date()...context.state.endAt, countsDown: true)
                    .font(.caption.monospacedDigit().bold())
                    .foregroundStyle(accentYellow)
                    .frame(width: 44)
            } minimal: {
                Image(systemName: "timer")
                    .foregroundStyle(accentYellow)
            }
        }
    }
}

@main
struct GampetooWidgetsBundle: WidgetBundle {
    var body: some Widget {
        GampetooDailyWidget()
        if #available(iOS 16.2, *) {
            GampetooRestLiveActivity()
        }
    }
}
