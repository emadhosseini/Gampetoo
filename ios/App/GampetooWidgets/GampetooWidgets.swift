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

    static let placeholder = GampetooSnapshot(
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
    private let bgTop = Color(red: 28 / 255, green: 68 / 255, blue: 35 / 255)
    private let bgBottom = Color(red: 14 / 255, green: 36 / 255, blue: 19 / 255)

    var body: some View {
        ZStack {
            LinearGradient(colors: [bgTop, bgBottom], startPoint: .topLeading, endPoint: .bottomTrailing)
            RadialGradient(
                colors: [Color(red: 157 / 255, green: 199 / 255, blue: 48 / 255).opacity(0.14), .clear],
                center: .topTrailing,
                startRadius: 8,
                endRadius: 170
            )
        }
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

    @ViewBuilder
    func gampetooLegacyWidgetPadding(horizontal: CGFloat, vertical: CGFloat) -> some View {
        if #available(iOSApplicationExtension 17.0, *) {
            // iOS 17+ containerBackground already provides native widget margins.
            self
        } else {
            self.padding(.horizontal, horizontal).padding(.vertical, vertical)
        }
    }
}

private struct WidgetMetricRing: View {
    let valueText: String
    let label: String
    let progress: Double
    let ringColor: Color
    let size: CGFloat
    let lineWidth: CGFloat
    let valueFontSize: CGFloat
    var iconName: String? = nil

    private var clampedProgress: Double {
        min(1.0, max(0.0, progress))
    }

