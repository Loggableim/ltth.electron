# Gift Logging Fix - Summary

## Problem
Geschenke wurden mit kumulativen Gesamtwerten statt inkrementellen Beträgen geloggt.

### Beispiel aus dem Issue:
```
9:04:28 PM  🎁 Gift  felixthetaidum  Rose x49 (98 coins)   ← FALSCH!
9:04:26 PM  🎁 Gift  felixthetaidum  Rose x47 (94 coins)   ← FALSCH!
9:04:25 PM  🎁 Gift  felixthetaidum  Rose x44 (88 coins)   ← FALSCH!
```

**Problem**: Es sah so aus, als hätte der Nutzer viel mehr geschickt (98+94+88+... Coins), aber tatsächlich waren es nur 98 Coins insgesamt (49 Rosen × 2).

## Ursache
- TikTok sendet bei Geschenk-Streaks Events mit **kumulativer** `repeatCount` (19, 22, 24, 27, ...)
- Jedes Event zeigt die Gesamtzahl bis zu diesem Zeitpunkt, nicht nur die neuen Geschenke
- Der Code hat diese Werte direkt angezeigt, ohne die Differenz zu berechnen
- **Wichtig**: ALLE Geschenke können gestreaked werden, nicht nur `giftType === 1`
- **Ausnahme**: Manche Geschenke wie Team Heart können nur einmal gesendet werden

## Lösung
Der Code trackt jetzt den vorherigen `repeatCount` für jede User/Geschenk-Kombination und berechnet die inkrementelle Differenz.

### Berechnung:
```javascript
// Wenn repeatCount höher ist als vorher = Streak fortsetzung
incrementalCount = currentRepeatCount - previousRepeatCount

// Wenn repeatCount gleich oder niedriger = Neuer Streak
incrementalCount = currentRepeatCount
```

### Nach dem Fix:
```
9:04:20 PM  🎁 Gift  felixthetaidum  Rose x19 (38 coins)  ✓
9:04:21 PM  🎁 Gift  felixthetaidum  Rose x3  (6 coins)   ✓
9:04:22 PM  🎁 Gift  felixthetaidum  Rose x2  (4 coins)   ✓
9:04:22 PM  🎁 Gift  felixthetaidum  Rose x3  (6 coins)   ✓
...
```

**Korrekt**: 38+6+4+6+... = 98 Coins insgesamt ✓

## Geänderte Dateien
- `modules/tiktok.js`: 
  - Neue `giftStreaks` Map zum Tracking
  - Inkrementelle Berechnung implementiert
  - Timestamp zur Deduplizierung hinzugefügt
- `test-gift-streak-fix.js`: Umfassende Tests

## Testen
Alle Tests erfolgreich ✅

Um den Fix zu testen:
```bash
node test-gift-streak-fix.js
```

## Auswirkungen
- ✅ Geschenke werden jetzt korrekt mit inkrementellen Beträgen angezeigt
- ✅ Gesamtsumme der Coins ist korrekt
- ✅ Leaderboards, Alerts und Ziele verwenden die richtigen Werte
- ✅ Keine Sicherheitsprobleme (CodeQL Check bestanden)

## Beispiel
Wenn jemand 49 Rosen schickt (insgesamt 98 Coins):
- **Vorher**: Sah aus wie 816 Coins (weil kumulative Werte addiert wurden)
- **Nachher**: Zeigt korrekt 98 Coins (weil nur inkrementelle Werte gezählt werden)
