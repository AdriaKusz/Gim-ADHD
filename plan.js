// =====================================================================
//  PLAN TRENINGOWY — ten plik możesz edytować sama.
//  Daty: RRRR-MM-DD. Po zmianie wrzuć plik na GitHuba i odśwież aplikację.
//
//  Typy ćwiczeń (t):
//    kg     – zapisujesz ciężar i powtórzenia
//    bw     – tylko powtórzenia (masa ciała / guma)
//    time   – sekundy (deska, zwis, krzesełko)
//    cardio – minuty z timerem
//    check  – odhaczasz (ćwiczenia na stopę)
//  Progresja (p): upper +2,5 kg · lower +5 kg · small +1 kg · assist −5 kg odciążenia
// =====================================================================

window.PLAN = {
  goals: {
    ski:    { start: '2027-01-23', end: '2027-02-03', name: 'Narty w Austrii' },
    caving: { start: '2027-04-01', name: 'Szkolenie jaskiniowe' } // ← popraw na dokładną datę
  },

  phases: [
    {
      id: 'p1', name: 'Faza 1 · Fundament', start: '2026-11-16', end: '2026-12-13', foot: 'f1',
      goal: 'Nauka techniki, kondycja tlenowa, wzmocnienie stopy i barku. Ciężary umiarkowane: po każdej serii mogłabyś zrobić jeszcze 2–3 powtórzenia.',
      sessions: ['A1', 'K1', 'B1', 'K2']
    },
    {
      id: 'p2', name: 'Faza 2 · Przygotowanie do nart', start: '2026-12-14', end: '2027-01-22', foot: 'f2',
      goal: 'Mocne uda, wytrzymałość nóg, stabilne kolana i kostki. Ciężary rosną, powtórzeń mniej. Ostatni tydzień przed wyjazdem (od 18 stycznia) zrób lżej — o 1 serię mniej w każdym ćwiczeniu.',
      sessions: ['A2', 'K3', 'B2', 'K4']
    },
    {
      id: 'ski', name: 'Narty w Austrii', start: '2027-01-23', end: '2027-02-03', foot: 'fski', type: 'break',
      goal: 'Narty to trening sam w sobie. Codziennie rano 8 minut na stopy, wieczorem rozciąganie. Siłownia odpoczywa.',
      sessions: ['SKI']
    },
    {
      id: 'p3', name: 'Faza 3 · Przygotowanie do jaskiń', start: '2027-02-04', end: '2027-03-31', foot: 'f3',
      goal: 'Siła rąk i chwytu do pracy na linie, noszenie worka, czołganie, stabilność kostki na nierównym terenie. Pierwszy tydzień po nartach: ciężary o 10–20% lżejsze.',
      sessions: ['A3', 'K5', 'B3', 'K6']
    },
    {
      id: 'p4', name: 'Faza 4 · Szkolenie trwa', start: '2027-04-01', end: '2099-12-31', foot: 'f3',
      goal: 'Szkolenie jaskiniowe trwa. 3 treningi w tygodniu wystarczą, żeby utrzymać i budować formę. W tygodniu z wyjazdem do jaskini odpuść jeden trening.',
      sessions: ['A3', 'K5', 'B3']
    }
  ],

  // Zestawy na stopę: [ćwiczenie, dawka]
  foot: {
    f1: [
      ['f_ball', '1–2 min na każdą stopę'],
      ['f_toes', '2×15'],
      ['f_spread', '2×10, trzymaj 5 s'],
      ['f_towel', '2×1 min'],
      ['f_raise', '2×15 obunóż, powoli'],
      ['f_calf', '2×30 s na nogę (prosta noga i zgięte kolano)'],
      ['f_balance', '3×30 s na każdą nogę, na podłodze']
    ],
    f2: [
      ['f_ball', '1–2 min na każdą stopę'],
      ['f_toes', '2×15'],
      ['f_spread', '2×10, trzymaj 5 s'],
      ['f_raise', '3×12, 2 s pauzy na górze'],
      ['f_eccentric', '2×10 na nogę, 3 s w dół'],
      ['f_calf', '2×30 s na nogę'],
      ['f_balance', '3×30 s na poduszce sensomotorycznej lub złożonym ręczniku']
    ],
    f3: [
      ['f_ball', '1 min na każdą stopę'],
      ['f_toes', '2×15'],
      ['f_raise', '3×10 na jednej nodze'],
      ['f_eccentric', '3×10 na nogę, 3 s w dół'],
      ['f_calf', '2×30 s na nogę'],
      ['f_balance', '3×30 s z zamkniętymi oczami albo na BOSU']
    ],
    fski: [
      ['f_ball', '1 min na stopę (rano)'],
      ['f_toes', '2×15'],
      ['f_raise', '2×15'],
      ['f_calf', '2×30 s na nogę (wieczorem)'],
      ['f_hips', 'wieczorem, ok. 5 min']
    ]
  }
};

