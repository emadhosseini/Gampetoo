import SwiftUI

struct ContentView: View {
    @EnvironmentObject private var store: GampetooWatchStore

    var body: some View {
        TabView {
            TodaySummaryWatchView()
            WorkoutWatchView()
            WaterWatchView()
        }
        .tabViewStyle(.verticalPage)
    }
}

private enum GampetooColors {
    static let forestTop = Color(red: 28 / 255, green: 68 / 255, blue: 35 / 255)
    static let forestBottom = Color(red: 13 / 255, green: 33 / 255, blue: 17 / 255)
    static let yellow = Color(red: 250 / 255, green: 234 / 255, blue: 92 / 255)
    static let lime = Color(red: 157 / 255, green: 199 / 255, blue: 48 / 255)
    static let emerald = Color(red: 74 / 255, green: 222 / 255, blue: 128 / 255)
    static let sky = Color(red: 56 / 255, green: 189 / 255, blue: 248 / 255)
    static let countdownAlert = Color(red: 251 / 255, green: 113 / 255, blue: 133 / 255)
}

private func formatMMSS(_ seconds: Int) -> String {
    let safe = max(0, seconds)
    let m = safe / 60
    let s = safe % 60
    return String(format: "%d:%02d", m, s)
}

private func formatWeight(_ value: Double) -> String {
    if value.truncatingRemainder(dividingBy: 1) == 0 {
        return "\(Int(value))"
    }
    return String(format: "%.1f", value)
}

// MARK: - Shared Live Rest Timer Banner

private struct WatchRestBannerView: View {
    @EnvironmentObject private var store: GampetooWatchStore

    private var isFinalCountdown: Bool {
        store.restSecondsLeft > 0 && store.restSecondsLeft <= 5
    }

    private var progress: Double {
        guard store.restTotalSeconds > 0 else { return 0 }
        return min(1.0, max(0.0, Double(store.restSecondsLeft) / Double(store.restTotalSeconds)))
    }

    private var accentColor: Color {
        isFinalCountdown ? GampetooColors.countdownAlert : GampetooColors.yellow
    }

    var body: some View {
        if store.restEndAt != nil {
            VStack(spacing: 6) {
                HStack(spacing: 8) {
                    ZStack {
                        Circle()
                            .stroke(.white.opacity(0.15), lineWidth: 3.5)
                        Circle()
                            .trim(from: 0, to: progress)
                            .stroke(accentColor, style: StrokeStyle(lineWidth: 3.5, lineCap: .round))
                            .rotationEffect(.degrees(-90))
                            .animation(.linear(duration: 0.25), value: progress)

                        Image(systemName: "timer")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundStyle(accentColor)
                    }
                    .frame(width: 28, height: 28)

                    VStack(alignment: .leading, spacing: 1) {
                        Text(isFinalCountdown ? "آماده باش! \(store.restSecondsLeft)" : "استراحت: \(formatMMSS(store.restSecondsLeft))")
                            .font(.system(size: 14, weight: .bold, design: .rounded))
                            .monospacedDigit()
                            .foregroundStyle(accentColor)
                        if !store.restExerciseName.isEmpty {
                            Text(store.restExerciseName)
                                .font(.system(size: 10))
                                .foregroundStyle(.white.opacity(0.75))
                                .lineLimit(1)
                        }
                    }

                    Spacer(minLength: 2)
                }

                HStack(spacing: 6) {
                    Button {
                        store.extendRestTimer(by: 15)
                    } label: {
                        Text("+۱۵ ثانیه")
                            .font(.system(size: 10, weight: .bold))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 4)
                            .background(.white.opacity(0.12), in: Capsule())
                    }
                    .buttonStyle(.plain)

                    Button {
                        store.stopRestTimer(broadcastToPhone: true)
                    } label: {
                        Text("رد کردن")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundStyle(.white.opacity(0.85))
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 4)
                            .background(.white.opacity(0.08), in: Capsule())
                    }
                    .buttonStyle(.plain)
                }
            }
            .padding(9)
            .background(
                accentColor.opacity(isFinalCountdown ? 0.22 : 0.14),
                in: RoundedRectangle(cornerRadius: 14, style: .continuous)
            )
            .overlay(
                RoundedRectangle(cornerRadius: 14, style: .continuous)
                    .stroke(accentColor.opacity(isFinalCountdown ? 0.6 : 0.28), lineWidth: 1)
            )
        }
    }
}

