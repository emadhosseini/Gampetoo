// The workout library's browsing structure — a tree of categories the user
// taps through (root → category → ... → a specific workout), independent
// of `workoutLibrary.ts`'s flat WorkoutDefinition list. A leaf's
// `workoutId` is what actually gets looked up there; everything above it
// is purely for organizing the browsing UI. Node `id`s double as URL
// segments (see WorkoutCategoryPage's splat route), so they need to be
// unique among siblings, not globally.
export interface WorkoutTaxonomyLeaf {
  kind: "leaf";
  id: string;
  title: string;
  icon: string;
  workoutId: string;
}

export interface WorkoutTaxonomyBranch {
  kind: "branch";
  id: string;
  title: string;
  icon: string;
  children: WorkoutTaxonomyNode[];
}

export type WorkoutTaxonomyNode = WorkoutTaxonomyLeaf | WorkoutTaxonomyBranch;

function leaf(
  id: string,
  title: string,
  icon: string,
  workoutId: string,
): WorkoutTaxonomyLeaf {
  return { kind: "leaf", id, title, icon, workoutId };
}

function branch(
  id: string,
  title: string,
  icon: string,
  children: WorkoutTaxonomyNode[],
): WorkoutTaxonomyBranch {
  return { kind: "branch", id, title, icon, children };
}

// The six root categories the library opens on. Titles are exactly the
// ones requested, no bilingual suffix — those live one level down, on the
// branches/leaves under each.
export const workoutTaxonomy: WorkoutTaxonomyBranch[] = [
  branch("strength", "بدنسازی و هایپرتروفی", "🏋️‍♂️", [
    branch("ppl", "Push / Pull / Legs (PPL)", "🎯", [
      leaf("push", "Push (سینه، سرشانه، پشت‌بازو)", "💪", "push"),
      leaf("pull", "Pull (پشتی/کمر، زیربغل، جلو‌بازو)", "🔙", "pull"),
      leaf("legs", "Legs (چهارسر، همسترینگ، ساق، سرینی)", "🦵", "legs"),
    ]),
    leaf("push", "Push (سینه، سرشانه، پشت‌بازو)", "💪", "push"),
    leaf("pull", "Pull (پشتی/کمر، زیربغل، جلو‌بازو)", "🔙", "pull"),
    leaf("legs", "Legs (چهارسر، همسترینگ، ساق، سرینی)", "🦵", "legs"),
    branch("upper-lower", "Upper / Lower (تفکیک بالاتنه و پایین‌تنه)", "🔀", [
      leaf("upper", "Upper (بالاتنه)", "⬆️", "upper"),
      leaf("lower", "Lower (پایین‌تنه)", "⬇️", "lower"),
    ]),
    leaf("full-body", "Full Body (برنامه جامع تمام بدن)", "🧍", "full_body"),
    leaf("bro-split", "Bro Split (تفکیک تک‌عضلانی روزانه)", "🔁", "bro-split"),
  ]),

  branch("fatloss", "چربی‌سوزی و استقامت", "🔥", [
    leaf("hiit", "HIIT (تمرینات متناوب با شدت بالا)", "⚡", "hiit"),
    leaf(
      "circuit",
      "Circuit Training (تمرینات دوره‌ای و ایستگاهی)",
      "🔄",
      "circuit-training",
    ),
    leaf(
      "bodyweight",
      "Calisthenics / Bodyweight (قدرتی-هوازی با وزن بدن)",
      "🤸",
      "calisthenics-bodyweight",
    ),
    leaf(
      "cardio-stamina",
      "Cardio & Stamina (کاردیو و ارتقای ظرفیت تنفسی)",
      "❤️",
      "cardio-stamina",
    ),
  ]),

  branch("mindbody", "ذهن، جسم و انعطاف", "🧘‍♀️", [
    branch("pilates", "Pilates (پیلاتس)", "🧘‍♀️", [
      leaf(
        "core-stability",
        "Core Stability (ثبات و تقویت عضلات عمقی)",
        "🎯",
        "pilates-core-stability",
      ),
      leaf(
        "full-body-sculpt",
        "Full Body Sculpt (فرم‌دهی و کنترل بدن)",
        "✨",
        "pilates-full-body-sculpt",
      ),
    ]),
    branch("yoga", "Yoga (یوگا)", "🧘", [
      leaf(
        "vinyasa",
        "Vinyasa / Flow (یوگای پویا و تداومی)",
        "🌊",
        "yoga-vinyasa",
      ),
      leaf(
        "hatha",
        "Hatha / Restorative (یوگای آرامش و تمرکز)",
        "🕯️",
        "yoga-hatha",
      ),
    ]),
    leaf(
      "mobility",
      "Mobility & Stretching (تحرک مفاصل و کشش پویا)",
      "🤲",
      "mobility-stretching",
    ),
    leaf(
      "recovery",
      "Recovery & Active Rest (بازیابی فعال جهت حفظ Streak)",
      "😌",
      "recovery-active-rest",
    ),
  ]),

  branch("core", "هسته بدن و اصلاحی", "🩺", [
    leaf(
      "abs-focus",
      "Core & Abs Focus (تمرینات تخصصی شکم و پهلو)",
      "🎯",
      "core-abs-focus",
    ),
    leaf(
      "posture",
      "Posture & Back Health (اصلاح وضعیت گودی کمر و شانه‌ها)",
      "🧍‍♂️",
      "posture-back-health",
    ),
  ]),

  branch("specialized", "برنامه‌های ویژه", "⚡", [
    leaf(
      "home-workout",
      "Home Workout (تمرینات در خانه)",
      "🏠",
      "home-workout",
    ),
    leaf(
      "express-15",
      "Express 15-Min (تمرینات سریع و فشرده)",
      "⏱️",
      "express-15min",
    ),
  ]),

  branch("warmup", "گرم کردن", "🌡️", [
    leaf("general", "گرم کردن عمومی", "🔥", "warmup"),
    branch("specialized-warmup", "گرم کردن تخصصی", "🎯", [
      branch("strength", "بدنسازی و هایپرتروفی", "🏋️‍♂️", [
        leaf("push", "گرم کردن Push", "💪", "push"),
        leaf("pull", "گرم کردن Pull", "🔙", "pull"),
        leaf("legs", "گرم کردن Legs", "🦵", "legs"),
        leaf("upper", "گرم کردن Upper", "⬆️", "upper"),
        leaf("lower", "گرم کردن Lower", "⬇️", "lower"),
        leaf("full-body", "گرم کردن Full Body", "🧍", "full_body"),
      ]),
    ]),
  ]),
];

export function findTaxonomyNode(
  path: string[],
): WorkoutTaxonomyNode | undefined {
  let node: WorkoutTaxonomyNode | undefined;
  let siblings: WorkoutTaxonomyNode[] = workoutTaxonomy;

  for (const segment of path) {
    node = siblings.find((candidate) => candidate.id === segment);
    if (!node) return undefined;

    siblings = node.kind === "branch" ? node.children : [];
  }

  return node;
}
