/** UI translations. English source text remains the stable, readable key. */
export const SUPPORTED_LANGUAGES = Object.freeze([
  Object.freeze({ code: 'en', label: 'English' }),
  Object.freeze({ code: 'de', label: 'Deutsch' }),
  Object.freeze({ code: 'ko', label: '한국어' })
]);

const STORAGE_KEY = 'ghostlight-language-v1';
const LOCALES = { en: 'en-GB', de: 'de-DE', ko: 'ko-KR' };

// Each row has an English source, a German translation and a Korean translation.
// Keeping the languages together makes missing translations visible during edits.
const MESSAGES = [
  ['Head direction', 'Blickrichtung', '머리 방향'],
  ['Facing mode', 'Richtungsmodus', '방향 모드'],
  ['Face microphone', 'Zum Mikrofon', '마이크 바라보기'],
  ['Manual direction', 'Manuelle Richtung', '수동 방향'],
  ['Turn angle / offset', 'Drehwinkel / Versatz', '회전 각도 / 오프셋'],
  ['Face microphone follows its position; the angle adds an offset. In manual mode, 0° faces the audience, +90° audience-right, −90° audience-left and 180° backstage.',
   '„Zum Mikrofon“ folgt dessen Position. Der Winkel fügt einen Versatz hinzu. Im manuellen Modus zeigt 0° zum Publikum, +90° aus Publikumssicht nach rechts, −90° nach links und 180° nach hinten.',
   '마이크 바라보기는 마이크 위치를 따라 회전하며 설정한 각도를 더합니다. 수동 모드에서 0°는 관객 방향, +90°는 관객 기준 오른쪽, −90°는 왼쪽, 180°는 무대 뒤쪽입니다.'],
  ['Audio', 'Audio', '오디오'],
  ['Audio player', 'Audioplayer', '오디오 플레이어'],
  ['Choose audio file', 'Audiodatei auswählen', '오디오 파일 선택'],
  ['Use an audio link', 'Audio-Link verwenden', '오디오 링크 사용'],
  ['Direct audio URL', 'Direkte Audio-URL', '오디오 파일 주소'],
  ['Load link', 'Link laden', '링크 불러오기'],
  ['Use a direct HTTPS audio link, such as an MP3 file.', 'Verwende einen direkten HTTPS-Link zu einer Audiodatei, etwa einer MP3-Datei.', 'MP3 파일처럼 오디오 파일을 직접 가리키는 HTTPS 링크를 사용하세요.'],
  ['Track position', 'Wiedergabeposition', '재생 위치'],
  ['Restart track', 'Zum Anfang', '처음으로'],
  ['Back five seconds', 'Fünf Sekunden zurück', '5초 뒤로'],
  ['Forward five seconds', 'Fünf Sekunden vor', '5초 앞으로'],
  ['Volume', 'Lautstärke', '음량'],
  ['Playback speed', 'Wiedergabegeschwindigkeit', '재생 속도'],
  ['Loop track', 'Wiederholen', '반복 재생'],
  ['Drive jaw (local file)', 'Kiefer animieren (lokale Datei)', '턱 연동 (로컬 파일)'],
  ['Start show with audio', 'Ablauf mit Audio starten', '오디오와 함께 공연 시작'],
  ['Starts the show from the current height and plays from the track position. Both start at 1×, then use separate controls.', 'Startet den Ablauf auf der aktuellen Höhe und die Tonspur an der gewählten Stelle. Beide starten bei 1× und lassen sich danach getrennt steuern.', '현재 높이에서 공연을 시작하고 선택한 위치에서 오디오를 재생합니다. 둘 다 1배속으로 시작하며 이후에는 각각 조작할 수 있습니다.'],
  ['A local audio file can drive the jaw from its volume. Enable Drive jaw in the audio player.', 'Der Pegel einer lokalen Audiodatei kann den Kiefer bewegen. Aktiviere dazu „Kiefer animieren“ im Audioplayer.', '로컬 오디오 파일의 음량으로 턱을 움직일 수 있습니다. 오디오 플레이어에서 턱 연동을 켜세요.'],
  ['Enter a direct HTTPS audio link.', 'Gib einen direkten HTTPS-Audio-Link ein.', '오디오 파일을 직접 가리키는 HTTPS 링크를 입력하세요.'],
  ['Could not load this track. Check the file or direct audio link.', 'Die Tonspur konnte nicht geladen werden. Prüfe die Datei oder den direkten Audio-Link.', '오디오를 불러올 수 없습니다. 파일이나 직접 링크를 확인하세요.'],
  ['Loading track…', 'Tonspur wird geladen…', '오디오 불러오는 중…'],
  ['Could not play this track. Try Play again or choose another file.', 'Die Tonspur konnte nicht abgespielt werden. Starte die Wiedergabe erneut oder wähle eine andere Datei.', '오디오를 재생할 수 없습니다. 다시 재생하거나 다른 파일을 선택하세요.'],
  ['No track loaded', 'Keine Tonspur geladen', '불러온 오디오 없음'],
  ['{time} left at this speed', 'Noch {time} bei diesem Tempo', '현재 속도로 {time} 남음'],
  ['Ghostlight — Stage Lab', 'Ghostlight — Bühnenlabor', 'Ghostlight — 무대 실험실'],
  ['Ghostlight home', 'Ghostlight Startseite', 'Ghostlight 홈'],
  ['STAGE LAB / 01', 'BÜHNENLABOR / 01', '무대 실험실 / 01'],
  ['The floating voice', 'Die schwebende Stimme', '공중에 떠 있는 목소리'],
  ['THE FLOATING VOICE', 'DIE SCHWEBENDE STIMME', '공중에 떠 있는 목소리'],
  ['Motion study', 'Bewegungsstudie', '움직임 연구'],
  ['Settings', 'Einstellungen', '설정'],
  ['Language', 'Sprache', '언어'],
  ['English', 'English', 'English'],
  ['Deutsch', 'Deutsch', 'Deutsch'],
  ['한국어', '한국어', '한국어'],
  ['Share setup', 'Aufbau teilen', '설정 공유'],
  ['Share setup ↗', 'Aufbau teilen ↗', '설정 공유 ↗'],
  ['Export', 'Exportieren', '내보내기'],
  ['Export ↓', 'Exportieren ↓', '내보내기 ↓'],
  ['Configuration · JSON', 'Konfiguration · JSON', '설정 · JSON'],
  ['3D scene · GLB', '3D-Szene · GLB', '3D 장면 · GLB'],
  ['Motion recording · CSV', 'Bewegungsaufzeichnung · CSV', '동작 기록 · CSV'],
  ['Current view · PNG', 'Aktuelle Ansicht · PNG', '현재 화면 · PNG'],
  ['Current setup · FreeCAD macro', 'Aktueller Aufbau · FreeCAD-Makro', '현재 설정 · FreeCAD 매크로'],
  ['Instructions & model notes', 'Anleitung & Modellhinweise', '사용 안내 및 모델 설명'],
  ['Instructions & model notes ↗', 'Anleitung & Modellhinweise ↗', '사용 안내 및 모델 설명 ↗'],
  ['A LITTLE THEATRE. A LOT OF POSSIBILITY.', 'KLEINES THEATER. VIELE MÖGLICHKEITEN.', '작은 무대, 무한한 가능성.'],
  ['Scene setup', 'Bühnenaufbau', '장면 설정'],
  ['Reset', 'Zurücksetzen', '초기화'],
  ['Restore the default scene', 'Standardszene wiederherstellen', '기본 장면 복원'],
  ['Shape the space. Find the movement.', 'Gestalte den Raum. Finde die Bewegung.', '공간을 만들고, 움직임을 찾아보세요.'],
  ['Settings categories', 'Einstellungskategorien', '설정 카테고리'],
  ['Motion', 'Bewegung', '동작'],
  ['Stage', 'Bühne', '무대'],
  ['Head', 'Kopf', '머리'],
  ['Physics', 'Physik', '물리'],
  ['Save setup', 'Aufbau speichern', '설정 저장'],
  ['Load setup', 'Aufbau laden', '설정 불러오기'],
  ['Saved in this browser · dimensions in metres', 'In diesem Browser gespeichert · Maße in Metern', '이 브라우저에 저장됨 · 길이 단위: 미터'],
  ['Stage simulator', 'Bühnensimulator', '무대 시뮬레이터'],
  ['Camera views', 'Kameraansichten', '카메라 시점'],
  ['Perspective', 'Perspektive', '원근'],
  ['Front', 'Vorne', '정면'],
  ['Side', 'Seite', '측면'],
  ['Top', 'Oben', '위에서'],
  ['Toggle stage grid', 'Bühnenraster ein-/ausblenden', '무대 격자 표시 전환'],
  ['Cutaway', 'Schnittansicht', '단면 보기'],
  ['Hide performer', 'Figur ausblenden', '인물 숨기기'],
  ['Show performer', 'Figur einblenden', '인물 표시'],
  ['Interactive 3D stage. Drag to orbit; scroll to zoom; right-drag to pan.', 'Interaktive 3D-Bühne. Ziehen zum Drehen; scrollen zum Zoomen; mit rechter Maustaste ziehen zum Verschieben.', '대화형 3D 무대입니다. 드래그하여 회전, 스크롤하여 확대·축소, 오른쪽 버튼으로 드래그하여 이동하세요.'],
  ['VERTICAL SUSPENSION', 'SENKRECHTE AUFHÄNGUNG', '수직 현수'],
  ['COUNTERBALANCED BOOM', 'AUSLEGER MIT GEGENGEWICHT', '평형추 붐'],
  ['A presence,', 'Eine Präsenz,', '하나의 존재,'],
  ['almost weightless.', 'fast schwerelos.', '거의 무중력처럼.'],
  ['A presence, almost weightless.', 'Eine Präsenz, fast schwerelos.', '하나의 존재, 거의 무중력처럼.'],
  ['Orbit to explore · scroll to get closer', 'Drehen zum Erkunden · scrollen zum Näherkommen', '회전하며 둘러보기 · 스크롤하여 가까이 보기'],
  ['HEAD', 'KOPF', '머리'],
  ['MIC', 'MIKRO', '마이크'],
  ['PERFORMER', 'FIGUR', '인물'],
  ['PERFORMER · {height} m', 'FIGUR · {height} m', '인물 · {height} m'],
  ['PERFORMER · 1.78 m', 'FIGUR · 1,78 m', '인물 · 1.78 m'],
  ['Concept physics · not structural validation', 'Konzeptphysik · kein Tragfähigkeitsnachweis', '개념 물리 모델 · 구조 검증용 아님'],
  ['Software 3D · simplified lighting · concept physics', 'Software-3D · vereinfachtes Licht · Konzeptphysik', '소프트웨어 3D · 간소화된 조명 · 개념 물리 모델'],
  ['↝ Test sway', '↝ Pendeln testen', '↝ 흔들림 시험'],
  ['Setting the stage', 'Die Bühne entsteht', '무대 준비 중'],
  ['Preparing the lights and mechanisms…', 'Licht und Mechanik werden vorbereitet…', '조명과 장치를 준비하고 있습니다…'],
  ['The 3D view could not start.', 'Die 3D-Ansicht konnte nicht gestartet werden.', '3D 화면을 시작할 수 없습니다.'],
  ['HEAD HEIGHT', 'KOPFHÖHE', '머리 높이'],
  ['MOUTH / MIC Δ', 'MUND / MIKRO Δ', '입 / 마이크 Δ'],
  ['HEAD SWAY', 'KOPFPENDELN', '머리 흔들림'],
  ['LINE LOAD, TOTAL', 'SEILLAST GESAMT', '전체 로프 하중'],
  ['PERFORMER CLEARANCE', 'ABSTAND ZUR FIGUR', '인물과의 간격'],
  ['Standing by', 'Bereit', '대기 중'],
  ['MOTION CUES', 'BEWEGUNGSABLAUF', '동작 큐'],
  ['Standby', 'Bereit', '대기'],
  ['Preview', 'Vorschau', '미리보기'],
  ['Simulation preview speed', 'Geschwindigkeit der Simulationsvorschau', '시뮬레이션 미리보기 속도'],
  ['1× real time', '1× Echtzeit', '1× 실시간'],
  ['▶ Run show', '▶ Ablauf starten', '▶ 공연 시작'],
  ['↓ Descend', '↓ Absenken', '↓ 내리기'],
  ['Ⅱ Hold', 'Ⅱ Halten', 'Ⅱ 정지'],
  ['↑ Return', '↑ Zurückfahren', '↑ 복귀'],
  ['TRAVEL', 'HUB', '이동 범위'],
  ['Scrub the lift position', 'Hubposition direkt einstellen', '높이 직접 조절'],
  ['■ STOP', '■ STOPP', '■ 정지'],
  ['Latch a simulated emergency stop', 'Simulierten Not-Halt verriegeln', '시뮬레이션 비상 정지 잠금'],
  ['Mechanism', 'Mechanismus', '장치 방식'],
  ['╎ Suspended', '╎ Aufgehängt', '╎ 현수 방식'],
  ['⌁ Pivoting boom', '⌁ Schwenkausleger', '⌁ 회전 붐'],
  ['One shared height command. Independent jaw and head pitch.', 'Ein gemeinsamer Höhenbefehl. Kiefer und Kopfneigung sind unabhängig.', '하나의 높이 명령을 공유합니다. 턱과 머리 기울기는 독립적으로 움직입니다.'],
  ['Vertical travel', 'Senkrechter Hub', '수직 이동'],
  ['Highest head centre', 'Oberste Kopfmitte', '머리 중심 최고 높이'],
  ['Lowest head centre', 'Unterste Kopfmitte', '머리 중심 최저 높이'],
  ['Mic offset from mouth', 'Mikrofonversatz zum Mund', '입 기준 마이크 높이차'],
  ['Current head centre', 'Aktuelle Kopfmitte', '현재 머리 중심 높이'],
  ['Travel limits are measured above the deck. The microphone follows the mouth height as the head tilts.', 'Die Hubgrenzen werden über dem Bühnenboden gemessen. Das Mikrofon folgt der Mundhöhe, wenn sich der Kopf neigt.', '이동 한계는 무대 바닥 위 높이로 측정합니다. 머리가 기울어지면 마이크가 입 높이를 따라갑니다.'],
  ['Motion profile', 'Bewegungsprofil', '동작 프로파일'],
  ['Descent speed', 'Absenkgeschwindigkeit', '하강 속도'],
  ['Return speed', 'Rückfahrgeschwindigkeit', '복귀 속도'],
  ['Acceleration', 'Beschleunigung', '가속도'],
  ['Bottom hold', 'Haltezeit unten', '아래쪽 대기 시간'],
  ['Boom geometry', 'Auslegergeometrie', '붐 형상'],
  ['Pivot to tip', 'Drehpunkt bis Spitze', '회전축에서 끝까지'],
  ['In boom mode the head follows an arc. The pivot is derived from travel limits; the microphone stays on its own vertical path.', 'Im Auslegermodus bewegt sich der Kopf auf einem Kreisbogen. Der Drehpunkt ergibt sich aus den Hubgrenzen; das Mikrofon bleibt auf seiner eigenen senkrechten Bahn.', '붐 모드에서는 머리가 원호를 따라 움직입니다. 회전축은 이동 한계에서 계산하며, 마이크는 별도의 수직 경로를 유지합니다.'],
  ['{distance} m travel · descent ≈ {down} · return ≈ {up} at real time, plus ramps.', '{distance} m Hub · Absenken ≈ {down} · Rückfahrt ≈ {up} in Echtzeit, zuzüglich Beschleunigung und Abbremsen.', '이동 거리 {distance} m · 실시간 하강 ≈ {down} · 복귀 ≈ {up} · 가속·감속 시간 별도.'],
  ['The space', 'Der Raum', '무대 공간'],
  ['Stage width', 'Bühnenbreite', '무대 너비'],
  ['Stage depth', 'Bühnentiefe', '무대 깊이'],
  ['Deck above floor', 'Bühnenhöhe über Boden', '지면 기준 무대 높이'],
  ['Rigging above deck', 'Aufhängung über Bühne', '무대 기준 리깅 높이'],
  ['Head suspension position', 'Aufhängeposition des Kopfes', '머리 현수 위치'],
  ['Left / right · X', 'Links / rechts · X', '좌 / 우 · X'],
  ['Front / back · Z', 'Vorne / hinten · Z', '앞 / 뒤 · Z'],
  ['Positive X is audience-right. Positive Z faces the audience. In boom mode these coordinates set the upper endpoint.', 'Positives X liegt aus Publikumssicht rechts. Positives Z zeigt zum Publikum. Im Auslegermodus legen diese Koordinaten den oberen Endpunkt fest.', 'X의 양의 방향은 관객이 보는 오른쪽입니다. Z의 양의 방향은 관객 쪽입니다. 붐 모드에서는 이 좌표가 위쪽 끝점을 정합니다.'],
  ['Microphone position', 'Mikrofonposition', '마이크 위치'],
  ['Performer reference', 'Referenzfigur', '기준 인물'],
  ['Performer height', 'Größe der Figur', '인물 키'],
  ['Presentation', 'Darstellung', '화면 표현'],
  ['Stage lighting', 'Bühnenlicht', '무대 조명'],
  ['Midnight', 'Mitternacht', '한밤'],
  ['Warm theatre', 'Warmes Theaterlicht', '따뜻한 극장 조명'],
  ['Work lights', 'Arbeitslicht', '작업등'],
  ['Object labels', 'Objektbeschriftungen', '물체 이름표'],
  ['Deck grid', 'Bühnenraster', '무대 격자'],
  ['Cutaway view', 'Schnittansicht', '단면 보기'],
  ['The floating head', 'Der schwebende Kopf', '공중에 떠 있는 머리'],
  ['Head size', 'Kopfgröße', '머리 크기'],
  ['Moving head mass', 'Bewegte Kopfmasse', '움직이는 머리 질량'],
  ['Mic + moving cable', 'Mikro + bewegtes Kabel', '마이크 + 움직이는 케이블'],
  ['The stylised shell is approximately 0.46 m wide and 0.56 m tall at 1×. Scale it to the intended prop.', 'Die stilisierte Hülle ist bei 1× etwa 0,46 m breit und 0,56 m hoch. Passe den Maßstab an die geplante Requisite an.', '단순화된 외형은 1×에서 너비 약 0.46 m, 높이 약 0.56 m입니다. 실제 소품에 맞게 크기를 조절하세요.'],
  ['The foam mannequin has a smooth face and a hinged lower jaw.', 'Der Schaumstoffkopf hat ein glattes Gesicht und einen Unterkiefer mit Scharnier.', '폼 마네킹 머리는 매끄러운 얼굴과 경첩으로 움직이는 아래턱을 갖추고 있습니다.'],
  ['Expression', 'Ausdruck', '표정'],
  ['Pitch at the top', 'Neigung oben', '위쪽 머리 기울기'],
  ['Pitch at the bottom', 'Neigung unten', '아래쪽 머리 기울기'],
  ['Maximum jaw opening', 'Maximale Kieferöffnung', '최대 턱 벌림 각도'],
  ['Negative pitch looks up; positive pitch looks down. The pitch follows actual head height.', 'Bei negativer Neigung blickt der Kopf nach oben, bei positiver nach unten. Die Neigung folgt der tatsächlichen Kopfhöhe.', '음수 각도에서는 위를 보고, 양수에서는 아래를 봅니다. 기울기는 실제 머리 높이를 따라 변합니다.'],
  ['Animate jaw', 'Kiefer animieren', '턱 움직이기'],
  ['Stop jaw test', 'Kiefertest stoppen', '턱 시험 멈추기'],
  ['Voice synchronisation', 'Sprachsynchronisation', '음성 동기화'],
  ['Choose dialogue audio', 'Dialog-Audiodatei wählen', '대사 오디오 선택'],
  ['No dialogue file selected', 'Keine Dialogdatei ausgewählt', '선택한 대사 파일 없음'],
  ['Play audio', 'Audio abspielen', '오디오 재생'],
  ['Pause audio', 'Audio pausieren', '오디오 일시 정지'],
  ['Audio stays on your device. Jaw opening follows its amplitude, with a noise gate and smoothing. This is not phoneme animation.', 'Die Audiodatei bleibt auf deinem Gerät. Die Kieferöffnung folgt dem Pegel, mit Rauschschwelle und Glättung. Einzelne Sprachlaute werden nicht nachgebildet.', '오디오는 기기에만 저장됩니다. 턱은 노이즈 게이트와 평활화를 적용한 음량에 따라 열립니다. 음소별 입 모양을 구현한 것은 아닙니다.'],
  ['Internal light', 'Innenbeleuchtung', '내부 조명'],
  ['LED colour', 'LED-Farbe', 'LED 색상'],
  ['Brightness', 'Helligkeit', '밝기'],
  ['Slow colour cycle', 'Langsamer Farbwechsel', '느린 색상 순환'],
  ['Pendulum model', 'Pendelmodell', '진자 모델'],
  ['Gravity', 'Erdbeschleunigung', '중력 가속도'],
  ['Velocity damping', 'Geschwindigkeitsdämpfung', '속도 감쇠'],
  ['Payload collisions', 'Kollisionen der Nutzlasten', '탑재물 충돌'],
  ['Gravity, variable-length rope constraints and moving anchors. Head and mic are point masses with spherical contact envelopes; the performer is a cylinder.', 'Schwerkraft, Seilbedingungen mit variabler Länge und bewegte Aufhängepunkte. Kopf und Mikrofon sind Punktmassen mit kugelförmigen Kollisionshüllen; die Figur ist ein Zylinder.', '중력, 길이가 변하는 로프 구속 조건, 움직이는 고정점을 적용합니다. 머리와 마이크는 구형 충돌 영역을 가진 질점이며, 인물은 원기둥으로 표현합니다.'],
  ['Manual pendant', 'Handsteuerung', '수동 조작기'],
  ['↑ Hold to raise', '↑ Halten zum Anheben', '↑ 누르는 동안 올리기'],
  ['↓ Hold to lower', '↓ Halten zum Absenken', '↓ 누르는 동안 내리기'],
  ['Hold a button to move; release to hold. The emergency stop latches until you reset it. All controls here are simulation only.', 'Zum Bewegen eine Taste gedrückt halten; beim Loslassen hält der Antrieb. Der Not-Halt bleibt bis zum Zurücksetzen verriegelt. Alle Bedienelemente steuern nur die Simulation.', '버튼을 누르는 동안 움직이고, 놓으면 정지합니다. 비상 정지는 해제할 때까지 잠깁니다. 이곳의 모든 조작은 시뮬레이션에만 적용됩니다.'],
  ['Load estimates', 'Lastschätzungen', '하중 추정'],
  ['Suspended mass, head + microphone', 'Hängende Masse, Kopf + Mikrofon', '매달린 질량, 머리 + 마이크'],
  ['Peak estimated combined line load', 'Geschätzte maximale Gesamtseillast', '추정 최대 합산 로프 하중'],
  ['Boom payload moment, before counterweight', 'Nutzlastmoment am Ausleger, ohne Gegengewicht', '평형추 적용 전 붐의 탑재물 모멘트'],
  ['Line loads are approximate pendulum loads. No structural deflection, rope stretch, brake dynamics, motor losses, rigging capacity or compliance calculation is included.', 'Die Seillasten sind näherungsweise Pendellasten. Durchbiegung, Seildehnung, Bremsdynamik, Motorverluste, Tragfähigkeit der Aufhängung und Normnachweise werden nicht berechnet.', '로프 하중은 진자 모델의 근삿값입니다. 구조 처짐, 로프 신장, 브레이크 동역학, 모터 손실, 리깅 허용 하중 및 규정 적합성 계산은 포함하지 않습니다.'],
  ['Disturbance test', 'Störungstest', '외란 시험'],
  ['↝ Apply sideways impulse', '↝ Seitlichen Impuls geben', '↝ 옆으로 충격 주기'],
  ['Apply a 0.38 N·s sideways impulse to the head. Compare damping, head mass and changing cable length.', 'Gib dem Kopf einen seitlichen Impuls von 0,38 N·s. Vergleiche Dämpfung, Kopfmasse und unterschiedliche Seillängen.', '머리에 0.38 N·s의 측면 충격량을 가합니다. 감쇠, 머리 질량, 케이블 길이를 바꾸며 비교해 보세요.'],
  ['Choose a Ghostlight configuration JSON file.', 'Wähle eine Ghostlight-Konfigurationsdatei im JSON-Format.', 'Ghostlight 설정 JSON 파일을 선택하세요.'],
  ['This configuration version is not supported.', 'Diese Konfigurationsversion wird nicht unterstützt.', '이 설정 버전은 지원하지 않습니다.'],
  ['No recognised stage settings in this file.', 'Diese Datei enthält keine erkannten Bühneneinstellungen.', '이 파일에 인식할 수 있는 무대 설정이 없습니다.'],
  ['The shared setup could not be read. Default scene loaded.', 'Der geteilte Aufbau konnte nicht gelesen werden. Die Standardszene wurde geladen.', '공유 설정을 읽을 수 없어 기본 장면을 불러왔습니다.'],
  ['Reset the simulated stop before seeking a pose.', 'Setze den simulierten Stopp zurück, bevor du eine Position anfährst.', '위치를 지정하기 전에 시뮬레이션 정지 잠금을 해제하세요.'],
  ['Audio playback was blocked. Try the play button again.', 'Die Audiowiedergabe wurde blockiert. Drücke erneut auf Abspielen.', '오디오 재생이 차단되었습니다. 재생 버튼을 다시 눌러 보세요.'],
  ['Reset the simulated emergency stop before moving.', 'Setze den simulierten Not-Halt vor der Bewegung zurück.', '움직이기 전에 시뮬레이션 비상 정지를 해제하세요.'],
  ['Sideways impulse applied to the head. Use 1× to inspect real-time sway.', 'Der Kopf hat einen seitlichen Impuls erhalten. Bei 1× siehst du das Pendeln in Echtzeit.', '머리에 측면 충격을 가했습니다. 1× 속도로 실시간 흔들림을 살펴보세요.'],
  ['Descending', 'Absenken', '하강 중'],
  ['Returning', 'Rückfahrt', '복귀 중'],
  ['Holding below', 'Halten unten', '아래쪽 대기'],
  ['Stop latched', 'Stopp verriegelt', '정지 잠금'],
  ['Contact detected', 'Kontakt erkannt', '접촉 감지'],
  ['Outside deck', 'Außerhalb der Bühne', '무대 범위 밖'],
  ['Close clearance', 'Geringer Abstand', '간격 부족'],
  ['Height mismatch', 'Höhenabweichung', '높이 불일치'],
  ['Lift holding', 'Antrieb hält', '리프트 정지 중'],
  ['Motion active', 'Bewegung aktiv', '동작 중'],
  ['Boom not active', 'Ausleger nicht aktiv', '붐 비활성'],
  ['↻ Reset stop', '↻ Stopp zurücksetzen', '↻ 정지 해제'],
  ['Exported {count} samples. SI units; sample period ≈ 0.1 s.', '{count} Messpunkte exportiert. SI-Einheiten; Abtastintervall ≈ 0,1 s.', '샘플 {count}개를 내보냈습니다. SI 단위, 샘플 간격 ≈ 0.1 s.'],
  ['Exporting…', 'Wird exportiert…', '내보내는 중…'],
  ['Loading the 3D exporter…', '3D-Exporter wird geladen…', '3D 내보내기 도구를 불러오는 중…'],
  ['Converting the visible scene to GLB…', 'Die sichtbare Szene wird in GLB umgewandelt…', '보이는 장면을 GLB로 변환하는 중…'],
  ['3D scene exported. This captures the current pose.', '3D-Szene exportiert. Sie enthält die aktuelle Position.', '3D 장면을 내보냈습니다. 현재 자세가 저장됩니다.'],
  ['Could not encode the current view.', 'Die aktuelle Ansicht konnte nicht als Bild gespeichert werden.', '현재 화면을 이미지로 변환할 수 없습니다.'],
  ['FreeCAD template unavailable.', 'Die FreeCAD-Vorlage ist nicht verfügbar.', 'FreeCAD 템플릿을 사용할 수 없습니다.'],
  ['FreeCAD macro exported with your current dimensions and pose.', 'FreeCAD-Makro mit den aktuellen Maßen und Positionen exportiert.', '현재 치수와 자세를 반영한 FreeCAD 매크로를 내보냈습니다.'],
  ['Export failed: {error}', 'Export fehlgeschlagen: {error}', '내보내기 실패: {error}'],
  ['Dialogue loaded locally. Press Play audio to drive the jaw.', 'Dialog lokal geladen. Drücke auf Audio abspielen, um den Kiefer zu bewegen.', '대사를 기기에서 불러왔습니다. 오디오 재생을 누르면 턱이 움직입니다.'],
  ['Could not load audio: {error}', 'Audio konnte nicht geladen werden: {error}', '오디오를 불러올 수 없습니다: {error}'],
  ['Stop reset. The lift remains on hold.', 'Stopp zurückgesetzt. Der Antrieb bleibt im Haltezustand.', '정지 잠금을 해제했습니다. 리프트는 정지 상태를 유지합니다.'],
  ['Simulated stop latched. Drive motion stopped; residual sway continues.', 'Simulierter Stopp verriegelt. Der Antrieb steht; vorhandenes Pendeln klingt weiter ab.', '시뮬레이션 정지를 잠갔습니다. 구동은 멈추지만 남아 있는 흔들림은 계속됩니다.'],
  ['Close', 'Schließen', '닫기'],
  ['Default stage restored.', 'Standardbühne wiederhergestellt.', '기본 무대를 복원했습니다.'],
  ['Configuration is too large.', 'Die Konfigurationsdatei ist zu groß.', '설정 파일이 너무 큽니다.'],
  ['Stage setup loaded.', 'Bühnenaufbau geladen.', '무대 설정을 불러왔습니다.'],
  ['Setup link copied. It includes dimensions, position and camera view.', 'Aufbaulink kopiert. Er enthält Maße, Position und Kameraansicht.', '설정 링크를 복사했습니다. 치수, 위치, 카메라 시점이 포함됩니다.'],
  ['Share link saved as a text file.', 'Freigabelink als Textdatei gespeichert.', '공유 링크를 텍스트 파일로 저장했습니다.'],
  ['{error}. Open the project through HTTP (GitHub Pages or a local server), and use a browser with WebGL 2 enabled.', '{error}. Öffne das Projekt über HTTP (GitHub Pages oder einen lokalen Server) und verwende einen Browser mit aktiviertem WebGL 2.', '{error}. HTTP를 통해 프로젝트를 여세요(GitHub Pages 또는 로컬 서버). WebGL 2가 활성화된 브라우저를 사용하세요.'],
  ['Reference scene', 'Referenzszene', '기준 장면'],
  ['Explore the stage', 'Die Bühne erkunden', '무대 둘러보기'],
  ['Drag to orbit, scroll or pinch to zoom, and use the camera buttons for fixed views.', 'Ziehe zum Drehen, scrolle oder nutze zwei Finger zum Zoomen. Die Kameratasten zeigen feste Ansichten.', '드래그하여 회전하고, 스크롤하거나 두 손가락으로 확대·축소하세요. 카메라 버튼으로 고정 시점을 선택할 수 있습니다.'],
  ['Use Motion to choose suspension or boom, set travel limits, and adjust descent and return speeds.', 'Unter Bewegung wählst du Aufhängung oder Ausleger, legst die Hubgrenzen fest und stellst Absenk- und Rückfahrgeschwindigkeit ein.', '동작 탭에서 현수 또는 붐 방식을 선택하고, 이동 한계와 하강·복귀 속도를 조절하세요.'],
  ['Use Head to test the jaw, change lighting, or choose a dialogue audio file.', 'Unter Kopf kannst du den Kiefer testen, das Licht ändern oder eine Dialog-Audiodatei wählen.', '머리 탭에서 턱을 시험하고, 조명을 바꾸거나 대사 오디오 파일을 선택하세요.'],
  ['Use Stage to change dimensions and positions. Hide performer removes the reference figure and its contact envelope.', 'Unter Bühne änderst du Maße und Positionen. Figur ausblenden entfernt die Referenzfigur und ihre Kollisionshülle.', '무대 탭에서 치수와 위치를 바꾸세요. 인물 숨기기를 누르면 기준 인물과 충돌 영역이 제거됩니다.'],
  ['Save setup keeps a reusable JSON file. Load setup restores it. Share setup copies a link with your scene settings.', 'Aufbau speichern erstellt eine wiederverwendbare JSON-Datei. Aufbau laden stellt sie wieder her. Aufbau teilen kopiert einen Link mit deinen Szeneneinstellungen.', '설정 저장은 다시 사용할 수 있는 JSON 파일을 만듭니다. 설정 불러오기로 복원하고, 설정 공유로 장면 설정이 담긴 링크를 복사할 수 있습니다.'],
  ['This is a motion and rough clearance study. It does not validate structures or lifting equipment.', 'Dies ist eine Bewegungsstudie mit grober Abstandsprüfung. Sie liefert keinen Nachweis für Tragwerke oder Hebezeuge.', '이 도구는 움직임과 대략적인 간격을 검토하기 위한 것입니다. 구조물이나 인양 장비의 안전성을 검증하지 않습니다.'],
  ['Explore a floating animatronic head and descending microphone on an editable 3D theatre stage. A motion and clearance study built with Three.js.', 'Erkunde einen schwebenden Animatronik-Kopf und ein absinkendes Mikrofon auf einer anpassbaren 3D-Theaterbühne. Eine Bewegungs- und Abstandsstudie mit Three.js.', '편집 가능한 3D 극장 무대에서 공중에 떠 있는 애니매트로닉 머리와 내려오는 마이크를 살펴보세요. Three.js로 구현한 동작 및 간격 검토 도구입니다.']
];

