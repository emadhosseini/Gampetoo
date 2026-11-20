import Foundation

#if canImport(HealthKit)
import HealthKit
#endif

/// Two-way Apple Health (HealthKit) integration for Gampetoo.
/// Reads today's steps, active calories burned (from Apple Watch / iPhone),
/// dietary water, and latest bodyweight; writes workouts, walks, water, and
/// weight logged inside Gampetoo back to Apple Health.
final class GampetooHealthManager {
    static let shared = GampetooHealthManager()

    private init() {}

    #if canImport(HealthKit)
    private let store = HKHealthStore()

    var isAvailable: Bool {
        HKHealthStore.isHealthDataAvailable()
    }

    private var readTypes: Set<HKObjectType> {
        var types: Set<HKObjectType> = [HKObjectType.workoutType()]
        let identifiers: [HKQuantityTypeIdentifier] = [
            .stepCount,
            .activeEnergyBurned,
            .bodyMass,
            .dietaryWater,
        ]
        for id in identifiers {
            if let t = HKObjectType.quantityType(forIdentifier: id) {
                types.insert(t)
            }
        }
        return types
    }

    private var writeTypes: Set<HKSampleType> {
        var types: Set<HKSampleType> = [HKObjectType.workoutType()]
        let identifiers: [HKQuantityTypeIdentifier] = [
            .activeEnergyBurned,
            .bodyMass,
            .dietaryWater,
        ]
        for id in identifiers {
            if let t = HKObjectType.quantityType(forIdentifier: id) {
                types.insert(t)
            }
        }
        return types
    }

    func requestAuthorization(completion: @escaping (Bool, String?) -> Void) {
        guard isAvailable else {
            completion(false, "Apple Health روی این دستگاه در دسترس نیست.")
            return
        }

        store.requestAuthorization(toShare: writeTypes, read: readTypes) { success, error in
            completion(success, error?.localizedDescription)
        }
    }

    func fetchTodaySummary(completion: @escaping ([String: Any]) -> Void) {
        guard isAvailable else {
            completion(["available": false, "steps": 0, "activeCalories": 0, "waterMl": 0])
            return
        }

        let calendar = Calendar.current
        let startOfDay = calendar.startOfDay(for: Date())
        let now = Date()
        let todayPredicate = HKQuery.predicateForSamples(withStart: startOfDay, end: now, options: .strictStartDate)

        let group = DispatchGroup()
        var steps: Double = 0
        var activeCalories: Double = 0
        var waterMl: Double = 0
        var latestWeightKg: Double?

        // 1. Today's cumulative steps
        if let stepType = HKQuantityType.quantityType(forIdentifier: .stepCount) {
            group.enter()
            let query = HKStatisticsQuery(
                quantityType: stepType,
                quantitySamplePredicate: todayPredicate,
                options: .cumulativeSum
            ) { _, stats, _ in
                if let sum = stats?.sumQuantity() {
                    steps = sum.doubleValue(for: .count())
                }
                group.leave()
            }
            store.execute(query)
        }

        // 2. Today's cumulative active calories burned (Apple Watch Move ring)
        if let energyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) {
            group.enter()
            let query = HKStatisticsQuery(
                quantityType: energyType,
                quantitySamplePredicate: todayPredicate,
                options: .cumulativeSum
            ) { _, stats, _ in
                if let sum = stats?.sumQuantity() {
                    activeCalories = sum.doubleValue(for: .kilocalorie())
                }
                group.leave()
            }
            store.execute(query)
        }

        // 3. Today's cumulative dietary water (mL)
        if let waterType = HKQuantityType.quantityType(forIdentifier: .dietaryWater) {
            group.enter()
            let query = HKStatisticsQuery(
                quantityType: waterType,
                quantitySamplePredicate: todayPredicate,
                options: .cumulativeSum
            ) { _, stats, _ in
                if let sum = stats?.sumQuantity() {
                    waterMl = sum.doubleValue(for: .literUnit(with: .milli))
                }
                group.leave()
            }
            store.execute(query)
        }

