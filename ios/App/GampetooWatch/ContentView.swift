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
    static let forestTop = Color(red: 29 / 255, green: 71 / 255, blue: 36 / 255)
    static let forestBottom = Color(red: 14 / 255, green: 34 / 255, blue: 18 / 255)
    static let yellow = Color(red: 250 / 255, green: 234 / 255, blue: 92 / 255)
    static let lime = Color(red: 157 / 255, green: 199 / 255, blue: 48 / 255)
}

// MARK: - Tab 1: Today Summary

private struct TodaySummaryWatchView: View {
    @EnvironmentObject private var store: GampetooWatchStore

    private var calorieProgress: Double {
        guard store.state.caloriesTarget > 0 else { return 0 }
        return min(1.0, Double(store.state.caloriesConsumed) / Double(store.state.caloriesTarget))
    }

    private var remainingCalories: Int {
        max(0, store.state.caloriesTarget - store.state.caloriesConsumed)
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

                VStack(alignment: .leading, spacing: 3) {
                    Text(store.state.workoutTitle)
                        .font(.headline.bold())
                        .foregroundStyle(.white)
                        .lineLimit(1)
                    Text(store.state.workoutCompleted ? "تکمیل شده ✅" : "برنامه امروز")
                        .font(.caption2)
                        .foregroundStyle(.white.opacity(0.65))
                }
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(10)
                .background(.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 16, style: .continuous))

                HStack(spacing: 10) {
                    ZStack {
                        Circle()
                            .stroke(.white.opacity(0.15), lineWidth: 6)
                        Circle()
                            .trim(from: 0, to: calorieProgress)
                            .stroke(GampetooColors.lime, style: StrokeStyle(lineWidth: 6, lineCap: .round))
                            .rotationEffect(.degrees(-90))
                        VStack(spacing: 0) {
                            Text("\(remainingCalories)")
                                .font(.caption.bold())
                                .monospacedDigit()
                            Text("مانده")
                                .font(.system(size: 9))
                                .foregroundStyle(.white.opacity(0.65))
                        }
                    }
                    .frame(width: 58, height: 58)

                    VStack(alignment: .leading, spacing: 6) {
                        Label("\(store.state.proteinGrams)g پروتئین", systemImage: "flame.fill")
                            .font(.caption2.bold())
                            .foregroundStyle(GampetooColors.yellow)
                        Label("\(store.state.waterGlasses)/\(store.state.waterGoal) آب", systemImage: "drop.fill")
                            .font(.caption2.bold())
                            .foregroundStyle(.cyan)
                    }
                    .frame(maxWidth: .infinity, alignment: .leading)
                }
                .padding(.top, 2)
            }
            .padding(.horizontal, 6)
        }
        .containerBackground(
            LinearGradient(colors: [GampetooColors.forestTop, GampetooColors.forestBottom], startPoint: .top, endPoint: .bottom),
            for: .tabView
        )
    }
}

// MARK: - Tab 2: Today's Workout & Wrist Rest Timer

private struct WorkoutWatchView: View {
    @EnvironmentObject private var store: GampetooWatchStore

    private func formatMMSS(_ seconds: Int) -> String {
        let m = seconds / 60
        let s = seconds % 60
        return String(format: "%d:%02d", m, s)
    }

    var body: some View {
        ScrollView {
            VStack(spacing: 8) {
                HStack {
                    Text("تمرین امروز")
                        .font(.caption.bold())
                        .foregroundStyle(GampetooColors.yellow)
                    Spacer()
                }

                if store.restEndAt != nil {
                    HStack {
                        Image(systemName: "timer")
                            .foregroundStyle(GampetooColors.yellow)
                        VStack(alignment: .leading, spacing: 1) {
                            Text("استراحت: \(formatMMSS(store.restSecondsLeft))")
                                .font(.caption.bold())
                                .monospacedDigit()
                                .foregroundStyle(GampetooColors.yellow)
                            Text(store.restExerciseName)
                                .font(.system(size: 10))
                                .foregroundStyle(.white.opacity(0.75))
                                .lineLimit(1)
                        }
                        Spacer()
                        Button {
                            store.stopRestTimer()
                        } label: {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundStyle(.white.opacity(0.6))
                        }
                        .buttonStyle(.plain)
                    }
                    .padding(8)
                    .background(GampetooColors.yellow.opacity(0.16), in: RoundedRectangle(cornerRadius: 14, style: .continuous))
                }

                if store.state.exercises.isEmpty {
                    Text(store.state.workoutActivity == "rest" ? "امروز روز استراحت و پیاده‌روی است" : "اپ آیفون را باز کنید تا حرکات همگام شوند")
                        .font(.caption2)
                        .foregroundStyle(.white.opacity(0.7))
                        .multilineTextAlignment(.center)
                        .padding(.vertical, 12)
                } else {
                    ForEach(store.state.exercises) { exercise in
                        Button {
                            store.logExerciseSet(exercise)
                        } label: {
                            HStack {
                                VStack(alignment: .leading, spacing: 2) {
                                    Text(exercise.name)
                                        .font(.caption.bold())
                                        .foregroundStyle(.white)
                                        .lineLimit(1)
                                    Text("\(exercise.completedSets)/\(exercise.sets) ست · \(exercise.reps) تکرار")
                                        .font(.system(size: 10))
                                        .monospacedDigit()
                                        .foregroundStyle(.white.opacity(0.65))
                                }
                                Spacer()
                                Image(systemName: exercise.completedSets >= exercise.sets ? "checkmark.circle.fill" : "plus.circle.fill")
                                    .foregroundStyle(exercise.completedSets >= exercise.sets ? GampetooColors.lime : GampetooColors.yellow)
                            }
                            .padding(.vertical, 6)
                            .padding(.horizontal, 8)
                            .background(.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 12, style: .continuous))
                        }
                        .buttonStyle(.plain)
                    }
                }

                if !store.state.workoutCompleted {
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
                    .stroke(Color.cyan, style: StrokeStyle(lineWidth: 8, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .animation(.spring(response: 0.35), value: progress)

                VStack(spacing: 2) {
                    Text("💧")
                        .font(.title3)
                    Text("\(store.state.waterGlasses) / \(store.state.waterGoal)")
                        .font(.headline.bold())
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
            .tint(.cyan)
        }
        .padding(.horizontal, 8)
        .containerBackground(
            LinearGradient(colors: [GampetooColors.forestTop, GampetooColors.forestBottom], startPoint: .top, endPoint: .bottom),
            for: .tabView
        )
    }
}