const catalogs = {
  en: Object.fromEntries(MESSAGES.map(([source]) => [source, source])),
  de: Object.fromEntries(MESSAGES.map(([source, german]) => [source, german])),
  ko: Object.fromEntries(MESSAGES.map(([source, , korean]) => [source, korean]))
};

function languageCode(value) {
  if (typeof value !== 'string') return null;
  const code = value.toLowerCase().split(/[-_]/)[0];
  return Object.hasOwn(LOCALES, code) ? code : null;
}

function initialLanguage() {
  try {
    const saved = languageCode(globalThis.localStorage?.getItem(STORAGE_KEY));
    if (saved) return saved;
  } catch { /* Storage can be unavailable in private or embedded contexts. */ }
  const browser = globalThis.navigator;
  const preferences = browser?.languages?.length ? browser.languages : [browser?.language];
  for (const preference of preferences) {
    const code = languageCode(preference);
    if (code) return code;
  }
  return 'en';
}

let currentLanguage = initialLanguage();
const numberFormatters = new Map();

function updateDocumentLanguage() {
  if (globalThis.document?.documentElement) {
    globalThis.document.documentElement.lang = currentLanguage;
  }
}
updateDocumentLanguage();

export function getLanguage() {
  return currentLanguage;
}

export function setLanguage(code) {
  currentLanguage = languageCode(code) || 'en';
  updateDocumentLanguage();
  try { globalThis.localStorage?.setItem(STORAGE_KEY, currentLanguage); } catch { /* Optional persistence. */ }
  return currentLanguage;
}