        // 4. Most recent bodyweight sample
        if let weightType = HKQuantityType.quantityType(forIdentifier: .bodyMass) {
            group.enter()
            let sort = NSSortDescriptor(key: HKSampleSortIdentifierEndDate, ascending: false)
            let query = HKSampleQuery(
                sampleType: weightType,
                predicate: nil,
                limit: 1,
                sortDescriptors: [sort]
            ) { _, samples, _ in
                if let sample = samples?.first as? HKQuantitySample {
                    latestWeightKg = sample.quantity.doubleValue(for: .gramUnit(with: .kilo))
                }
                group.leave()
            }
            store.execute(query)
        }

        group.notify(queue: .main) {
            var result: [String: Any] = [
                "available": true,
                "steps": Int(steps.rounded()),
                "activeCalories": Int(activeCalories.rounded()),
                "waterMl": Int(waterMl.rounded()),
            ]
            if let kg = latestWeightKg {
                result["latestWeightKg"] = (kg * 100).rounded() / 100
            }
            completion(result)
        }
    }

    func logWater(milliliters: Double, completion: @escaping (Bool) -> Void) {
        guard isAvailable, milliliters > 0,
              let waterType = HKQuantityType.quantityType(forIdentifier: .dietaryWater) else {
            completion(false)
            return
        }

        let now = Date()
        let quantity = HKQuantity(unit: .literUnit(with: .milli), doubleValue: milliliters)
        let sample = HKQuantitySample(type: waterType, quantity: quantity, start: now, end: now)
        store.save(sample) { success, _ in
            completion(success)
        }
    }

    func logWeight(kg: Double, completion: @escaping (Bool) -> Void) {
        guard isAvailable, kg > 0,
              let weightType = HKQuantityType.quantityType(forIdentifier: .bodyMass) else {
            completion(false)
            return
        }

        let now = Date()
        let quantity = HKQuantity(unit: .gramUnit(with: .kilo), doubleValue: kg)
        let sample = HKQuantitySample(type: weightType, quantity: quantity, start: now, end: now)
        store.save(sample) { success, _ in
            completion(success)
        }
    }

    func logWorkout(
        kind: String,
        durationMinutes: Double,
        activeCalories: Double,
        title: String,
        completion: @escaping (Bool) -> Void
    ) {
        guard isAvailable else {
            completion(false)
            return
        }

        let end = Date()
        let safeDuration = max(5.0, durationMinutes) * 60.0
        let start = end.addingTimeInterval(-safeDuration)
        let activityType: HKWorkoutActivityType =
            kind == "walk" ? .walking : .traditionalStrengthTraining

        let config = HKWorkoutConfiguration()
        config.activityType = activityType
        config.locationType = kind == "walk" ? .outdoor : .indoor

        let builder = HKWorkoutBuilder(healthStore: store, configuration: config, device: .local())
        builder.beginCollection(withStart: start) { started, _ in
            guard started else {
                completion(false)
                return
            }

            let finishWork = {
                builder.endCollection(withEnd: end) { ended, _ in
                    guard ended else {
                        completion(false)
                        return
                    }
                    let metadata: [String: Any] = [
                        HKMetadataKeyWorkoutBrandName: "Gampetoo",
                        "GampetooWorkoutTitle": title,
                    ]
                    builder.addMetadata(metadata) { _, _ in
                        builder.finishWorkout { workout, _ in
                            completion(workout != nil)
                        }
                    }
                }
            }

            if activeCalories > 0,
               let energyType = HKQuantityType.quantityType(forIdentifier: .activeEnergyBurned) {
                let energyQty = HKQuantity(unit: .kilocalorie(), doubleValue: activeCalories)
                let energySample = HKQuantitySample(
                    type: energyType,
                    quantity: energyQty,
                    start: start,
                    end: end
                )
                builder.add([energySample]) { _, _ in
                    finishWork()
                }
            } else {
                finishWork()
            }
        }
    }
    #else
    var isAvailable: Bool { false }
    func requestAuthorization(completion: @escaping (Bool, String?) -> Void) { completion(false, nil) }
    func fetchTodaySummary(completion: @escaping ([String: Any]) -> Void) {
        completion(["available": false, "steps": 0, "activeCalories": 0, "waterMl": 0])
    }
    func logWater(milliliters: Double, completion: @escaping (Bool) -> Void) { completion(false) }
    func logWeight(kg: Double, completion: @escaping (Bool) -> Void) { completion(false) }
    func logWorkout(kind: String, durationMinutes: Double, activeCalories: Double, title: String, completion: @escaping (Bool) -> Void) {
        completion(false)
    }
    #endif
}