// ---------------------------------------------------------------------
//  TRENINGI
//  s = serie, r = [min, max] powtórzeń, sec = sekundy, min = minuty,
//  rest = przerwa w sekundach, foot: true = zestaw na stopę z danej fazy
// ---------------------------------------------------------------------
window.SESSIONS = {
  // ---- Faza 1 ----
  A1: { name: 'Siła A', min: 55, blocks: [
    { ex: 'warm_bike', min: 5 },
    { ex: 'leg_press', s: 3, r: [10, 12], rest: 90 },
    { ex: 'lat_pull', s: 3, r: [10, 12], rest: 90 },
    { ex: 'rdl', s: 3, r: [10, 12], rest: 90 },
    { ex: 'chest_press', s: 3, r: [10, 12], rest: 90 },
    { ex: 'face_pull', s: 2, r: [12, 15], rest: 60 },
    { ex: 'calf_machine', s: 2, r: [12, 15], rest: 60 },
    { ex: 'dead_bug', s: 3, r: [6, 8], rest: 45 }
  ]},
  K1: { name: 'Kondycja + stopa', min: 45, blocks: [
    { ex: 'c_elliptical', min: 30, note: 'Strefa 2 — możesz rozmawiać pełnymi zdaniami.' },
    { foot: true },
    { ex: 'band_walk', s: 2, r: [10, 12], rest: 45 },
    { ex: 'side_plank', s: 2, sec: 20, rest: 30 }
  ]},
  B1: { name: 'Siła B', min: 55, blocks: [
    { ex: 'warm_bike', min: 5 },
    { ex: 'goblet', s: 3, r: [10, 12], rest: 90 },
    { ex: 'row_cable', s: 3, r: [10, 12], rest: 90 },
    { ex: 'hip_thrust', s: 3, r: [10, 12], rest: 90 },
    { ex: 'assist_pull', s: 3, r: [6, 8], rest: 120 },
    { ex: 'leg_curl', s: 2, r: [12, 15], rest: 60 },
    { ex: 'ext_rot', s: 2, r: [12, 15], rest: 45 },
    { ex: 'plank', s: 3, sec: 30, rest: 45 }
  ]},
  K2: { name: 'Marsz + stopa', min: 45, blocks: [
    { ex: 'c_incline', min: 30, note: 'Nachylenie 8–10%, ok. 4,5 km/h.' },
    { foot: true },
    { ex: 'step_up', s: 2, r: [10, 12], rest: 60, note: 'Na start bez ciężaru (wpisz 0 kg), niska skrzynia.' },
    { ex: 'pallof', s: 2, r: [10, 12], rest: 45 }
  ]},

  // ---- Faza 2: narty ----
  A2: { name: 'Siła A · narty', min: 60, blocks: [
    { ex: 'warm_bike', min: 5 },
    { ex: 'leg_press', s: 4, r: [8, 10], rest: 120 },
    { ex: 'split_squat', s: 3, r: [8, 10], rest: 90, ru: ' na nogę' },
    { ex: 'lat_pull', s: 3, r: [8, 10], rest: 90 },
    { ex: 'rdl', s: 3, r: [8, 10], rest: 90 },
    { ex: 'wall_sit', s: 3, sec: 45, rest: 60 },
    { ex: 'lat_lunge', s: 3, r: [8, 10], rest: 60 },
    { ex: 'face_pull', s: 2, r: [12, 15], rest: 60 }
  ]},
  K3: { name: 'Interwały + stopa', min: 45, blocks: [
    { ex: 'c_bike', min: 25, note: '5 min lekko, potem 6× (1 min mocno / 2 min lekko), 2 min luzu.' },
    { foot: true },
    { ex: 'band_walk', s: 3, r: [12, 15], rest: 45 },
    { ex: 'side_plank', s: 3, sec: 30, rest: 30 }
  ]},
  B2: { name: 'Siła B · narty', min: 60, blocks: [
    { ex: 'warm_bike', min: 5 },
    { ex: 'goblet', s: 4, r: [8, 10], rest: 90 },
    { ex: 'step_up', s: 3, r: [10, 12], rest: 60 },
    { ex: 'row_cable', s: 3, r: [8, 10], rest: 90 },
    { ex: 'assist_pull', s: 3, r: [6, 8], rest: 120 },
    { ex: 'hip_thrust', s: 3, r: [8, 10], rest: 90 },
    { ex: 'leg_curl', s: 3, r: [10, 12], rest: 60 },
    { ex: 'wall_sit', s: 2, sec: 60, rest: 60 }
  ]},
  K4: { name: 'Długi marsz + stopa', min: 55, blocks: [
    { ex: 'c_incline', min: 40, note: 'Nachylenie 10–12%. Możesz zamienić na stepper.' },
    { foot: true },
    { ex: 'lat_lunge', s: 2, r: [10, 12], rest: 45 },
    { ex: 'plank', s: 3, sec: 40, rest: 45 }
  ]},

  // ---- Narty ----
  SKI: { name: 'Stopy i rozciąganie', min: 10, blocks: [ { foot: true } ] },

  // ---- Faza 3: jaskinie ----
  A3: { name: 'Siła A · jaskinie', min: 60, blocks: [
    { ex: 'warm_bike', min: 5 },
    { ex: 'goblet', s: 4, r: [8, 10], rest: 90 },
    { ex: 'assist_pull', s: 4, r: [5, 8], rest: 120 },
    { ex: 'row_cable', s: 3, r: [8, 10], rest: 90 },
    { ex: 'rdl', s: 3, r: [8, 10], rest: 90 },
    { ex: 'farmer', s: 3, r: [30, 40], rest: 90, ru: ' s' },
    { ex: 'dead_hang', s: 3, sec: 20, rest: 60 },
    { ex: 'ext_rot', s: 2, r: [12, 15], rest: 45 },
    { ex: 'dead_bug', s: 3, r: [8, 10], rest: 45 }
  ]},
  K5: { name: 'Marsz z plecakiem + stopa', min: 55, blocks: [
    { ex: 'c_ruck', min: 40, note: 'Tydzień 1: 5 kg. Co tydzień +1 kg, do ok. 12 kg.' },
    { foot: true },
    { ex: 'side_plank', s: 3, sec: 30, rest: 30 }
  ]},
  B3: { name: 'Siła B · jaskinie', min: 60, blocks: [
    { ex: 'warm_bike', min: 5 },
    { ex: 'step_up', s: 4, r: [10, 12], rest: 60, note: 'Możesz robić w plecaku zamiast z hantlami.' },
    { ex: 'lat_pull', s: 3, r: [8, 10], rest: 90 },
    { ex: 'hip_thrust', s: 3, r: [8, 10], rest: 90 },
    { ex: 'chest_press', s: 3, r: [8, 10], rest: 90 },
    { ex: 'bear_crawl', s: 3, sec: 30, rest: 60 },
    { ex: 'pallof', s: 3, r: [10, 12], rest: 45 },
    { ex: 'back_ext', s: 3, r: [12, 15], rest: 60 },
    { ex: 'face_pull', s: 2, r: [12, 15], rest: 60 }
  ]},
  K6: { name: 'Interwały + core', min: 45, blocks: [
    { ex: 'c_stairs', min: 25, note: 'Albo wioślarz: 6× (1 min mocno / 2 min lekko).' },
    { foot: true },
    { ex: 'plank', s: 3, sec: 45, rest: 45 },
    { ex: 'dead_bug', s: 3, r: [8, 10], rest: 45 }
  ]},

  // Samodzielny zestaw na stopę (z ekranu „Dziś”)
  FOOT: { name: 'Stopa na dziś', min: 8, blocks: [ { foot: true } ] }
};