// MARK: - Mini Circular Ring Metric

private struct WatchMiniRing: View {
    let valueText: String
    let label: String
    let progress: Double
    let color: Color

    private var clamped: Double {
        min(1.0, max(0.0, progress))
    }

    var body: some View {
        VStack(spacing: 3) {
            ZStack {
                Circle()
                    .stroke(.white.opacity(0.14), lineWidth: 4.5)
                if clamped > 0 {
                    Circle()
                        .trim(from: 0, to: clamped)
                        .stroke(color, style: StrokeStyle(lineWidth: 4.5, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                }
                Text(verbatim: valueText)
                    .font(.system(size: 11, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(.white)
                    .lineLimit(1)
                    .minimumScaleFactor(0.6)
                    .padding(.horizontal, 5)
            }
            .frame(width: 44, height: 44)

            Text(label)
                .font(.system(size: 9.5, weight: .semibold))
                .foregroundStyle(.white.opacity(0.7))
                .lineLimit(1)
        }
    }
}

// MARK: - Tab 1: Today Summary

private struct TodaySummaryWatchView: View {
    @EnvironmentObject private var store: GampetooWatchStore

    private var calorieProgress: Double {
        guard store.state.caloriesTarget > 0 else { return 0 }
        return Double(store.state.caloriesConsumed) / Double(store.state.caloriesTarget)
    }

    private var proteinProgress: Double {
        let target = store.state.proteinTarget > 0 ? store.state.proteinTarget : 150
        return Double(store.state.proteinGrams) / Double(target)
    }

    private var waterProgress: Double {
        guard store.state.waterGoal > 0 else { return 0 }
        return Double(store.state.waterGlasses) / Double(store.state.waterGoal)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 10) {
                HStack {
                    Text("گمپتو")
                        .font(.caption.bold())
                        .foregroundStyle(GampetooColors.yellow)
                    Spacer()
                    Image(systemName: store.state.workoutCompleted ? "checkmark.circle.fill" : "figure.strengthtraining.traditional")
                        .foregroundStyle(store.state.workoutCompleted ? GampetooColors.lime : .white)
                }

                WatchRestBannerView()

                VStack(alignment: .leading, spacing: 5) {
                    HStack {
                        Text(store.state.workoutTitle)
                            .font(.headline.bold())
                            .foregroundStyle(.white)
                            .lineLimit(1)
                        Spacer(minLength: 4)
                        if store.state.totalExercises > 0 {
                            Text(verbatim: "\(store.state.completedExercises)/\(store.state.totalExercises)")
                                .font(.system(size: 11, weight: .bold, design: .rounded))
                                .monospacedDigit()
                                .foregroundStyle(GampetooColors.lime)
                        }
                    }

                    Text(store.state.workoutCompleted ? "تکمیل شده ✅" : "برای تمرین به پایین اسکرول کن")
                        .font(.system(size: 10))
                        .foregroundStyle(.white.opacity(0.65))
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(10)
                .background(.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 15, style: .continuous))

                HStack(spacing: 6) {
                    WatchMiniRing(
                        valueText: "\(store.state.caloriesConsumed)",
                        label: "کالری",
                        progress: calorieProgress,
                        color: GampetooColors.emerald
                    )
                    .frame(maxWidth: .infinity)

                    WatchMiniRing(
                        valueText: "\(store.state.proteinGrams)g",
                        label: "پروتئین",
                        progress: proteinProgress,
                        color: GampetooColors.yellow
                    )
                    .frame(maxWidth: .infinity)

                    WatchMiniRing(
                        valueText: "\(store.state.waterGlasses)",
                        label: "آب",
                        progress: waterProgress,
                        color: GampetooColors.sky
                    )
                    .frame(maxWidth: .infinity)
                }
                .padding(.top, 2)
            }
            .padding(.horizontal, 4)
        }
        .containerBackground(
            LinearGradient(colors: [GampetooColors.forestTop, GampetooColors.forestBottom], startPoint: .top, endPoint: .bottom),
            for: .tabView
        )
    }
}

// MARK: - Tab 2: Today's Workout (Exercises + Practical Set Logger)

private struct WorkoutWatchView: View {
    @EnvironmentObject private var store: GampetooWatchStore

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 8) {
                    HStack {
                        Text(store.state.workoutTitle.isEmpty ? "تمرین امروز" : store.state.workoutTitle)
                            .font(.caption.bold())
                            .foregroundStyle(GampetooColors.yellow)
                            .lineLimit(1)
                        Spacer()
                        if store.state.totalExercises > 0 {
                            Text(verbatim: "\(store.state.completedExercises)/\(store.state.totalExercises)")
                                .font(.caption2.bold())
                                .monospacedDigit()
                                .foregroundStyle(GampetooColors.lime)
                        }
                    }

                    WatchRestBannerView()

                    if store.state.exercises.isEmpty {
                        VStack(spacing: 8) {
                            Text(store.state.workoutActivity == "rest"
                                 ? "امروز روز استراحت و پیاده‌روی است"
                                 : "اپ آیفون را باز کنید تا حرکات همگام شوند")
                                .font(.caption2)
                                .foregroundStyle(.white.opacity(0.7))
                                .multilineTextAlignment(.center)

                            Button {
                                store.requestRefresh()
                            } label: {
                                Label("به‌روزرسانی", systemImage: "arrow.clockwise")
                                    .font(.caption2.bold())
                            }
                            .tint(GampetooColors.yellow)
                        }
                        .padding(.vertical, 12)
                    } else {
                        ForEach(store.state.exercises) { exercise in
                            NavigationLink {
                                ExerciseDetailWatchView(exerciseId: exercise.id)
                            } label: {
                                ExerciseRowWatchView(exercise: exercise)
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    if !store.state.workoutCompleted && !store.state.exercises.isEmpty {
                        Button {
                            store.completeTodayWorkout()
                        } label: {
                            Text("اتمام تمرین ✓")
                                .font(.caption.bold())
                                .frame(maxWidth: .infinity)
                        }
                        .tint(GampetooColors.lime)
                        .padding(.top, 4)
                    }
                }
                .padding(.horizontal, 4)
            }
            .containerBackground(
                LinearGradient(colors: [GampetooColors.forestTop, GampetooColors.forestBottom], startPoint: .top, endPoint: .bottom),
                for: .tabView
            )
        }
    }
}

private struct ExerciseRowWatchView: View {
    let exercise: WatchExerciseItem

