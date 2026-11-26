import SwiftUI
import WidgetKit

private let gampetooWatchAppGroupId = "group.com.gampetoo.app"
private let gampetooWatchStateKey = "gampetoo_watch_state_v2"

struct WatchWidgetSnapshot: Codable {
    var date: String
    var workoutTitle: String
    var workoutActivity: String
    var workoutCompleted: Bool
    var completedExercises: Int?
    var totalExercises: Int?
    var caloriesConsumed: Int
    var caloriesTarget: Int
    var proteinGrams: Int
    var proteinTarget: Int?
    var waterGlasses: Int
    var waterGoal: Int

    var effectiveProteinTarget: Int {
        let pt = proteinTarget ?? 0
        return pt > 0 ? pt : 150
    }

    static let placeholder = WatchWidgetSnapshot(
        date: "",
        workoutTitle: "تمرین بالاتنه",
        workoutActivity: "workout",
        workoutCompleted: false,
        completedExercises: 2,
        totalExercises: 6,
        caloriesConsumed: 1420,
        caloriesTarget: 2100,
        proteinGrams: 112,
        proteinTarget: 150,
        waterGlasses: 5,
        waterGoal: 8
    )

    static func load() -> WatchWidgetSnapshot {
        let store = UserDefaults(suiteName: gampetooWatchAppGroupId) ?? UserDefaults.standard
        guard let data = store.data(forKey: gampetooWatchStateKey),
              let decoded = try? JSONDecoder().decode(WatchWidgetSnapshot.self, from: data) else {
            return .placeholder
        }
        return decoded
    }
}

struct GampetooWatchWidgetEntry: TimelineEntry {
    let date: Date
    let snapshot: WatchWidgetSnapshot
}

struct GampetooWatchTimelineProvider: TimelineProvider {
    func placeholder(in context: Context) -> GampetooWatchWidgetEntry {
        GampetooWatchWidgetEntry(date: Date(), snapshot: .placeholder)
    }

    func getSnapshot(in context: Context, completion: @escaping (GampetooWatchWidgetEntry) -> Void) {
        completion(GampetooWatchWidgetEntry(date: Date(), snapshot: .load()))
    }

    func getTimeline(in context: Context, completion: @escaping (Timeline<GampetooWatchWidgetEntry>) -> Void) {
        let entry = GampetooWatchWidgetEntry(date: Date(), snapshot: .load())
        let nextRefresh = Calendar.current.date(byAdding: .minute, value: 20, to: Date()) ?? Date()
        completion(Timeline(entries: [entry], policy: .after(nextRefresh)))
    }
}

private struct WatchSmartRing: View {
    let valueText: String
    let label: String
    let progress: Double
    let color: Color

    private var clamped: Double {
        min(1.0, max(0.0, progress))
    }