// ---------------------------------------------------------------------
//  ĆWICZENIA: n = nazwa, m = sprzęt / maszyna, how = jak wykonać, safe = uwaga
// ---------------------------------------------------------------------
window.EX = {
  // --- rozgrzewka i kondycja ---
  warm_bike: { n: 'Rozgrzewka na rowerze', m: 'Rower stacjonarny', t: 'cardio',
    how: ['Spokojne tempo, lekki opór', 'Na koniec 10 krążeń ramion w przód i w tył', 'Kilka przysiadów bez obciążenia'] },
  c_elliptical: { n: 'Orbitrek', m: 'Orbitrek', t: 'cardio',
    how: ['Strefa 2: możesz mówić pełnymi zdaniami, ale czujesz wysiłek', 'Stopy płasko na pedałach', 'Z pulsometrem: ok. 60–70% tętna maksymalnego'] },
  c_bike: { n: 'Rower — interwały', m: 'Rower stacjonarny', t: 'cardio',
    how: ['Siodełko: przy dolnym pedale kolano prawie proste', '„Mocno” = trudno mówić, ale to nie sprint do upadku', '„Lekko” = spokojne kręcenie'] },
  c_incline: { n: 'Marsz pod górę na bieżni', m: 'Bieżnia', t: 'cardio',
    how: ['Nachylenie 8–12%, prędkość 4–5 km/h', 'Nie trzymaj się poręczy', 'Krótsze kroki, stawiaj całą stopę'] },
  c_stairs: { n: 'Stepper', m: 'Stepper lub schody', t: 'cardio',
    how: ['Wyprostowana sylwetka, ręce lekko na poręczy', 'Stawiaj całą stopę', 'Tempo, przy którym mówisz krótkimi zdaniami'] },
  c_ruck: { n: 'Marsz pod górę z plecakiem', m: 'Bieżnia + plecak z obciążeniem', t: 'cardio',
    how: ['Nachylenie 10–15%, 4–5 km/h', 'Pas biodrowy zapięty — ciężar na biodrach, nie na barkach', 'Obciążenie: butelki z wodą lub talerze owinięte ręcznikiem'] },

  // --- nogi ---
  leg_press: { n: 'Wypychanie nóg na suwnicy', m: 'Suwnica (leg press)', t: 'kg', p: 'lower',
    how: ['Stopy na szerokość bioder, na środku platformy', 'Kolana w linii palców — nie uciekają do środka', 'Na górze nie blokuj kolan; plecy i pośladki cały czas na oparciu'],
    safe: 'Zakres ruchu taki, przy którym kolano nie boli.' },
  goblet: { n: 'Przysiad z hantlem przy klatce', m: 'Hantel lub kettlebell', t: 'kg', p: 'small',
    how: ['Hantel pionowo przy mostku, łokcie w dół', 'Siadaj między pięty, plecy proste, kolana na zewnątrz', 'Pięty cały czas na ziemi'],
    safe: 'Jeśli kolano protestuje, schodź płycej — np. do ławki za sobą.' },
  split_squat: { n: 'Przysiad bułgarski', m: 'Ławka + hantle', t: 'kg', p: 'small',
    how: ['Tylna stopa na ławce, przednia ok. 2 stopy przed nią', 'Opadaj pionowo w dół, ciężar na przedniej pięcie', 'Najpierw bez hantli (0 kg) — dodaj je, gdy równowaga jest pewna'],
    safe: 'Seria = powtórzenia na jedną nogę, potem druga.' },
  step_up: { n: 'Wejścia na skrzynię', m: 'Skrzynia lub ławka (30–45 cm) + hantle', t: 'kg', p: 'small',
    how: ['Cała stopa na skrzyni', 'Wchodź siłą nogi na górze — nie odbijaj się dolną', 'Schodź powoli'],
    safe: 'Powtórzenia na każdą nogę. Dobre na stabilność kostki.' },
  rdl: { n: 'Martwy ciąg rumuński z hantlami', m: 'Hantle', t: 'kg', p: 'small',
    how: ['Kolana lekko ugięte, hantle blisko ud', 'Odsuwaj biodra do tyłu z prostymi plecami, aż poczujesz rozciąganie z tyłu ud', 'Wracaj, zaciskając pośladki'] },
  hip_thrust: { n: 'Unoszenie bioder (hip thrust)', m: 'Ławka + sztanga lub maszyna hip thrust', t: 'kg', p: 'lower',
    how: ['Łopatki na ławce, stopy na szerokość bioder', 'Unieś biodra do linii kolana–barki, zaciśnij pośladki na 1 s', 'Broda lekko przy klatce, nie wyginaj lędźwi'] },
  leg_curl: { n: 'Uginanie nóg na maszynie', m: 'Maszyna do uginania nóg', t: 'kg', p: 'upper',
    how: ['Oś maszyny na wysokości kolana', 'Zginaj płynnie, wracaj powoli przez 2–3 s', 'Biodra nie odrywają się od siedziska'],
    safe: 'Tył uda chroni kolano.' },
  calf_machine: { n: 'Wspięcia na palce na suwnicy', m: 'Suwnica lub maszyna do łydek', t: 'kg', p: 'lower',
    how: ['Przodostopie na krawędzi platformy', 'Pełny zakres: pięty nisko, potem jak najwyżej na palce', 'Na górze pauza 1 s'],
    safe: 'Zacznij lekko — to praca nad sztywną kostką.' },
  wall_sit: { n: 'Krzesełko przy ścianie', m: 'Ściana', t: 'time',
    how: ['Plecy płasko na ścianie, uda równolegle do podłogi lub wyżej', 'Kolana nad kostkami', 'Spokojny oddech — to pozycja narciarska'],
    safe: 'Uda wyżej = łatwiej dla kolana.' },
  lat_lunge: { n: 'Wykroki boczne', m: 'Bez obciążenia lub hantel', t: 'bw',
    how: ['Szeroki krok w bok, siadasz na tę nogę, druga prosta', 'Kolano w linii palców, pięta na ziemi', 'Odepchnij się i wróć do środka. Powtórzenia na stronę'] },
  band_walk: { n: 'Chód boczny z gumą', m: 'Miniband nad kolanami', t: 'bw',
    how: ['Lekki przysiad, plecy proste', 'Małe kroki w bok, guma cały czas napięta', 'Kolana nie zapadają się do środka. Kroki w każdą stronę'],
    safe: 'Wzmacnia boki bioder — stabilizuje kolano.' },

  // --- góra ciała ---
  lat_pull: { n: 'Ściąganie drążka do klatki', m: 'Wyciąg górny', t: 'kg', p: 'upper',
    how: ['Chwyt trochę szerszy niż barki', 'Najpierw ściągnij łopatki w dół, potem drążek do mostka', 'Wracaj powoli, nie odchylaj się mocno'],
    safe: 'Nigdy za głowę — ze względu na bark.' },
  assist_pull: { n: 'Podciąganie z odciążeniem', m: 'Maszyna do podciągania z odciążeniem', t: 'kg', p: 'assist',
    how: ['Wpisujesz kg odciążenia: mniej = trudniej', 'Zacznij od ściągnięcia łopatek w dół', 'Broda nad drążek, zejście powoli 2–3 s'],
    safe: 'Na dole nie zwisaj biernie na barku.' },
  row_cable: { n: 'Wiosłowanie siedząc', m: 'Wyciąg dolny (rączka V)', t: 'kg', p: 'upper',
    how: ['Plecy proste, kolana lekko ugięte', 'Ciągnij rączkę do brzucha, ściągnij łopatki', 'Wracaj powoli, nie garb się'] },
  chest_press: { n: 'Wyciskanie na maszynie siedząc', m: 'Maszyna chest press', t: 'kg', p: 'upper',
    how: ['Uchwyty na wysokości środka klatki', 'Łopatki ściągnięte i przyklejone do oparcia', 'Wypychaj płynnie, nie blokuj łokci'],
    safe: 'Nie cofaj łokci daleko za linię tułowia.' },
  face_pull: { n: 'Face pull', m: 'Wyciąg z liną na wysokości twarzy', t: 'kg', p: 'small',
    how: ['Ciągnij linę do twarzy, rozchylając końce', 'Łokcie wysoko, na końcu kciuki do tyłu', 'Lekki ciężar, pełna kontrola'],
    safe: 'Wzmacnia tył barku — ważne po zwichnięciu.' },
  ext_rot: { n: 'Rotacja zewnętrzna ramienia', m: 'Guma lub wyciąg na wysokości łokcia', t: 'bw',
    how: ['Łokieć przy boku, zgięty 90° (zwinięty ręcznik pod pachą)', 'Obracaj przedramię na zewnątrz, łokieć zostaje przy ciele', 'Lekki opór, powoli. Powtórzenia na rękę'],
    safe: 'Stabilizuje bark. Ma nie boleć.' },
  farmer: { n: 'Spacer farmera', m: 'Ciężkie hantle lub kettlebelle', t: 'kg', p: 'lower',
    how: ['Sylwetka prosta, barki w dół', 'Idź spokojnie przez czas z planu (wpisujesz sekundy)', 'Chwyt to klucz — przyda się na linie'] },
  dead_hang: { n: 'Zwis na drążku', m: 'Drążek (możesz stać na ławce)', t: 'time',
    how: ['Aktywny zwis: łopatki lekko ściągnięte w dół', 'Na początku stopy na ławce — odciążasz część ciężaru', 'Puść, gdy chwyt zaczyna uciekać'],
    safe: 'Po zwichnięciu barku: bez bujania i bez biernego wiszenia. Ból = stop.' },

  // --- core ---
  plank: { n: 'Deska (plank)', m: 'Mata', t: 'time',
    how: ['Łokcie pod barkami, ciało w linii', 'Napnij brzuch i pośladki', 'Nie zapadaj bioder'] },
  side_plank: { n: 'Deska bokiem', m: 'Mata', t: 'time',
    how: ['Łokieć pod barkiem, biodra w górze', 'Czas na każdą stronę', 'Łatwiej: z kolanami na ziemi'],
    safe: 'Jeśli bark boli, zrób wersję z kolanami.' },
  dead_bug: { n: 'Dead bug (martwy robak)', m: 'Mata', t: 'bw',
    how: ['Na plecach, ręce w górze, kolana nad biodrami', 'Opuszczaj przeciwną rękę i nogę, lędźwie przyklejone do podłogi', 'Powtórzenia na stronę'] },
  pallof: { n: 'Pallof press', m: 'Wyciąg na wysokości klatki', t: 'kg', p: 'small',
    how: ['Stań bokiem do wyciągu', 'Wypchnij uchwyt przed siebie i nie daj się obrócić', 'Powtórzenia na stronę'] },
  back_ext: { n: 'Wyprosty na ławce rzymskiej', m: 'Ławka rzymska 45°', t: 'bw',
    how: ['Biodra na krawędzi poduszki', 'Opuść tułów z prostymi plecami, wróć do linii ciała', 'Nie przeprostowuj na górze'] },
  bear_crawl: { n: 'Chód niedźwiedzia', m: 'Wolne 10 m podłogi', t: 'time',
    how: ['Na czworakach, kolana 2–3 cm nad ziemią', 'Przeciwna ręka i noga jednocześnie, plecy płasko', 'Powoli — trening do czołgania w jaskini'] },

  // --- stopa ---
  f_ball: { n: 'Rolowanie stopy piłeczką', m: 'Piłeczka', t: 'check', physio: true,
    how: ['Roluj podeszwę od pięty do palców', 'Zatrzymuj się na sztywnych miejscach'] },
  f_toes: { n: 'Zginanie i prostowanie palców', m: 'Bez sprzętu', t: 'check', physio: true,
    how: ['Zegnij palce maksymalnie w dół, potem odegnij w górę', 'Powoli, pełny zakres'] },
  f_raise: { n: 'Wspięcia na palce', m: 'Ściana do podparcia', t: 'check', physio: true,
    how: ['Wznoś się jak najwyżej na palce', 'Opuszczaj powoli', 'Ciężar na dużym palcu, nie na zewnętrznej krawędzi stopy'] },
  f_spread: { n: 'Rozczapierzanie palców', m: 'Bez sprzętu', t: 'check',
    how: ['Rozsuń palce jak najszerzej', 'Trzymaj 5 s, rozluźnij'] },
  f_towel: { n: 'Zbieranie ręcznika palcami', m: 'Ręcznik na gładkiej podłodze', t: 'check',
    how: ['Pięta na ziemi', 'Palcami zgarniaj ręcznik do siebie'] },
  f_calf: { n: 'Rozciąganie łydki przy ścianie', m: 'Ściana', t: 'check',
    how: ['Ręce na ścianie, noga z tyłu prosta, pięta na ziemi', 'Potem to samo z lekko zgiętym kolanem (głębsza część łydki)'] },
  f_balance: { n: 'Stanie na jednej nodze', m: 'Podłoga / poduszka / BOSU', t: 'check',
    how: ['Kolano lekko ugięte', 'Wzrok przed siebie', 'Asekuracja: stój przy ścianie'] },
  f_eccentric: { n: 'Opuszczanie pięty ze stopnia', m: 'Stopień', t: 'check',
    how: ['Wejdź na palce obiema nogami', 'Opuszczaj piętę przez 3 s na jednej nodze', 'Do góry wracaj obiema'] },
  f_hips: { n: 'Rozciąganie bioder i ud', m: 'Mata', t: 'check',
    how: ['Wykrok klęczny: 30 s na stronę', 'Przód uda przy ścianie: 30 s na stronę', 'Pośladek w leżeniu (noga na kolanie): 30 s na stronę'] }
};
