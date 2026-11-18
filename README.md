# Forma — powrót do sprawności

Aplikacja na iPhone'a (PWA), która prowadzi przez treningi przed nartami (23.01) i szkoleniem jaskiniowym (kwiecień).
Dane są zapisywane tylko w telefonie.

## Wrzucenie na GitHub Pages

1. Na GitHubie: **New repository**, np. `forma`. Może być prywatne tylko na płatnym planie — na darmowym Pages wymaga repo publicznego (w repo jest tylko kod i plan, Twoje dane zostają w telefonie).
2. **Add file → Upload files** i przeciągnij całą zawartość folderu (razem z katalogiem `icons`).
3. **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, folder `/ (root)` → Save.
4. Po 1–2 minutach aplikacja jest pod adresem `https://TWOJ-LOGIN.github.io/forma/`.

## Instalacja na iPhonie

1. Otwórz adres w **Safari**.
2. Przycisk **Udostępnij → Do ekranu początkowego**.
3. Uruchamiaj aplikację z ikony, nie z Safari — wtedy działa na pełnym ekranie, offline i ma własne miejsce na dane.

## Zmiany w planie

Cały plan (fazy, daty, treningi, ćwiczenia, opisy) jest w `plan.js`. Edytujesz, wrzucasz na GitHuba, zamykasz i otwierasz aplikację.
Po większych zmianach podbij `CACHE = 'forma-v1'` w `sw.js` na `forma-v2`.

**Do poprawienia:** dokładna data startu szkolenia jaskiniowego (`goals.caving.start`, teraz 1 kwietnia 2027).

## Kopia zapasowa

*Więcej → Zapisz kopię* zapisuje plik JSON (np. w Plikach / iCloud Drive). Rób to co 1–2 tygodnie — aplikacja przypomni.
Przy zmianie telefonu lub adresu aplikacji: *Wczytaj kopię*.