    private var isDone: Bool {
        exercise.checked || (exercise.totalSetsCount > 0 && exercise.confirmedSetsCount >= exercise.totalSetsCount)
    }

    private var nextSetPreview: String {
        let target = exercise.entries.first(where: { !$0.confirmed }) ?? exercise.entries.last
        guard let target else {
            return "\(exercise.reps) \(exercise.unitLabel)"
        }
        if exercise.isDuration {
            return "\(target.reps) \(exercise.unitLabel)"
        }
        if target.weight > 0 {
            return "\(formatWeight(target.weight))kg × \(target.reps)"
        }
        return "\(target.reps) \(exercise.unitLabel)"
    }

    private var setProgress: Double {
        guard exercise.totalSetsCount > 0 else { return 0 }
        return min(1.0, Double(exercise.confirmedSetsCount) / Double(exercise.totalSetsCount))
    }

    var body: some View {
        HStack(spacing: 8) {
            VStack(alignment: .leading, spacing: 3) {
                Text(exercise.name)
                    .font(.system(size: 13, weight: .bold))
                    .foregroundStyle(isDone ? .white.opacity(0.6) : .white)
                    .lineLimit(2)
                    .multilineTextAlignment(.leading)

                HStack(spacing: 5) {
                    Text(verbatim: "\(exercise.confirmedSetsCount)/\(exercise.totalSetsCount) ست")
                        .font(.system(size: 10, weight: .semibold))
                        .monospacedDigit()
                        .foregroundStyle(isDone ? GampetooColors.lime : GampetooColors.yellow)

                    Text("·")
                        .font(.system(size: 10))
                        .foregroundStyle(.white.opacity(0.35))

                    Text(nextSetPreview)
                        .font(.system(size: 10))
                        .monospacedDigit()
                        .foregroundStyle(.white.opacity(0.7))
                        .lineLimit(1)
                }
            }

            Spacer(minLength: 2)

            if isDone {
                Image(systemName: "checkmark.circle.fill")
                    .font(.system(size: 19))
                    .foregroundStyle(GampetooColors.lime)
            } else {
                ZStack {
                    Circle()
                        .stroke(.white.opacity(0.18), lineWidth: 3)
                    Circle()
                        .trim(from: 0, to: setProgress)
                        .stroke(GampetooColors.yellow, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                        .rotationEffect(.degrees(-90))
                    Image(systemName: "chevron.left")
                        .font(.system(size: 8.5, weight: .bold))
                        .foregroundStyle(.white.opacity(0.8))
                }
                .frame(width: 22, height: 22)
            }
        }
        .padding(.vertical, 8)
        .padding(.horizontal, 10)
        .background(
            isDone ? Color.white.opacity(0.05) : Color.white.opacity(0.09),
            in: RoundedRectangle(cornerRadius: 14, style: .continuous)
        )
    }
}

// MARK: - Dedicated Exercise Detail & Interactive Set Logger on Watch

private struct ExerciseDetailWatchView: View {
    let exerciseId: String
    @EnvironmentObject private var store: GampetooWatchStore
    @State private var selectedSetIndex: Int = 0

