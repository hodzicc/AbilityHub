import 'package:flutter/material.dart';

/// One step of a task. [hint] is the extra support shown if the child taps the
/// help button — each time it's shown we count it as a `hintsShown` metric.
class DemoStep {
  final String instruction;
  final String hint;
  const DemoStep(this.instruction, this.hint);
}

/// A reference "life-skill" task made of ordered sub-steps. Completing it sends a
/// usage report with accessibility metrics (steps done, duration, hints, errors)
/// so the parent's web statistics show real, step-level progress.
class DemoActivity {
  final String id;

  /// The standardized `activityType` sent to the platform; also drives the
  /// statistics "filter by activity type" feature (household / hygiene / school…).
  final String activityType;
  final String title;
  final String emoji;
  final Color color;

  /// Difficulty level — an example of app-specific data sent to the platform as a
  /// generic attribute ({'level': '2'}); the platform doesn't model it natively.
  final int level;
  final List<DemoStep> steps;

  const DemoActivity({
    required this.id,
    required this.activityType,
    required this.title,
    required this.emoji,
    required this.color,
    required this.level,
    required this.steps,
  });
}

/// The catalog of demo tasks. New tasks are just new entries — no platform change
/// is needed, which is the whole point of the standardized reporting format.
const List<DemoActivity> demoActivities = [
  DemoActivity(
    id: 'wash-hands',
    activityType: 'hygiene',
    title: 'Operi ruke',
    emoji: '🧼',
    color: Color(0xFF38BDF8),
    level: 1,
    steps: [
      DemoStep('Otvori slavinu s vodom.', 'Okreni ručicu ulijevo da poteče voda.'),
      DemoStep('Nakvasi ruke.', 'Stavi obje ruke pod mlaz vode.'),
      DemoStep('Uzmi sapun.', 'Pritisni pumpicu jednom.'),
      DemoStep('Trljaj ruke 20 sekundi.', 'Trljaj dlanove, između prstiju i nokte.'),
      DemoStep('Isperi sapun.', 'Drži ruke pod vodom dok sapun ne nestane.'),
      DemoStep('Zatvori slavinu i osuši ruke.', 'Uzmi peškir i obriši ruke.'),
    ],
  ),
  DemoActivity(
    id: 'brush-teeth',
    activityType: 'hygiene',
    title: 'Operi zube',
    emoji: '🪥',
    color: Color(0xFFA78BFA),
    level: 1,
    steps: [
      DemoStep('Uzmi četkicu i pastu.', 'Pasta je tuba s poklopcem.'),
      DemoStep('Stavi malo paste na četkicu.', 'Dovoljno je koliko zrno graška.'),
      DemoStep('Peri gornje zube.', 'Kružnim pokretima, polako.'),
      DemoStep('Peri donje zube.', 'Ne zaboravi zube pozadi.'),
      DemoStep('Isperi usta vodom.', 'Uzmi gutljaj vode i ispljuni.'),
      DemoStep('Operi četkicu i vrati je.', 'Isperi je pod vodom.'),
    ],
  ),
  DemoActivity(
    id: 'set-table',
    activityType: 'household',
    title: 'Postavi sto za ručak',
    emoji: '🍽️',
    color: Color(0xFFFB923C),
    level: 2,
    steps: [
      DemoStep('Stavi tanjir na sto.', 'Po jedan tanjir za svaku osobu.'),
      DemoStep('Stavi viljušku s lijeve strane.', 'Lijevo od tanjira.'),
      DemoStep('Stavi nož s desne strane.', 'Desno od tanjira, oštrica prema tanjiru.'),
      DemoStep('Stavi čašu iznad noža.', 'Gore desno.'),
      DemoStep('Stavi salvetu.', 'Pored tanjira ili na tanjir.'),
    ],
  ),
  DemoActivity(
    id: 'pack-backpack',
    activityType: 'school',
    title: 'Spremi torbu za školu',
    emoji: '🎒',
    color: Color(0xFF34D399),
    level: 3,
    steps: [
      DemoStep('Provjeri raspored za sutra.', 'Pogledaj koji predmeti su sutra.'),
      DemoStep('Stavi sveske i knjige.', 'Samo one koje trebaš sutra.'),
      DemoStep('Stavi pernicu.', 'Provjeri da imaš olovku i gumicu.'),
      DemoStep('Stavi užinu i vodu.', 'Ne zaboravi flašicu vode.'),
      DemoStep('Zatvori torbu.', 'Zatvori sve zatvarače.'),
    ],
  ),
];