export function t(source, vars = {}) {
  const key = String(source ?? '');
  const translated = Object.hasOwn(catalogs[currentLanguage], key)
    ? catalogs[currentLanguage][key] : key;
  return translated.replace(/\{(\w+)\}/g, (placeholder, name) =>
    Object.hasOwn(vars, name) ? String(vars[name]) : placeholder
  );
}

/** Translate leaves only: put data-i18n on the text span, not its parent button. */
export function translateDOM(root = globalThis.document) {
  if (!root) return;
  const attributes = [
    ['data-i18n', null],
    ['data-i18n-title', 'title'],
    ['data-i18n-label', 'aria-label'],
    ['data-i18n-placeholder', 'placeholder']
  ];
  for (const [sourceAttribute, targetAttribute] of attributes) {
    const selector = `[${sourceAttribute}]`;
    const elements = Array.from(root.querySelectorAll?.(selector) || []);
    if (root.matches?.(selector)) elements.unshift(root);
    for (const element of elements) {
      const value = t(element.getAttribute(sourceAttribute));
      if (targetAttribute) element.setAttribute(targetAttribute, value);
      else element.textContent = value;
    }
  }
}

/** Display only. Number inputs and exported numeric data must retain raw numbers. */
export function formatNumber(value, digits = 2) {
  const precision = Number.isFinite(Number(digits))
    ? Math.max(0, Math.min(20, Math.trunc(Number(digits)))) : 2;
  const key = `${currentLanguage}:${precision}`;
  if (!numberFormatters.has(key)) {
    numberFormatters.set(key, new Intl.NumberFormat(LOCALES[currentLanguage], {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
      useGrouping: false
    }));
  }
  return numberFormatters.get(key).format(Number(value));
}