    var body: some View {
        VStack(spacing: 5) {
            ZStack {
                Circle()
                    .stroke(.white.opacity(0.12), lineWidth: lineWidth)

                if clampedProgress > 0 {
                    Circle()
                        .trim(from: 0, to: clampedProgress)
                        .stroke(
                            ringColor,
                            style: StrokeStyle(lineWidth: lineWidth, lineCap: .round)
                        )
                        .rotationEffect(.degrees(-90))
                }

                VStack(spacing: 1) {
                    if let iconName {
                        Image(systemName: iconName)
                            .font(.system(size: size * 0.16, weight: .semibold))
                            .foregroundStyle(ringColor)
                    }
                    Text(verbatim: valueText)
                        .font(.system(size: valueFontSize, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(.white)
                        .lineLimit(1)
                        .minimumScaleFactor(0.6)
                        .padding(.horizontal, lineWidth + 3)
                }
            }
            .frame(width: size, height: size)

            Text(label)
                .font(.system(size: 11, weight: .semibold))
                .foregroundStyle(.white.opacity(0.75))
                .lineLimit(1)
        }
    }
}

struct GampetooDailyWidgetView: View {
    let entry: GampetooWidgetEntry
    @Environment(\.widgetFamily) private var family

    private let accentYellow = Color(red: 250 / 255, green: 234 / 255, blue: 92 / 255)
    private let accentLime = Color(red: 157 / 255, green: 199 / 255, blue: 48 / 255)
    private let calorieEmerald = Color(red: 74 / 255, green: 222 / 255, blue: 128 / 255)
    private let waterSky = Color(red: 56 / 255, green: 189 / 255, blue: 248 / 255)

    private var snapshot: GampetooSnapshot { entry.snapshot }

    private var calorieProgress: Double {
        guard snapshot.caloriesTarget > 0 else { return 0 }
        return Double(snapshot.caloriesConsumed) / Double(snapshot.caloriesTarget)
    }

    private var proteinProgress: Double {
        let target = snapshot.effectiveProteinTarget
        guard target > 0 else { return 0 }
        return Double(snapshot.proteinGrams) / Double(target)
    }

    private var waterProgress: Double {
        guard snapshot.waterGoal > 0 else { return 0 }
        return Double(snapshot.waterGlasses) / Double(snapshot.waterGoal)
    }

    private var statusIconName: String {
        if snapshot.workoutCompleted {
            return "checkmark.circle.fill"
        }
        return snapshot.workoutActivity == "workout"
            ? "figure.strengthtraining.traditional"
            : "figure.walk"
    }

    private var workoutTitleText: String {
        snapshot.workoutTitle.isEmpty ? "برنامه امروز" : snapshot.workoutTitle
    }

    var body: some View {
        Group {
            if family == .systemSmall {
                smallLayout
            } else {
                mediumLayout
            }
        }
        .environment(\.layoutDirection, .rightToLeft)
        .gampetooWidgetBackground()
    }

    private var smallLayout: some View {
        VStack(spacing: 6) {
            HStack(spacing: 6) {
                Text(workoutTitleText)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(.white)
                    .lineLimit(1)

                Spacer(minLength: 4)

                ZStack {
                    Circle()
                        .fill(.white.opacity(0.10))
                    Image(systemName: statusIconName)
                        .font(.system(size: 11, weight: .semibold))
                        .foregroundStyle(snapshot.workoutCompleted ? accentLime : accentYellow)
                }
                .frame(width: 22, height: 22)
            }

            Rectangle()
                .fill(.white.opacity(0.10))
                .frame(height: 0.75)

            Spacer(minLength: 0)

            HStack(spacing: 8) {
                WidgetMetricRing(
                    valueText: "\(snapshot.caloriesConsumed)",
                    label: "کالری",
                    progress: calorieProgress,
                    ringColor: calorieEmerald,
                    size: 52,
                    lineWidth: 5,
                    valueFontSize: 12.5
                )
                .frame(maxWidth: .infinity)

                WidgetMetricRing(
                    valueText: "\(snapshot.proteinGrams)g",
                    label: "پروتئین",
                    progress: proteinProgress,
                    ringColor: accentYellow,
                    size: 52,
                    lineWidth: 5,
                    valueFontSize: 12.5
                )
                .frame(maxWidth: .infinity)
            }

            Spacer(minLength: 0)
        }
        .gampetooLegacyWidgetPadding(horizontal: 12, vertical: 12)
    }

    private var mediumLayout: some View {
        VStack(spacing: 7) {
            HStack(spacing: 8) {
                ZStack {
                    Circle()
                        .fill(.white.opacity(0.10))
                    Image(systemName: statusIconName)
                        .font(.system(size: 11.5, weight: .semibold))
                        .foregroundStyle(snapshot.workoutCompleted ? accentLime : accentYellow)
                }
                .frame(width: 24, height: 24)

                Text(workoutTitleText)
                    .font(.system(size: 15, weight: .bold))
                    .foregroundStyle(.white)
                    .lineLimit(1)

                if snapshot.workoutActivity == "workout",
                   let total = snapshot.totalExercises, total > 0 {
                    let done = snapshot.completedExercises ?? 0
                    Text(verbatim: "\(done)/\(total)")
                        .font(.system(size: 11, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(done >= total ? accentLime : .white.opacity(0.85))
                        .padding(.horizontal, 7)
                        .padding(.vertical, 2)
                        .background(.white.opacity(0.10), in: Capsule())
                }

                Spacer(minLength: 8)

                Text("Gampetoo")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundStyle(accentYellow.opacity(0.92))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(.white.opacity(0.08), in: Capsule())
            }

            Rectangle()
                .fill(.white.opacity(0.10))
                .frame(height: 0.75)

            Spacer(minLength: 0)

            HStack(spacing: 0) {
                WidgetMetricRing(
                    valueText: "\(snapshot.caloriesConsumed)",
                    label: "کالری",
                    progress: calorieProgress,
                    ringColor: calorieEmerald,
                    size: 58,
                    lineWidth: 5.5,
                    valueFontSize: 13.5
                )
                .frame(maxWidth: .infinity)

                WidgetMetricRing(
                    valueText: "\(snapshot.proteinGrams)g",
                    label: "پروتئین",
                    progress: proteinProgress,
                    ringColor: accentYellow,
                    size: 58,
                    lineWidth: 5.5,
                    valueFontSize: 13.5
                )
                .frame(maxWidth: .infinity)

                WidgetMetricRing(
                    valueText: "\(snapshot.waterGlasses)",
                    label: "آب",
                    progress: waterProgress,
                    ringColor: waterSky,
                    size: 58,
                    lineWidth: 5.5,
                    valueFontSize: 13.5,
                    iconName: "drop.fill"
                )
                .frame(maxWidth: .infinity)
            }

            Spacer(minLength: 0)
        }
        .gampetooLegacyWidgetPadding(horizontal: 14, vertical: 12)
    }
}

struct GampetooDailyWidget: Widget {
    let kind: String = "GampetooDailyWidget"

    var body: some WidgetConfiguration {
        StaticConfiguration(kind: kind, provider: GampetooTimelineProvider()) { entry in
            GampetooDailyWidgetView(entry: entry)
        }
        .configurationDisplayName("برنامه امروز گامپتو")
        .description("خلاصه تمرین امروز، کالری، پروتئین و آب")
        .supportedFamilies([.systemSmall, .systemMedium])
    }
}

/// Non-greedy live countdown text for Dynamic Island & Lock Screen.
///
/// SwiftUI's `Text(timerInterval:countsDown:)` normally proposes infinite
/// horizontal width, causing Dynamic Island's compact & expanded slots to
/// overflow on both sides and apply bilateral fade-truncation. Sizing against
/// a hidden `"00:00"` reference in the exact same monospaced font gives
/// ActivityKit a tight, exact intrinsic width with zero clipping or fading.
@available(iOS 16.2, *)
private struct BoundedCountdownText: View {
    let range: ClosedRange<Date>
    let font: Font
    let color: Color
    var alignment: Alignment = .center
    var textAlignment: TextAlignment = .center
    var placeholder: String = "00:00"

    var body: some View {
        Text(verbatim: placeholder)
            .font(font)
            .monospacedDigit()
            .lineLimit(1)
            .hidden()
            .overlay(alignment: alignment) {
                countdownLabel
            }
            .environment(\.layoutDirection, .leftToRight)
    }

    @ViewBuilder
    private var countdownLabel: some View {
        let base = Text(timerInterval: range, pauseTime: nil, countsDown: true, showsHours: false)
            .font(font)
            .monospacedDigit()
            .foregroundStyle(color)
            .multilineTextAlignment(textAlignment)
            .lineLimit(1)
            .minimumScaleFactor(0.72)

        if #available(iOSApplicationExtension 17.0, *) {
            base.contentTransition(.numericText(countsDown: true))
        } else {
            base
        }
    }
}

@available(iOS 16.2, *)
struct GampetooRestLiveActivity: Widget {
    private let accentYellow = Color(red: 250 / 255, green: 234 / 255, blue: 92 / 255)
    private let accentLime = Color(red: 157 / 255, green: 199 / 255, blue: 48 / 255)
    private let bgForest = Color(red: 19 / 255, green: 47 / 255, blue: 24 / 255)

    private func activeRestRange(for state: GampetooRestTimerAttributes.ContentState) -> ClosedRange<Date>? {
        guard state.isResting else { return nil }
        let now = Date()
        guard state.endAt > now else { return nil }
        let start = state.endAt.addingTimeInterval(-TimeInterval(max(1, state.totalSeconds)))
        return min(start, now)...state.endAt
    }

    var body: some WidgetConfiguration {
        let config = ActivityConfiguration(for: GampetooRestTimerAttributes.self) { context in
            let state = context.state
            let restRange = activeRestRange(for: state)

            VStack(spacing: 8) {
                HStack(spacing: 10) {
                    VStack(alignment: .leading, spacing: 3) {
                        HStack(spacing: 6) {
                            Text(state.workoutTitle.isEmpty ? "تمرین امروز" : state.workoutTitle)
                                .font(.caption2.bold())
                                .foregroundStyle(accentYellow)
                                .lineLimit(1)

                            if state.totalSets > 0 {
                                Text(verbatim: "ست \(state.completedSets)/\(state.totalSets)")
                                    .font(.caption2.bold())
                                    .monospacedDigit()
                                    .foregroundStyle(.white.opacity(0.85))
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(.white.opacity(0.12), in: Capsule())
                            }
                        }

                        Text(state.exerciseName)
                            .font(.headline.bold())
                            .foregroundStyle(.white)
                            .lineLimit(1)
                    }

                    Spacer(minLength: 6)

                    if let restRange {
                        VStack(alignment: .trailing, spacing: 1) {
                            Text("استراحت")
                                .font(.system(size: 10, weight: .semibold))
                                .foregroundStyle(.white.opacity(0.7))
                            BoundedCountdownText(
                                range: restRange,
                                font: .title2.bold(),
                                color: accentYellow,
                                alignment: .trailing,
                                textAlignment: .trailing
                            )
                        }
                    } else {
                        VStack(alignment: .trailing, spacing: 2) {
                            Text("آماده ست بعدی")
                                .font(.caption2.bold())
                                .foregroundStyle(accentLime)
                            if state.totalExercises > 0 {
                                Text(verbatim: "\(state.completedExercises)/\(state.totalExercises) حرکت")
                                    .font(.caption2.monospacedDigit())
                                    .foregroundStyle(.white.opacity(0.75))
                            }
                        }
                    }
                }

                if let restRange {
                    ProgressView(timerInterval: restRange, countsDown: true) {
                        EmptyView()
                    } currentValueLabel: {
                        EmptyView()
                    }
                    .tint(accentYellow)
                } else if state.totalExercises > 0 {
                    ProgressView(
                        value: Double(min(state.completedExercises, state.totalExercises)),
                        total: Double(max(1, state.totalExercises))
                    )
                    .tint(accentLime)
                }
            }
            .environment(\.layoutDirection, .rightToLeft)
            .padding(.horizontal, 16)
            .padding(.vertical, 12)
            .activityBackgroundTint(bgForest)
        } dynamicIsland: { context in
            let state = context.state
            let restRange = activeRestRange(for: state)

            return DynamicIsland {
                DynamicIslandExpandedRegion(.leading) {
                    VStack(alignment: .leading, spacing: 2) {
                        Text(state.exerciseName)
                            .font(.caption.bold())
                            .foregroundStyle(.white)
                            .lineLimit(1)
                        if state.totalSets > 0 {
                            Text(verbatim: "ست \(state.completedSets) از \(state.totalSets)")
                                .font(.caption2)
                                .foregroundStyle(.white.opacity(0.7))
                        }
                    }
                }
                DynamicIslandExpandedRegion(.trailing) {
                    if let restRange {
                        BoundedCountdownText(
                            range: restRange,
                            font: .system(size: 16, weight: .bold, design: .rounded),
                            color: accentYellow,
                            alignment: .trailing,
                            textAlignment: .trailing
                        )
                        .padding(.trailing, 2)
                    } else if state.totalExercises > 0 {
                        Text(verbatim: "\(state.completedExercises)/\(state.totalExercises)")
                            .font(.headline.monospacedDigit().bold())
                            .foregroundStyle(accentLime)
                            .lineLimit(1)
                            .minimumScaleFactor(0.75)
                            .fixedSize()
                    } else {
                        Image(systemName: "figure.strengthtraining.traditional")
                            .foregroundStyle(accentLime)
                    }
                }
                DynamicIslandExpandedRegion(.bottom) {
                    if let restRange {
                        VStack(spacing: 4) {
                            ProgressView(timerInterval: restRange, countsDown: true) {
                                EmptyView()
                            } currentValueLabel: {
                                EmptyView()
                            }
                            .tint(accentYellow)
                            Text("استراحت تا ست بعدی ⏱️")
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    } else {
                        Text("\(state.workoutTitle) · آماده ست بعدی 💪")
                            .font(.caption2.bold())
                            .foregroundStyle(accentLime)
                            .lineLimit(1)
                    }
                }
            } compactLeading: {
                Image(systemName: restRange != nil ? "timer" : "figure.strengthtraining.traditional")
                    .font(.system(size: 13, weight: .semibold))
                    .foregroundStyle(restRange != nil ? accentYellow : accentLime)
                    .padding(.leading, 2)
            } compactTrailing: {
                if let restRange {
                    BoundedCountdownText(
                        range: restRange,
                        font: .system(size: 12, weight: .bold, design: .rounded),
                        color: accentYellow,
                        alignment: .center,
                        textAlignment: .center,
                        placeholder: "00:00"
                    )
                    .padding(.trailing, 2)
                } else if state.totalExercises > 0 {
                    Text(verbatim: "\(state.completedExercises)/\(state.totalExercises)")
                        .font(.system(size: 12, weight: .bold, design: .rounded))
                        .monospacedDigit()
                        .foregroundStyle(accentLime)
                        .lineLimit(1)
                        .minimumScaleFactor(0.75)
                        .fixedSize()
                        .padding(.trailing, 2)
                } else {
                    Text("💪")
                        .font(.caption)
                }
            } minimal: {
                Image(systemName: restRange != nil ? "timer" : "figure.strengthtraining.traditional")
                    .foregroundStyle(restRange != nil ? accentYellow : accentLime)
            }
        }

        if #available(iOSApplicationExtension 18.0, *) {
            return config.supplementalActivityFamilies([.small])
        } else {
            return config
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