    var body: some View {
        VStack(spacing: 1.5) {
            ZStack {
                Circle()
                    .stroke(.white.opacity(0.16), lineWidth: 3.5)
                if clamped > 0 {
                    Circle()
                        .trim(from: 0, to: clamped)
                        .stroke(color, style: StrokeStyle(lineWidth: 3.5, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                }
                Text(verbatim: valueText)
                    .font(.system(size: 9.5, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(.white)
                    .lineLimit(1)
                    .minimumScaleFactor(0.55)
                    .padding(.horizontal, 4)
            }
            .frame(width: 32, height: 32)

            Text(label)
                .font(.system(size: 8.5, weight: .semibold))
                .foregroundStyle(.white.opacity(0.75))
                .lineLimit(1)
        }
    }
}

struct GampetooWatchWidgetView: View {
    let entry: GampetooWatchWidgetEntry
    @Environment(\.widgetFamily) private var family

    private let accentYellow = Color(red: 250 / 255, green: 234 / 255, blue: 92 / 255)
    private let accentLime = Color(red: 157 / 255, green: 199 / 255, blue: 48 / 255)
    private let calorieEmerald = Color(red: 74 / 255, green: 222 / 255, blue: 128 / 255)
    private let waterSky = Color(red: 56 / 255, green: 189 / 255, blue: 248 / 255)
    private let bgTop = Color(red: 28 / 255, green: 68 / 255, blue: 35 / 255)
    private let bgBottom = Color(red: 14 / 255, green: 36 / 255, blue: 19 / 255)

    private var s: WatchWidgetSnapshot { entry.snapshot }

    private var calorieProgress: Double {
        guard s.caloriesTarget > 0 else { return 0 }
        return Double(s.caloriesConsumed) / Double(s.caloriesTarget)
    }

    private var proteinProgress: Double {
        Double(s.proteinGrams) / Double(max(1, s.effectiveProteinTarget))
    }

    private var waterProgress: Double {
        guard s.waterGoal > 0 else { return 0 }
        return Double(s.waterGlasses) / Double(s.waterGoal)
    }

    var body: some View {
        switch family {
        case .accessoryRectangular:
            rectangularView
        case .accessoryCircular:
            circularView
        case .accessoryInline:
            Text(verbatim: "گامپتو · \(s.caloriesConsumed) کالری · \(s.proteinGrams)g")
        default:
            rectangularView
        }
    }

    private var rectangularView: some View {
        VStack(spacing: 4) {
            HStack(spacing: 4) {
                Text(s.workoutTitle.isEmpty ? "گامپتو" : s.workoutTitle)
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(accentYellow)
                    .lineLimit(1)

                Spacer(minLength: 2)

                if s.workoutCompleted {
                    Image(systemName: "checkmark.circle.fill")
                        .font(.system(size: 11))
                        .foregroundStyle(accentLime)
                } else if let total = s.totalExercises, total > 0 {
                    Text(verbatim: "\(s.completedExercises ?? 0)/\(total)")
                        .font(.system(size: 10, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(.white.opacity(0.85))
                }
            }

            HStack(spacing: 0) {
                WatchSmartRing(
                    valueText: "\(s.caloriesConsumed)",
                    label: "کالری",
                    progress: calorieProgress,
                    color: calorieEmerald
                )
                .frame(maxWidth: .infinity)

                WatchSmartRing(
                    valueText: "\(s.proteinGrams)g",
                    label: "پروتئین",
                    progress: proteinProgress,
                    color: accentYellow
                )
                .frame(maxWidth: .infinity)

                WatchSmartRing(
                    valueText: "\(s.waterGlasses)",
                    label: "آب",
                    progress: waterProgress,
                    color: waterSky
                )
                .frame(maxWidth: .infinity)
            }
        }
        .environment(\.layoutDirection, .rightToLeft)
        .containerBackground(for: .widget) {
            LinearGradient(colors: [bgTop, bgBottom], startPoint: .topLeading, endPoint: .bottomTrailing)
        }
    }

    private var circularView: some View {
        ZStack {
            Circle()
                .stroke(.white.opacity(0.18), lineWidth: 4.5)
            Circle()
                .trim(from: 0, to: min(1.0, max(0.0, calorieProgress)))
                .stroke(calorieEmerald, style: StrokeStyle(lineWidth: 4.5, lineCap: .round))
                .rotationEffect(.degrees(-90))

            VStack(spacing: 0) {
                Text(verbatim: "\(s.caloriesConsumed)")
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
                Text("کالری")
                    .font(.system(size: 7.5, weight: .semibold))
                    .foregroundStyle(.secondary)
            }
            .padding(.horizontal, 4)
        }
        .containerBackground(for: .widget) {
            LinearGradient(colors: [bgTop, bgBottom], startPoint: .topLeading, endPoint: .bottomTrailing)
        }
    }
}

@main
struct GampetooWatchWidgetsBundle: WidgetBundle {
    var body: some Widget {
        GampetooWatchSummaryWidget()
    }
}

struct GampetooWatchSummaryWidget: Widget {
    let kind: String = "GampetooWatchSummaryWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: GampetooWatchTimelineProvider()) { entry in
            GampetooWatchWidgetView(entry: entry)
        }
        .configurationDisplayName("گامپتو")
        .description("خلاصه تمرین، کالری، پروتئین و آب روزانه")
        .supportedFamilies([.accessoryRectangular, .accessoryCircular, .accessoryInline])
    }
}