    private var exercise: WatchExerciseItem? {
        store.exercise(for: exerciseId)
    }

    private func autoSelectNextUnconfirmed(in ex: WatchExerciseItem) {
        if let nextIdx = ex.entries.firstIndex(where: { !$0.confirmed }) {
            selectedSetIndex = nextIdx
        } else if !ex.entries.isEmpty {
            selectedSetIndex = ex.entries.count - 1
        }
    }

    var body: some View {
        ScrollView {
            if let ex = exercise {
                let safeIdx = min(max(0, selectedSetIndex), max(0, ex.entries.count - 1))
                let activeSet = ex.entries.indices.contains(safeIdx) ? ex.entries[safeIdx] : nil

                VStack(spacing: 8) {
                    WatchRestBannerView()

                    // Exercise Header + Done Toggle
                    HStack(spacing: 6) {
                        VStack(alignment: .leading, spacing: 2) {
                            Text(ex.name)
                                .font(.system(size: 13.5, weight: .bold))
                                .foregroundStyle(.white)
                                .lineLimit(2)
                            Text(verbatim: "\(ex.confirmedSetsCount) از \(ex.totalSetsCount) ست ثبت شده")
                                .font(.system(size: 10))
                                .foregroundStyle(.white.opacity(0.65))
                        }

                        Spacer(minLength: 4)

                        Button {
                            store.toggleExerciseChecked(exerciseId: ex.id)
                        } label: {
                            Image(systemName: ex.checked ? "checkmark.circle.fill" : "circle")
                                .font(.system(size: 20))
                                .foregroundStyle(ex.checked ? GampetooColors.lime : .white.opacity(0.45))
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(.horizontal, 2)

                    // Active Set Interactive Editor Card
                    if let currentSet = activeSet {
                        VStack(spacing: 8) {
                            HStack {
                                Text(verbatim: "ست \(safeIdx + 1)")
                                    .font(.caption.bold())
                                    .foregroundStyle(GampetooColors.yellow)
                                Spacer()
                                if currentSet.confirmed {
                                    Label("ثبت شده", systemImage: "checkmark.circle.fill")
                                        .font(.system(size: 10, weight: .bold))
                                        .foregroundStyle(GampetooColors.lime)
                                }
                            }

                            if !ex.isDuration {
                                WatchStepperRow(
                                    label: "وزنه (kg)",
                                    valueText: formatWeight(currentSet.weight),
                                    disabled: currentSet.confirmed,
                                    onDecrement: {
                                        let step = currentSet.weight <= 10 ? 2.5 : 2.5
                                        store.updateSet(
                                            exerciseId: ex.id,
                                            setIndex: safeIdx,
                                            weight: max(0, currentSet.weight - step),
                                            reps: currentSet.reps
                                        )
                                    },
                                    onIncrement: {
                                        let step = 2.5
                                        store.updateSet(
                                            exerciseId: ex.id,
                                            setIndex: safeIdx,
                                            weight: currentSet.weight + step,
                                            reps: currentSet.reps
                                        )
                                    }
                                )
                            }

                            WatchStepperRow(
                                label: ex.unitLabel,
                                valueText: "\(currentSet.reps)",
                                disabled: currentSet.confirmed,
                                onDecrement: {
                                    store.updateSet(
                                        exerciseId: ex.id,
                                        setIndex: safeIdx,
                                        weight: currentSet.weight,
                                        reps: max(0, currentSet.reps - ex.repsStep)
                                    )
                                },
                                onIncrement: {
                                    store.updateSet(
                                        exerciseId: ex.id,
                                        setIndex: safeIdx,
                                        weight: currentSet.weight,
                                        reps: currentSet.reps + ex.repsStep
                                    )
                                }
                            )

                            if !currentSet.confirmed {
                                Button {
                                    store.confirmSet(exerciseId: ex.id, setIndex: safeIdx)
                                    if let updated = store.exercise(for: ex.id) {
                                        autoSelectNextUnconfirmed(in: updated)
                                    }
                                } label: {
                                    Label("تایید ست \(safeIdx + 1)", systemImage: "checkmark")
                                        .font(.system(size: 13, weight: .bold))
                                        .frame(maxWidth: .infinity)
                                }
                                .tint(GampetooColors.lime)
                                .padding(.top, 2)
                            }
                        }
                        .padding(10)
                        .background(.white.opacity(0.09), in: RoundedRectangle(cornerRadius: 16, style: .continuous))
                    }

                    // All Sets List
                    VStack(spacing: 5) {
                        ForEach(Array(ex.entries.enumerated()), id: \.element.id) { idx, entry in
                            let isSelected = idx == safeIdx
                            Button {
                                selectedSetIndex = idx
                            } label: {
                                HStack {
                                    Text(verbatim: "ست \(idx + 1)")
                                        .font(.system(size: 11, weight: .bold))
                                        .foregroundStyle(isSelected ? GampetooColors.yellow : .white.opacity(0.8))

                                    Spacer()

                                    Text(ex.isDuration
                                         ? "\(entry.reps) \(ex.unitLabel)"
                                         : "\(formatWeight(entry.weight))kg × \(entry.reps)")
                                        .font(.system(size: 11, weight: .medium))
                                        .monospacedDigit()
                                        .foregroundStyle(.white.opacity(0.85))

                                    Image(systemName: entry.confirmed ? "checkmark.circle.fill" : "circle")
                                        .font(.system(size: 13))
                                        .foregroundStyle(entry.confirmed ? GampetooColors.lime : .white.opacity(0.3))
                                }
                                .padding(.horizontal, 10)
                                .padding(.vertical, 7)
                                .background(
                                    isSelected ? GampetooColors.yellow.opacity(0.14) : Color.white.opacity(0.06),
                                    in: RoundedRectangle(cornerRadius: 11, style: .continuous)
                                )
                                .overlay(
                                    RoundedRectangle(cornerRadius: 11, style: .continuous)
                                        .stroke(isSelected ? GampetooColors.yellow.opacity(0.45) : .clear, lineWidth: 1)
                                )
                            }
                            .buttonStyle(.plain)
                        }
                    }

                    Button {
                        store.addSet(exerciseId: ex.id)
                        if let updated = store.exercise(for: ex.id) {
                            selectedSetIndex = max(0, updated.entries.count - 1)
                        }
                    } label: {
                        Label("افزودن ست", systemImage: "plus")
                            .font(.caption2.bold())
                            .frame(maxWidth: .infinity)
                    }
                    .tint(.white.opacity(0.16))
                }
                .padding(.horizontal, 4)
                .onAppear {
                    autoSelectNextUnconfirmed(in: ex)
                }
            }
        }
        .containerBackground(
            LinearGradient(colors: [GampetooColors.forestTop, GampetooColors.forestBottom], startPoint: .top, endPoint: .bottom),
            for: .navigation
        )
    }
}

private struct WatchStepperRow: View {
    let label: String
    let valueText: String
    let disabled: Bool
    let onDecrement: () -> Void
    let onIncrement: () -> Void

    var body: some View {
        VStack(spacing: 3) {
            Text(label)
                .font(.system(size: 9.5))
                .foregroundStyle(.white.opacity(0.6))
                .frame(maxWidth: .infinity, alignment: .leading)

            HStack(spacing: 6) {
                Button(action: onDecrement) {
                    Image(systemName: "minus")
                        .font(.system(size: 12, weight: .bold))
                        .frame(width: 30, height: 28)
                        .background(.white.opacity(0.12), in: Circle())
                }
                .buttonStyle(.plain)
                .disabled(disabled)
                .opacity(disabled ? 0.35 : 1)

                Text(verbatim: valueText)
                    .font(.system(size: 15, weight: .bold, design: .rounded))
                    .monospacedDigit()
                    .foregroundStyle(.white)
                    .frame(maxWidth: .infinity)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)

                Button(action: onIncrement) {
                    Image(systemName: "plus")
                        .font(.system(size: 12, weight: .bold))
                        .frame(width: 30, height: 28)
                        .background(.white.opacity(0.12), in: Circle())
                }
                .buttonStyle(.plain)
                .disabled(disabled)
                .opacity(disabled ? 0.35 : 1)
            }
        }
    }
}

// MARK: - Tab 3: Quick Water Logger

private struct WaterWatchView: View {
    @EnvironmentObject private var store: GampetooWatchStore

    private var progress: Double {
        guard store.state.waterGoal > 0 else { return 0 }
        return min(1.0, Double(store.state.waterGlasses) / Double(store.state.waterGoal))
    }

    var body: some View {
        VStack(spacing: 10) {
            ZStack {
                Circle()
                    .stroke(.white.opacity(0.15), lineWidth: 8)
                Circle()
                    .trim(from: 0, to: progress)
                    .stroke(GampetooColors.sky, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .animation(.spring(response: 0.35), value: progress)

                VStack(spacing: 2) {
                    Image(systemName: "drop.fill")
                        .font(.system(size: 16))
                        .foregroundStyle(GampetooColors.sky)
                    Text(verbatim: "\(store.state.waterGlasses)")
                        .font(.title2.bold())
                        .monospacedDigit()
                        .foregroundStyle(.white)
                    Text("لیوان آب")
                        .font(.system(size: 10))
                        .foregroundStyle(.white.opacity(0.65))
                }
            }
            .frame(width: 96, height: 96)

            Button {
                store.addWaterGlass()
            } label: {
                Label("۱+ لیوان", systemImage: "drop.fill")
                    .font(.caption.bold())
                    .frame(maxWidth: .infinity)
            }
            .tint(GampetooColors.sky)
        }
        .padding(.horizontal, 8)
        .containerBackground(
            LinearGradient(colors: [GampetooColors.forestTop, GampetooColors.forestBottom], startPoint: .top, endPoint: .bottom),
            for: .tabView
        )
    }
}
