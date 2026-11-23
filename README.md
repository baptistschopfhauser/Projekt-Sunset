# MEGA-PROMPT: PROJECT SUNSET

Ein eigenständiges, hochdetailliertes Open-World-Crime-Spiel für den Browser – vollständige Entwicklungsspezifikation für Claude.

Ziel ist kein gewöhnlicher GTA-inspirierter Browserprototyp. Erschaffe eine zusammenhängende Spielwelt, in der Fahrzeuge, Polizei, NPCs, Wirtschaft, Minigames, Missionen und die Umgebung tatsächlich miteinander funktionieren. Der folgende Auftrag ist als EIN EINZIGER, selbstständig abzuarbeitender Mega-Prompt zu verstehen. Alle gestalterischen Festlegungen sind verbindlich.

# BEGINN DES MEGA-PROMPTS

## KAPITEL 0 – DEINE ROLLE UND DER VERBINDLICHE AUFTRAG

Du bist ein eigenständig arbeitendes, hochqualifiziertes Videospiel-Entwicklungsteam. Du übernimmst gleichzeitig die Aufgaben eines Technical Directors, Lead Gameplay Programmers, Senior Graphics Engineers, AI Programmers, World Designers, Level Designers, Vehicle Physics Engineers, Character Animation Engineers, UI/UX Designers, Economy Systems Designers, Audio Designers, Technical Artists, Quality Assurance Engineers und Build Engineers.

Dein Auftrag besteht darin, ein vollständig spielbares, visuell beeindruckendes und mechanisch tiefgehendes Open-World-Crime-Spiel für den Browser zu entwickeln.

Arbeitstitel: PROJECT SUNSET. Name der Spielwelt: SUNSET COUNTY. Zentrale Metropole: PORT SOLACE.

Das Spiel muss eine eigenständige Identität besitzen. Es darf sich bei Spielgenre, Spielerlebnis und grundsätzlicher Struktur an hochwertigen modernen Third-Person-Open-World-Spielen orientieren. Du darfst jedoch keine urheberrechtlich geschützten Charaktere, Dialoge, Logos, Musikstücke, Fahrzeugmarken, Karten, Missionen oder sonstigen konkret geschützten Inhalte existierender Spiele kopieren. Die Welt, ihre Charaktere, ihr Erscheinungsbild und ihre konkreten Inhalte müssen eigenständig sein.

Du sollst dieses Spiel nicht nur planen, beschreiben, simulieren oder als Mockup darstellen. DU SOLLST ES TATSÄCHLICH IMPLEMENTIEREN.

### 0.1 Oberste Zieldefinition

Am Ende deiner Arbeit muss eine lokal startbare Browseranwendung existieren, die eine dreidimensionale, zusammenhängende Open World darstellt. Innerhalb dieser Welt muss der Spieler mindestens folgende Aktivitäten ausführen können:

- Sich in Third-Person-Perspektive frei bewegen.
- Eine abwechslungsreiche Stadt und die umliegende Landschaft erkunden.
- Unterschiedliche Fahrzeuge betreten, verlassen und steuern.
- Mit verschiedenen Zivilisten, Geschäften und Objekten interagieren.
- Einen vollständigen Tag-Nacht-Zyklus erleben.
- Geld besitzen, verdienen und ausgeben.
- Ein funktionierendes Casino besuchen.
- Mindestens drei zusätzliche Freizeitaktivitäten spielen.
- Ein Fahndungssystem mit mehreren Eskalationsstufen auslösen.
- Vor Polizeifahrzeugen flüchten.
- Waffen benutzen und ein vollständiges Kampfsystem verwenden.
- Eine mehrstufige Hauptmission absolvieren.
- Die Auswirkungen eigener Handlungen innerhalb der Spielwelt erleben.
- Fahrzeuge kaufen, reparieren und individualisieren.
- Seinen Spielfortschritt speichern und laden.
- Im freien Spiel außerhalb der Hauptmission weitere Aktivitäten ausführen.

Es darf sich nicht um eine statische Präsentation dieser Funktionen handeln. Jede implementierte Funktion muss tatsächlich benutzbar sein. Ein Casino, das lediglich aus einem Gebäude mit der Aufschrift „CASINO“ besteht, zählt nicht als Casino. Ein Fahrzeughändler, der nur ein Menü mit Fahrzeugnamen öffnet, ohne dass gekaufte Fahrzeuge in der Spielwelt erscheinen, zählt nicht als vollständiger Fahrzeughändler. Eine Polizei, die lediglich auf den Spieler zufährt, ohne ein nachvollziehbares Fahndungsverhalten zu besitzen, zählt nicht als funktionierendes Polizeisystem. Ein NPC, der an einer festen Position steht und sich zufällig dreht, zählt nicht als glaubwürdiger Bestandteil einer lebendigen Stadt.

### 0.2 Verbot von oberflächlichen Implementierungen

Folgende Vorgehensweisen sind ausdrücklich untersagt:
1. Ein riesiges Gebiet aus identischen quadratischen Stadtblöcken zusammensetzen.
2. Eine Stadt ausschließlich aus einfachen Würfeln als Gebäude erstellen.
3. Unfertige Mechaniken als vollständig implementierte Features darstellen.
4. Eine Mission ausschließlich aus dem Erreichen zweier Wegpunkte bestehen lassen.
5. NPCs ohne nachvollziehbare Verhaltenszustände wahllos herumspawnen.
6. Fahrzeuge ohne erkennbare Unterschiede in Beschleunigung, Gewicht und Fahrverhalten implementieren.
7. Die Polizei ausschließlich über teleportierende Fahrzeuge erzeugen.
8. Ein Kasino lediglich als dekorative Kulisse darstellen.
9. Komplexe Interaktionen durch Textmeldungen ersetzen, wenn eine tatsächliche Handlung technisch möglich ist.
10. Interaktive Gebäude und Geschäfte durch einfache Platzhalterfenster ersetzen.
11. Den Spieler außerhalb einer Mission praktisch nichts Sinnvolles tun lassen.
12. Den Spielfortschritt ausschließlich im flüchtigen Arbeitsspeicher verwalten.
13. Technische Fehler durch Abschalten kompletter Systeme verstecken.
14. Die eigentliche Spieleentwicklung zugunsten einer umfangreichen Dokumentation abbrechen.
15. Unfertige Inhalte mit Behauptungen wie „vollständig funktionsfähig“ oder „AAA-Qualität“ bezeichnen.

### 0.3 Eigenständige Arbeitsweise

Du erhältst mit diesem Prompt sämtliche verbindlichen Designanforderungen. Frage nicht nach dem Spielgenre, der Spielwelt, der grafischen Richtung, der Farbpalette, dem Gameplay, den Fahrzeugtypen, der Charaktergestaltung, den Missionen, dem Casino, dem Kampfsystem, der Benutzeroberfläche, den Steuerungseinstellungen, dem wirtschaftlichen Fortschritt oder dem gewünschten Umfang. Diese Entscheidungen werden in diesem Dokument vorgegeben.

Du darfst selbstständige technische Entscheidungen treffen, soweit sie nötig sind, um die beschriebenen Ergebnisse auf der tatsächlich verfügbaren Entwicklungsumgebung zuverlässig umzusetzen. Das betrifft beispielsweise interne Datenstrukturen, technische Abhängigkeiten, Optimierungsverfahren oder Implementierungsdetails. Diese Entscheidungsbefugnis berechtigt dich nicht dazu, verbindliche Gameplay-Features eigenmächtig zu streichen oder ihre Bedeutung zu verändern.

### 0.4 Wahrheitspflicht bei der Implementierung

Es ist wichtiger, ein System zuverlässig umzusetzen, als ein umfangreiches System lediglich zu behaupten. Wenn eine technische Einschränkung verhindert, dass eine gewünschte Funktion exakt wie beschrieben implementiert werden kann, musst du zunächst ernsthaft versuchen, die Funktion wie gefordert umzusetzen, das Hindernis konkret identifizieren, alternative technische Lösungen prüfen, eine möglichst gleichwertige Lösung implementieren und die Abweichung im abschließenden Entwicklungsbericht transparent dokumentieren. Du darfst keine Funktionen als getestet bezeichnen, die du nicht tatsächlich getestet hast. Du darfst keine Leistungswerte erfinden oder nicht existente Assets, Downloads und Schnittstellen als verfügbar behandeln.

### 0.5 Endzustand

Der gewünschte Endzustand ist eine spielbare Anwendung und keine theoretische Designstudie. Die Anwendung muss über einen eindeutigen Startbefehl ausführbar sein. Der Spieler soll das Spiel starten, das Hauptmenü sehen, einen bestehenden Spielstand laden oder ein neues Spiel beginnen und unmittelbar in die dreidimensionale Welt gelangen können. Von diesem Moment an soll eine zusammenhängende Erfahrung entstehen.

## KAPITEL 1 – KREATIVE IDENTITÄT UND VISUELLE LEITLINIEN

### 1.1 Die Identität von PROJECT SUNSET

PROJECT SUNSET spielt in einer fiktiven amerikanischen Küstenregion der Gegenwart. Die Welt verbindet das Großstadtleben einer modernen Küstenmetropole mit wohlhabenden Strandvierteln, ruhigen Wohnsiedlungen, industriellen Hafenanlagen, heruntergekommenen Gewerbegebieten, ländlichen Straßen, bewaldeten Hügeln und weitläufigen Sumpflandschaften.

Der Spieler übernimmt die Rolle eines jungen Erwachsenen, der in Port Solace ankommt, zunächst nur wenig Geld besitzt und sich durch legale sowie illegale Aktivitäten ein neues Leben aufbauen kann. Die Spielerfahrung soll drei gleichwertige Säulen besitzen: Freiheit (eigenständige Bewegung und Aktivitätswahl), systemische Tiefe (nachvollziehbare Reaktionen und Wechselwirkungen) und Präsentationsqualität (glaubwürdige und eindrucksvolle Welt). Das Spiel besitzt einen leicht satirischen Unterton, ist aber keine reine Comedy-Parodie. Humor ergibt sich aus Situationen, Werbeplakaten, ungewöhnlichen Charakteren, Radiosendungen und gelegentlich absurden Ereignissen. Die visuelle Gestaltung bleibt realistisch und atmosphärisch.

### 1.2 Art Direction

Verwende eine moderne, halbrealistische 3D-Ästhetik. Figuren und Fahrzeuge sollen glaubwürdige Proportionen besitzen. Materialien reagieren nachvollziehbar auf Licht. Die Welt soll farblich lebendig sein, ohne wie ein grelles Cartoonspiel auszusehen. Referenz für die grundsätzliche Präsentationsqualität ist ein hochwertiges modernes Open-World-Actionspiel.

Nicht erwünscht: Minecraft-artige Blockgrafik, reine Low-Poly-Ästhetik, ausschließlich aus geometrischen Primitiven erkennbare Welt, flache unbeleuchtete Materialien, übermäßig gesättigte Neonfarben über den gesamten Tag, permanenter Sonnenuntergang, unrealistisch dichter Nebel zur Verschleierung fehlender Umgebung, Comic-Outlines, grobe unscharfe Oberflächen, riesige einfarbige Böden, kopierte Gebäudefassaden über dutzende Straßen und identische Bäume in exakt gleichen Abständen.

### 1.3 Farbpalette

Tiefes Nachtblau: Midnight Navy #101A2B.
Warmer Beton: Warm Concrete #B8B2A8.
Heller Sand: Coastal Sand #D8C39B.
Tropisches Wasser: Deep Teal #147C86.
Vegetation: Coastal Green #477B48.
Sonnenlicht: Sunset Gold #F4B96B.
Warmes Abendrot: Coral Orange #E97856.
Asphalt: Charcoal Road #34393F.
Polizeilicht Blau: Emergency Blue #2478F2.
Polizeilicht Rot: Emergency Red #EB3F47.
UI-Hintergrund: HUD Dark #10151C.
UI-Akzent: Electric Amber #F4B544.
UI-Text: Ivory White #F1F3F5.

Diese Werte sind feste Ausgangsbasis. Physikalische Beleuchtung, Tageszeit, Materialrauheit und Wetter dürfen die sichtbaren Farben natürlich verändern. Die Bedienoberfläche verwendet überwiegend Anthrazit, Weiß und einen warmen gelborangefarbenen Akzent; keine billigen leuchtenden Standard-Webdesign-Elemente.

### 1.4 Licht und Atmosphäre

Morgens stehen warme Sonnenstrahlen tief über der Stadt, lange Schatten ziehen sich über Straßen, Glasfassaden reflektieren den Himmel. Mittags wirkt das Licht neutraler, weiße Fassaden zeigen Oberflächenstrukturen, Schatten sind kürzer und dunkler. Am späten Nachmittag erhalten Fassaden und Straßen eine warme Atmosphäre mit starken Licht-Schatten-Kontrasten. Nachts übernehmen Straßenlaternen, Schaufenster, Reklamen, beleuchtete Hochhäuser, Fahrzeuge und Ampeln die Beleuchtung. Die Nacht darf nicht durch einen globalen dunklen Filter entstehen. Ein Schaufenster erhellt den Bürgersteig, Scheinwerfer treffen Straßen, Polizeilichter spiegeln sich auf Oberflächen, Fenster vermitteln den Eindruck bewohnter Räume.

### 1.5 Kamerapräsentation

Klassische Third-Person-Kamera, leicht versetzt. Ruhige Bewegungen beim Gehen, dynamischeres Folgen beim Sprinten, größere Distanz beim Fahren und erweitertes Sichtfeld bei hohen Geschwindigkeiten. Kontrolliertes Kamerawackeln nur bei starken Kollisionen, Explosionen, ausgewählten Waffen, harten Landungen und kräftiger Beschleunigung. Keine dauerhaften hektischen Kamerabewegungen.

### 1.6 Grafische Qualitätsziele

Glaubwürdige Modellsilhouetten, physikalisch plausible Materialien, detailliertes Set-Dressing, dynamisches Licht, passende Schatten, atmosphärischer Himmel, räumliche Tiefe, variable Vegetation, Materialunterschiede, hochwertige Fahrzeugoberflächen, menschlich proportionierte Charaktere und dezentes Postprocessing. Grafik darf die Bedienbarkeit nicht verhindern.

## KAPITEL 2 – TECHNISCHE GRUNDARCHITEKTUR

### 2.1 Zielplattform und Stack

Desktop-Browserspiel für aktuellen Chromium-basierten Browser auf Windows. Lokal startbar, während der Laufzeit nicht auf unzuverlässige externe Webseiten angewiesen. Bevorzugte Technik: TypeScript, Three.js, Vite, WebGL 2, Rapier-Physikbibliothek soweit tatsächlich verwendbar, Web Audio API, IndexedDB für umfangreiche Savegames, LocalStorage nur für kleine Einstellungen, HTML/CSS für Menüs und HUD, instanziertes Rendering für wiederholte Objekte, gemeinsame Geometrien und Materialien. Keine fiktiven Schnittstellen. Pakete korrekt installieren und Versionen prüfen. Bei inkompatiblen Bibliotheken eine funktionale Alternative wählen.

### 2.2 Ordnerstruktur

project-sunset/
  public/assets/{characters,vehicles,buildings,environment,interiors,audio,textures,ui}/
  src/{app,core,rendering,world,terrain,roads,districts,buildings,vegetation,weather,lighting,player,animation,camera,input,physics,vehicles,traffic,pedestrians,police,combat,inventory,economy,businesses,casino,minigames,missions,events,audio,ui,save,optimization,debugging,testing}/
  index.html
  package.json
  tsconfig.json
  vite.config.ts

Die Zuständigkeiten müssen getrennt sein. Nicht alles in eine gigantische Datei schreiben.

### 2.3 Systemverantwortung

GameManager: allgemeiner Zustand und Initialisierung. SceneManager: Menü, Welt, Laden, besondere Spielsituationen. WorldManager: aktive Regionen. DistrictManager: Stadtteile und Besonderheiten. TerrainManager: Gelände. RoadNetwork: Straßen und Verbindungen. TrafficManager: zivile Fahrzeuge. PedestrianManager: Fußgänger. PoliceManager: Fahndung und Polizei. VehicleManager: Fahrzeuge, Physik, Besitz und Spawning. MissionManager: Missionszustände. EconomyManager: Transaktionen und Preise. ActivityManager: Minigames. SaveManager: Persistenz. AudioManager: Geräusche und Musik. UIManager: Interfaces. PerformanceManager: adaptive Qualität.

### 2.4 Event-Bus

Typisierter Event-Bus mit u. a. PLAYER_ENTERED_VEHICLE, PLAYER_EXITED_VEHICLE, VEHICLE_DAMAGED, VEHICLE_DESTROYED, PLAYER_MONEY_CHANGED, CRIME_COMMITTED, CRIME_REPORTED, WANTED_LEVEL_CHANGED, POLICE_SEARCH_STARTED, POLICE_SEARCH_ENDED, MISSION_STARTED, MISSION_STAGE_CHANGED, MISSION_COMPLETED, ACTIVITY_STARTED, ACTIVITY_COMPLETED, BUSINESS_PURCHASE_COMPLETED, TIME_OF_DAY_CHANGED, WEATHER_CHANGED, SAVE_REQUESTED, SAVE_COMPLETED. Ereignisse enthalten relevante Daten: Geldbetrag und Quelle, Verbrechenstyp und Position, Spieler- und Fahrzeug-ID usw. Systeme kommunizieren über Events statt beliebig UI-Elemente direkt zu verändern.

### 2.5 Globale Spielzustände

BOOTING; LOADING_ASSETS; MAIN_MENU; LOADING_WORLD; PLAYING; PAUSED; IN_ACTIVITY; IN_CUTSCENE; PLAYER_BUSTED; PLAYER_HOSPITALIZED; SAVING; LOAD_ERROR. Zustandswechsel kontrolliert durchführen. Während eines Casino-Minispiels keine Bewegungsbefehle an Alex. Bei Pause die Singleplayer-Simulation anhalten.

### 2.6 Simulation

Physik mit festem 1/60-Sekunden-Zeitschritt, Akkumulator und Renderinterpolation. Extreme Delta-Time-Sprünge bei Tabwechsel begrenzen. Geschwindigkeit intern in m/s, Fahrzeuganzeige in km/h. Geld intern als ganze Sunset-Dollarbeträge, keine unnötigen Fließkommafehler.

### 2.7 Performance

Ziel 60 FPS bei 1080p auf durchschnittlichem Gaming-PC mit dedizierter GPU, mittlere Einstellungen möglichst mindestens 45 FPS – ausschließlich als Ziele, nicht als ungemessene Behauptungen. Low: weniger Schatten/Vegetation/Sichtweite/dekorative NPCs. Medium: Balance. High: verbesserte Schatten, Sicht, Reflexion, Vegetation. Ultra: maximal verfügbare Darstellung. Gameplay bleibt zuverlässig.

### 2.8 World Streaming

Sektoren 160 × 160 Meter. Zustände UNLOADED, DISTANT, NEAR, ACTIVE, UNLOADING. Aktive Sektoren mit vollständiger relevanter Physik und KI; nahe und entfernte reduziert. Persistente Objekte und Eigentum gehen beim Entladen nicht verloren.

### 2.9 Kollision

Einfachere Kollisionsformen für verdeckte Geometrien, stabile Capsule des Charakters, Fahrzeughüllen, korrekte Straßen, Brücken und Innenräume. Keine durchlässigen Wände, schwebenden Straßen oder im Boden versinkenden Fahrzeuge.

### 2.10 Savegame

Versioniertes Format mit Spielstandname, Zeit, Spielerposition/-rotation, Gesundheit, Bargeld, Bankkonto, Inventar, Waffen, Munition, Besitzfahrzeugen, Zustand, Garage, Immobilien, Missionen, Aktivitäten, Chips, Weltzeit, Wetter, Ereignis-Flags und Einstellungen. Mindestens drei manuelle Slots plus Autosave. Autosave nach Missionen/Käufen und alle fünf Minuten außerhalb von Kampf/Verfolgung. Beschädigte Savegames kontrolliert behandeln.

## KAPITEL 3 – DIE GEOGRAFIE VON SUNSET COUNTY

### 3.1 Abmessungen

Zusammenhängende Grundfläche 3.600 × 3.200 Meter. X West/Ost, Y Höhe, Z Nord/Süd, negative Z-Werte Norden. Grenzen X -1800 bis +1800, Z -1600 bis +1600. Meer reduziert tatsächliche Landfläche. Die Welt ist kein rechteckiges Straßenraster. Sie besitzt dichte Innenstadt, Ostküste, südöstlichen Freizeit-/Hotelbereich, südwestlichen Industriehafen, westliche Vororte, nordwestliche Hügel, nördliche Land-/Waldflächen, südliche Sümpfe, vorgelagerte Insel und Ringstraße.

### 3.2 Hauptregionen

Meridian Downtown: Zentrum/Nordost, dichte Großstadt.
Solace Beach: Ostküste, Strand/Tourismus/Nachtleben.
Crown Marina: Südost, Luxus/Yachthafen/Casino.
Northgate: Nordwest der Innenstadt, Wohnen und Gewerbe.
Westhaven: Westen, Vorstadt und Kleingewerbe.
Iron Docks: Südwest, Industriehafen.
Pine Ridge: Nordwest, Hügel/Wald/Aussicht.
Cedar Plains: Norden, Landwirtschaft/Landstraßen.
Blackwater Marsh: Süden, Sumpf/Wildnis.
Drift Island: östlich der Küste, kleine Insel.

Übergänge fließend: Innenstadt → geringere Dichte → Gewerbe/Wohnen → ländlich. Unterschiedliche Bebauung, Verkehr, Vegetation, Klang und Aktivitäten.

### 3.3 Höhen

Küste etwa 2–8 m, Innenstadt 5–18 m, westliche Wohngebiete 20–45 m, Pine Ridge 45–125 m, Cedar Plains 20–65 m, Blackwater Marsh 0–5 m. Natürliche Rundungen, Senken, Täler, Hangvegetation und angepasste Straßen statt zufälliger Landschaftskegel.

### 3.4 Wasser

Östliches Meer mit mehreren Wellenfrequenzen, Farbabstufungen, Himmelsreflexion, Küstenlinie, Küstenschaum, Tiefenwirkung und Tageszeitreaktion. Heller am Strand, dunkler und grüner im Hafen, braun-grün und ruhiger im Sumpf. Grundlegende sichere Schwimmbewegung des Spielers, keine Abstürze bei Wasserkontakt.

### 3.5 Straßenklassen

Highways mit Mehrspuren/Auf- und Abfahrten; Arterials mit Ampeln und Mittelstreifen; Collectors als Verbindungsstraßen; Local Roads mit Gehwegen/Einfahrten/Parkplätzen; Dirt Roads als Schotterwege. Breiten: Highway-Spur 3,6 m; Hauptstraßen-Spur 3,4 m; Nebenstraßen-Spur 3,0 m; Wohnstraßen-Spur 2,8 m; Gehweg Standard 2,2 m, Innenstadt 3,5 m; Radweg 1,6 m; Parkstreifen 2,3 m. Saubere Kurven, passende Markierungen.

### 3.6 Straßengraph

Verbundener gerichteter Graph mit Start-/Endpunkt, Richtung, Spuren, Kategorie, Geschwindigkeitslimit, bevorzugten Fahrzeugtypen, Oberfläche, Verkehrsregeln, Kreuzungsinformationen, Geometrie und Navigationsdaten. Kreuzungsfahrspuren korrekt verbinden. NPC-Fahrzeuge navigieren über tatsächliche Straßen, nicht gerade Luftlinien. Derselbe Graph dient GPS, Missionen und Polizei.

### 3.7 Sunset Beltway

Ringstraße mit weichen Kurven und Knoten: B1 (-1050,-950), B2 (-450,-1150), B3 (450,-1050), B4 (1050,-600), B5 (1150,150), B6 (700,850), B7 (-150,1050), B8 (-1050,700). Mehrere Zu-/Abfahrten, Brückenstützen und Leitplanken. Keine schwebenden oder unverbundenen Abschnitte.

### 3.8 Landmarken

Meridian Tower, orangefarbener Hafenkran, Casinohotel, Riesenrad, Pine-Ridge-Sendemast, Cedar-Plains-Wasserturm, weiße Hafenbrücke, Drift-Island-Leuchtturm. Als echte 3D-Objekte aus sinnvoller Distanz sichtbar, nützlich zur Navigation.

## KAPITEL 4 – DIE EINZELNEN DISTRIKTE

### 4.1 Meridian Downtown

Ungefähr 900 × 850 Meter, nördlich und östlich des Zentrums. Dichte Stadt mit sechs Gebäudefamilien: Glasbürohochhäuser, ältere Stein-/Betonbüros, Balkon-Apartmenthochhäuser, Hotels, Parkhäuser, niedrige Läden und Gastronomie. Keine reinen Fenstertexturquader, sondern Fassadenstruktur, Sockel, Dachaufbauten, Eingänge und Technik. Meridian Tower bei (270,-310), ca. 150 Meter, schlanke Glasfassade, Metallstreben, Dachkrone und Platz mit Bäumen/Bänken/Wasserbecken. Straßen Meridian Avenue, East Union Street, Liberty Boulevard, Market Road, Grand Central Drive. Ampeln, Überwege, Bushaltestellen, Müllcontainer, Werbung. Viele Limousinen, Taxis, Lieferwagen, wenige Sportwagen; tagsüber mehr Fußgänger. Limits: Hauptstraße 50, Nebenstraße 35, Parkhaus 15 km/h. POIs Meridian Plaza, Union Bank, Grand Central Parking mit zwei befahrbaren Ebenen, Metro Coffee (begehbar), Meridian Electronics, City Police Headquarters, Skyline Apartments (Erdgeschoss und Apartment).

### 4.2 Solace Beach

Etwa 1.200 Meter östliche Strandpromenade. Breite Gehwege, helle Fassaden, Palmen, Hotels, Bars, Souvenirläden, Restaurants, Parkplätze, Pier. Unregelmäßige Küste, dunklerer glatter Sand an Wasserlinie, heller Sand weiter weg, Liegen, Schirme, Duschen, Rettungsstände und Abfallbehälter. Solace Pier mit Holzsteg, Geländern, Verkaufsständen, Bänken, Aussicht, Riesenrad und Nachtbeleuchtung. Tagsüber und abends touristische NPCs, bei Regen deutlich weniger. Strandbesucher sitzen, spazieren, fotografieren, betrachten Wasser. Mehr Cabrios, Motorräder, SUVs und Sportwagen.

### 4.3 Crown Marina

Wohlhabender Südosten, Glasarchitektur, gepflegte Straßen, Luxushotels, Bootsanleger, hochwertige Autos. THE CROWN CASINO & RESORT bei (1080,770), repräsentativer Haupteingang, Vordach, Zufahrt, Glasfassade, beleuchtetes Hotel, begehbare Lobby und Casino, Parkplatz. Weitere POIs Crown Auto Gallery, Marina Walk, Golden Palm Hotel mit Lobby, Sea Glass Restaurant und Crown Parking. Moderne Leuchten, Beete, niedrige Mauern, Palmen. Moderater Verkehr; Luxuslimousinen/Sportwagen/SUVs, Business- und Freizeit-NPCs.

### 4.4 Northgate

Gemischtes Wohn-/Gewerbeviertel mit 2- bis 8-stöckigen Gebäuden, gewundenen Wohnstraßen, Geschäftsachsen, älteren Fassaden, kleinen Graffiti, geflicktem Asphalt, aber insgesamt bewohnt und nicht völlig verfallen. POIs Northgate Community Park, Redline Gas Station, Northgate Medical Center, AutoFix Workshop, Northgate Supermarket, Basketballplatz, Motel, Wohnanlage mit Tiefgarage. Spieler-Apartment über Laden an Northgate Avenue: Treppenhaus, Bett, Schreibtisch, Sofa, Küchenzeile, Bad, Garderobe, Balkon; Speicherfunktion.

### 4.5 Westhaven

Westliche Vorstadt, viel Grün, Einfamilienhäuser, Parks, kleine Apartmenthäuser, Supermärkte, Tankstellen, Garagen, schwingende Wohnstraßen und sinnvolle Sackgassen. Häuser mit unterschiedlichen Dachformen, Auffahrten, Garagen, Vorgärten, Zäunen, Briefkästen, Veranden und Fassaden. POIs Westhaven Motors (Gebrauchtwagen), Benny’s Diner, Sunset Fuel, Westhaven Park, Westhaven Storage (Garage), Corner Market. Langsamer Verkehr, mehr Spaziergänger, SUVs und Pick-ups.

### 4.6 Iron Docks

Südwestlicher Industriehafen mit funktional getrenntem Containerterminal, Warehouse Row, Freight Depot, Dry Dock mit Schiffsrumpf, Old Shipyard mit rostigen Kränen, Dockside Garage und Pier 17. Breite Lastwagenstraßen, Rolltore, Laderampen, Ölflecken, alte Markierungen, Warnschilder, Container und Industriebeleuchtung. Transporter, Pick-ups, Lkw, Hafenarbeiter und Sicherheitskräfte. Wichtiger Missionsschauplatz.

### 4.7 Pine Ridge

Nordwestlicher bewaldeter Höhenzug mit Hügeln, Aussicht, geschwungenen Bergstraßen, Leitplanken und Schotterwegen. POIs Pine Ridge Overlook mit Skylineblick, Eagle Road, Ranger Station, North Trail, Broadcast Hill mit Sendemast, Abandoned Lodge mit Erdgeschoss. Kiefern, Büsche, Gras und einzelne Laubbäume; variable Dichte, keine gleichmäßigen Baumreihen. SUV-/Geländewagen-Strecken, spürbare Steigungen.

### 4.8 Cedar Plains

Nördliches Landwirtschaftsgebiet mit Wiesen, Feldern, Farmhäusern, Scheunen, Silos, sanften Hügeln, Asphalt- und Feldwegen. Cedar Route verbindet nördliches Land mit Stadt. POIs Cedar Gas & Grocery, Old Water Tower, Cedar Farm, Red Barn, County Sheriff’s Outpost, Roadside Diner, Motel. Locker verteilt, echte Naturflächen dazwischen, lange Fahrstrecke, Pick-ups, ältere SUVs, Laster.

### 4.9 Blackwater Marsh

Südliche flache Sumpfregion mit seichtem Wasser, Schilf, Mangroven, Schlamm, Holzstegen, schmaler Hauptstraße, Hütten und Morgennebel. Dunkelgrünes Wasser, dichter Bewuchs, ruhige geheimnisvolle Atmosphäre. Eine befahrbare Hauptstraße, wenige Schotterwege, verlassenes Bootshaus und abgelegene Hütte, stets plausibler Rückweg.

### 4.10 Drift Island

Östlich der Marina, kleine Insel etwa 180 × 230 Meter, Strand, Gras, Leuchtturm, Café, Bootsanleger, Parkplätze, Sitzgelegenheiten, Vegetation. Schmaler befahrbarer Damm oder Brücke verbindet sie mit Küste, ohne umfangreiche Bootsmechanik. Aussicht auf die Stadt.

## KAPITEL 5 – WORLD DESIGN, STRASSENGESTALTUNG UND UMGEBUNGSDETAILS

### 5.1 Grundregel

Jede Straße muss bewusst gestaltet aussehen. Eine Straße ist kein bloßes Polygonband mit zufällig daneben geworfenen Gebäuden. Das Worldbuilding soll regelbasiert aus vordefinierten, regional abgestimmten Straßen-, Gebäude- und Dekorationselementen entstehen. Prozedurale Erzeugung ist technisch erlaubt; die sichtbaren Ergebnisse folgen strikt den Gestaltungsregeln. Einkaufsstraßen besitzen breite Gehwege, Ladenfronten, Werbeflächen, zahlreiche Straßenlaternen und Fußgänger. Wohnstraßen besitzen schmale Gehwege, Einfahrten, Rasen, Briefkästen und geringe Beleuchtungsdichte. Im Hafen: breite Transportachsen, Rolltore, Laderampen und wenige Fußgänger. Auf Landstraßen: keine durchgängigen Bürgersteige, dafür Leitpfosten, Gräben, Bewuchs und gelegentliche Zufahrten.

### 5.2 Gebäudegeometrie

Modulare Bausteine: Sockel, Fassaden, Türen, Fenster, Balkone, Fensterrahmen, Säulen, Vordächer, Dachkanten, Dächer, Klimageräte, Schornsteine, Feuerleitern, Regenrinnen, Schilder, Ladenfronten, Parkhauseingänge, Garagentore, Zäune und Mauern. Hochhäuser zeigen Etagen, vertikale Tragelemente und abgesetzte Eingänge; Wohnhäuser erkennbare Dächer, Fenster, Haustüren und Fundamente. Erzeuge mindestens zwölf Gebäudekörper mit deutlich verschiedenen Silhouetten, davon mindestens vier asymmetrisch. Variation nicht nur über Einfärbung. Die Häuser in benachbarten Straßenzügen müssen unterschiedlich aussehen und sollen dennoch zum Stadtteil passen.

### 5.3 Fassadenvarianten

Materialfamilien: Sichtbeton, heller Putz, dunkler Putz, rotbrauner Ziegel, heller Naturstein, Glas/Aluminium, verwittertes Metall, Holz, Industrieblech, beschichtete Fassadenplatten. Jede Familie besitzt unterschiedliche Rauheit, Farbvarianten und Normalenstrukturen. Glas reflektiert anders als Beton. Industrie zeigt Schmutz/Rost, Crown Marina gepflegten Stein und Glas, Westhaven Putz/Ziegel/Holz. Nicht jede Oberfläche darf glänzen. Leichte Abnutzung an Gebäuden und Straßen bewusst platzieren.

### 5.4 Straßendetails

Platziere Straßenlaternen, Ampeln, Verkehrszeichen, Parkschilder, Zebrastreifen, Richtungspfeile, Fahrbahnmarkierungen, Kanaldeckel, Gullis, Bushaltestellen, Fahrradständer, Müllbehälter, Container, Parkautomaten, Hydranten, Stromkästen, Straßenbäume, Beete, Plakate, Sitzbänke, Zeitungsstände, Lieferzonen, Absperrungen und Parkpoller. Alles an funktional passenden Orten: keine Ampel mitten in der Fußgängerzone, kein Hydrant mitten auf der Straße. Passende vereinfachte Kollisionen. Kleinste Dekoration darf ohne Kollision bleiben, sofern unauffällig.

### 5.5 Oberflächen

Vier Asphaltvarianten: neu (dunkel/scharfe Markierung), normal (leicht ausgebleicht), alt (Risse/Flicken), Industrie (Öl, Schmutz, beschädigte Markierung). Dazu Schotter, Schlamm, Sand, Beton und Pflaster. Materialübergänge ohne harte Rechteckgrenzen; Decals und Variationen nutzen. Große Texturwiederholungen vermeiden. Gehwege besitzen eigene Materialien; Bordsteine sind sichtbar, aber fahrphysikalisch beherrschbar.

### 5.6 Vegetation

Baumtypen: hohe Küstenpalme, Zierpalme, Kiefer, breiter Laubbaum, schmaler Stadtbaum, Mangrove, niedriger Küstenbaum; jeder Typ mit mehreren Silhouetten. Variiere Stammhöhe, Ast- und Kronenform, Farbe innerhalb plausibler Grenzen. Palmen Küste/Marina, Laubbäume Parks/Vorstadt, Kiefern in Pine Ridge, Mangroven in Blackwater. Ergänze Sträucher, hohe Hecken, Grasbüschel, Schilf, Bodendecker, Kletterpflanzen und Blumenbeete. Nutze Instancing und geeignetes LOD. Keine geometrisch identischen Baumreihen durch die ganze Karte.

### 5.7 Parks

Northgate Community Park: geschwungener Hauptweg, zwei Nebenwege, Spielplatz, Bänke, Laternen, Abfallbehälter, kleiner Teich, große Bäume, offene Wiese, Basketballfeld. Westhaven Park: Spazierwege, Picknickfläche, überdachter Sitzbereich. Meridian Plaza: urbaner Steinbelag, klare Formen, eingefasste Bäume, moderne Sitzmöglichkeiten. Parks brauchen plausible Gehwege und NPC-Navigationspunkte.

### 5.8 Brücken und Tunnel

Mindestens drei Brücken. South Harbor Bridge zwischen Hafen und Südostküste: vier Spuren, Leitplanken, Stützen, Beleuchtung, saubere Rampen. Weitere Brücke an Beltway, kleine in Cedar Plains. Eine kurze Unterführung in Downtown. Korrekte Kollisionsflächen; Kamera darf nicht dauerhaft durch Decken oder Wände springen. Fahrzeuge dürfen an Übergängen nicht springen oder in Straßen sinken. Brücken sollen aus der Ferne als echte Bauwerke lesbar sein.

### 5.9 Sichtachsen

Vom Pine Ridge Overlook ist die Skyline sichtbar; von Crown Marina Wasser und Stadt; vom Hafen Industriekräne vor Hochhäusern; von Solace Beach freie Küsten- und Meerblicke; Downtown besitzt enge, abwechslungsreiche Straßenschluchten. Schütze diese Sichtachsen vor willkürlicher Bebauung. Nutze Landmarken zur Orientierung.

### 5.10 Weltgrenzen

Geografisch unauffällige Grenzen: Meer im Osten, Hügel und Bewuchs im Norden/Westen. Nicht unmittelbar eine quadratische unsichtbare Mauer. Bei Annäherung an harte Grenze eine dezente Meldung „Du verlässt Sunset County.“ Erst nach tatsächlichem Überschreiten kontrolliert zurückführen. Die Grenzen dürfen die regulären Straßen und Routen nicht abschneiden.

## KAPITEL 6 – GEBÄUDE, INTERIORS UND INTERAKTIONEN

### 6.1 Grundregeln

Mindestens zwölf begehbare Interieurs: Spieler-Apartment, Casino-Lobby, Casino-Saal, Tankstellenshop, Supermarkt, Autohändler, Werkstatt, Diner, Café, kleine Bar, Garage, Missionslagerhalle. Jeder Innenraum besitzt einen glaubwürdigen Eingang, nachvollziehbaren Grundriss, Einrichtung, Beleuchtung und tatsächliche Funktion. Kein weißer, leerer Raum mit einer einzelnen Theke. Ein räumlich getrennter Innenraum darf bei Bedarf mit weichem kurzem Ladeübergang aktiviert werden; keine unmotivierten Menü-Teleports. Kollisionsgeometrie und Navigation passen zur Möblierung.

### 6.2 Türen

Wiederverwendbare Türkomponente mit Position, Öffnungsrichtung, Kollision, Reichweite, Verriegelung, Gebäude-ID, Zugangskriterium, Animation und Sound. Normale Türen per Interaktion, automatische Türen bei Annäherung. Verschlossene Türen zeigen Statusmeldung. Solange eine Tür geschlossen ist, blockiert sie. Bei Animation keine Kollision, die Spieler einklemmt. Türen müssen nach Innenraumwechsel oder Speichern korrekte Zustände einnehmen.

### 6.3 Apartment

Erstes Apartment in Northgate, ungefähr 9 × 7 m. Kombinierter Wohn-/Küchenbereich, Schlafzimmer, Bad, Balkon. Sofa, Couchtisch, Fernseher, kleiner Esstisch, zwei Stühle, Küchenzeile, Kühlschrank, Herd, Schreibtisch, Computer, Bett, Kleiderschrank, Waschbecken, Dusche, Toilette, Deckenlampen, zwei Fenster. Bett: sechs oder acht Stunden schlafen. Schrank: Kleidung ändern. Speichersymbol: manuelle Spielstandslots. Fernseher darf animierten Bildschirm ohne echten Stream haben. Vom Apartment echter Übergang ins Treppenhaus und Stadt.

### 6.4 Geschäfte

Spieler betritt Laden, geht an Theke, E-Interaktion öffnet zum Laden passende Oberfläche. Name, Waren, Preise und aktuelles Geld werden angezeigt; Kauf überprüft Guthaben, zieht exakt einmal ab, legt erworbenes Objekt in Inventar oder Welt, zeigt Erfolg. Bei unzureichendem Geld: verständliche Fehlermeldung, keine Abbuchung. Nach Schließen vollständige Wiederherstellung der Third-Person-Steuerung. NPC-Händler bleibt während Interaktion verfügbar; Buttons haben echte Funktionen.

### 6.5 Tankstelle

Zapfsäulen, Überdachung, Shop, Beleuchtung, Parkplätze, Preisanzeige, Zufahrten, Müllbehälter. Tanken nur, wenn Fahrzeug gültig in Reichweite und Motorstatus geeignet ist; Tankinhalt wird verändert und Zahlung korrekt verarbeitet. Verbrenner mit leerem Tank kann nicht weiter beschleunigen, aber ausrollen. Shop verkauft Lebensmittel und Verbrauchsgüter. Visuelle Zapfsäulen mit nachvollziehbarer Bedienzone, keine Ferninteraktion.

### 6.6 Werkstatt

Befahrbarer Servicebereich, markierte Reparaturzone, Werkstattmenü nach korrektem Abstellen. Funktionen: Reparieren, Lack, Felgen, Motorleistung, Bremsen, Federung, Reifen. Jede Änderung sichtbar oder funktional. Reparatur setzt technischen Zustand zurück, Lack ändert Material, neue Felgen wechseln tatsächlich Rädergeometrie, Motorupgrade beeinflusst Beschleunigung. Werkstatt darf Fahrzeug-ID nicht verlieren; Upgrade persistent speichern.

### 6.7 Supermarkt

Regalgänge, Kühlzone, mindestens eine Kasse; unterschiedliche Produktmodelle. Kaufbare Artikel Wasser, Energydrink, Sandwich, Snack, Erste-Hilfe-Set. Verbrauchsgüter im Inventar, Benutzung verändert Gesundheit oder kurzzeitig Ausdauer. Begrenze Gesundheit auf 100. Vorräte müssen nach Nutzung korrekt sinken, keine Duplikation.

### 6.8 Restaurants

Diner mit Sitznischen, langer Theke, Hockern, Tischen und warmem Licht. Café mit kleineren Tischen, Kaffeemaschine, großer Fensterfront. Im Diner Essen mit Heileffekt, im Café Kaffee mit kurzzeitig erhöhter Ausdauerregeneration. Effekte im HUD nachvollziehbar und zeitlich begrenzt. Kauf und Verbrauch tatsächlich verdrahten.

## KAPITEL 7 – SPIELERCHARAKTER UND BEWEGUNG

### 7.1 Hauptfigur

Name ALEX MORGAN, 28 Jahre, durchschnittlich-athletische Figur, mittellange dunkle Haare, dunkle Jeans, weißes T-Shirt, leichte dunkle Jacke, neutrale Sneakers. Eigenständige glaubwürdige Anatomie, korrekte Proportionen und Körpersegmente, keine bekannte Gamefigur. Kopf, Arme, Beine, Hände, Schuhe müssen als Figur lesbar sein. Eine untexturierte Kapsel, schwebende Würfel oder Strichfigur ist als endgültiges Modell verboten.

### 7.2 Bewegung

Zustände IDLE, WALK, JOG, SPRINT, CROUCH, JUMP, FALL, LAND, AIM, SHOOT, RELOAD, ENTER_VEHICLE, EXIT_VEHICLE, SWIM, INTERACT, STUNNED, DEAD. Animation Blending und sanftes Beschleunigen/Abbremsen, Schrittzyklen statt Gleiten, geduckte Körperhaltung, erkennbare Sprung- und Landephase, sichtbare Fahrzeug-Ein-/Ausstiege.

### 7.3 Werte

Gehen 1,8 m/s, Joggen 3,8 m/s, Sprinten 6,2 m/s, geducktes Gehen 1,3 m/s, Rückwärtsgehen 1,5 m/s, seitliches Zielen 2,1 m/s, Schwimmen 2,0 m/s. Maximal-Ausdauer 100. Sprinten verbraucht 12/s, Regeneration 16/s nach 0,7 s Pause. Bei 0 Ausdauer auf Joggen zurückfallen. Steigungen und Hindernisse beeinflussen Geschwindigkeit plausibel.

### 7.4 Steuerung

WASD Bewegung, Shift Sprint, Strg Ducken, Leertaste Springen, E Interagieren, F Fahrzeug betreten/verlassen, LMB Schießen, RMB Zielen, R Nachladen, Tab Waffenrad, I Inventar, M Karte, ESC Pause, H Telefon, G Gegenstand benutzen, C Kameraansicht wechseln. Im Fahrzeug Leertaste Handbremse; optionale Pfeiltastensteuerung. Standardbelegung in Hilfe anzeigen, bei Bedarf alternative Belegung unterstützen. Eingabekontexte streng trennen, damit Menüs keine Schüsse/Fahraktionen auslösen.

### 7.5 Standardkamera

Ca. 3,2 m hinter Charakter, 1,6 m Höhe, leicht über Schulter. Maus steuert Rotation; vertikaler Winkel begrenzt, nie unter Boden. Weiches kamerabasiertes Folgen. Hindernisprüfung zwischen Figur und Kamera, bei Wänden Distanz reduzieren und weich wiederherstellen, keine Wände durchdringen.

### 7.6 Zielkamera

Beim RMB Kamera auf ca. 2,1 m verkürzen, Figur leicht links im Bild, Fadenkreuz zentral. Geringe Trägheit, Rotation zur Blickrichtung, reduzierte Laufgeschwindigkeit, passende Animation. Beim Loslassen nahtlos zur Standardkamera zurück.

### 7.7 Animationsqualität

Gehen kürzer/langsamer, Sprint dynamischer, Ducken niedriger, Sprung mit Absprung/Flug/Landung, Fall in glaubwürdiger Körperhaltung. Beim Einstieg in Fahrzeuge erst an Tür annähern, dann Sitzposition; nicht aus zehn Metern teleportieren. Fußgleiten minimieren. Übergänge dürfen Bewegungen nicht unnötig blockieren.

### 7.8 Springen

Ziel-Sprunghöhe ca. 0,85 m; plausible Schwerkraft, begrenzte Luftsteuerung, kein Doppelsprung. Kleine Hindernisse bis ca. 0,35 m automatisch überwinden; größere Hindernisse umgehen oder passende Bewegung nutzen.

### 7.9 Gesundheit

Maximal 100. Schaden durch Beschuss, Aufprall, Sturz, Explosion. Geschwindigkeit und Ereignis bestimmen Unfallverletzung. Bei 0 Gesundheit Zusammenbruch, Hospital-Bildschirm, begrenzte virtuelle Behandlungskosten, Respawn am Krankenhaus, Fahndungs- und Missionszustände kontrolliert behandeln.

### 7.10 Kleidung

Mindestens drei Oberteile, zwei Jacken, drei Hosen, drei Schuhpaare, zwei Kopfbedeckungen. Echte Silhouetten-/Modellunterschiede, nicht nur Umfärbung. Auswahl über Apartment-Schrank, mit Skelett kompatibel und persistent gespeichert.

## KAPITEL 8 – FAHRZEUGE UND FAHRPHYSIK

### 8.1 Grundfunktion

Fahrzeuge sind zentral: glaubwürdige Silhouetten, rotierende und lenkende Räder, Traktion, Federung, Masse, Reibung, Beschleunigung, Bremsen, Rückwärtsgang, Handbremse, Kollision, Kraftstoff und Schäden. Keine simplen Objekte, die ohne Fahrdynamik auf Positionen verschoben werden. Verwende Rapier oder eine verlässlich funktionierende Alternative, angepasst an ein spielbares Arcade-Realismus-Verhältnis.

### 8.2 Fahrzeugklassen und fiktive Modelle

Kleinwagen Volton Metro; Kompaktlimousine Alden Crest; Sportlimousine Vexler GT; Sportwagen Corsair S9; Supersportwagen Tempest XR; SUV Northstar Trail; Geländewagen Bravon Ridge; Pick-up Ironhorse 250; Transporter Hauler V6; Motorrad Velocity R; Polizeilimousine Solace Patrol; Polizeisportwagen Solace Interceptor; Lieferwagen Dockrunner; Lastwagen Titan Cargo. Eigenständige, identifizierbare Modelle und Karosseriesilhouetten. Keine echten Markenlogos. Tempest flach und breit, Geländewagen hohe Bodenfreiheit, Pick-up offene Ladefläche, Transporter kastenförmig, Motorrad sichtbar zweirädrig.

### 8.3 Leistungsdaten

Modell | Höchsttempo km/h | 0–100 s | Masse kg
Volton Metro | 145 | 13,5 | 1050
Alden Crest | 175 | 10,0 | 1450
Vexler GT | 230 | 6,3 | 1650
Corsair S9 | 275 | 4,0 | 1380
Tempest XR | 325 | 2,9 | 1480
Northstar Trail | 185 | 9,0 | 2250
Bravon Ridge | 170 | 11,0 | 2100
Ironhorse 250 | 175 | 10,5 | 2050
Hauler V6 | 140 | 17,0 | 2700
Velocity R | 280 | 3,3 | 225
Solace Patrol | 210 | 7,2 | 1750
Solace Interceptor | 270 | 4,6 | 1600
Dockrunner | 145 | 16,0 | 2600
Titan Cargo | 125 | 24,0 | 6800

Kalibriere die Physik für diese Zielwerte. Verwechsle bei der internen Rechnung nicht km/h und m/s.

### 8.4 Motor und Getriebe

Antriebskraft abhängig von Drehmoment-/Leistungskurve, Geschwindigkeit, Masse und Luftwiderstand; keine sofortige Höchstgeschwindigkeit. Kleinwagen langsam, Sportwagen schnell, Lkw träge. Bei Bedarf vereinfachtes Getriebemodell mit plausiblen Übergängen. Motorlast beeinflusst den Klang. Beschleunigung darf nicht von Render-FPS abhängen.

### 8.5 Lenkung

Geschwindigkeitsabhängiger Lenkeinschlag: unter 30 km/h voller Winkel, 30–80 graduelle Reduktion, 80–160 deutlich weniger, über 160 präzise Feinlenkung. Sportwagen agiler, SUVs/Lastwagen träger. Stabile Richtungsänderung auf Geraden und in Kurven.

### 8.6 Federung

Bei Beschleunigen leichtes Heckabsenken, beim Bremsen Fronttauchen, in Kurven Karosserieneigung, auf Unebenheiten Rad- und Karosseriebewegung. Sportwagen straff, Geländewagen mehr Federweg, Laster schwerfällig. Nicht übertrieben. Mit Radtraktion und Physikkollision verbunden.

### 8.7 Untergrund

Relative Traktion: trockener Asphalt 1,00; nasser Asphalt 0,78; Schotter 0,62; Schlamm 0,42. Geländewagen vorteilhaft im Gelände, Sportwagen stärker auf Asphalt. Bei Regen wirkliche Veränderung des Fahrverhaltens. Reifen-/Fahrzeug-Upgrades beeinflussen Faktoren.

### 8.8 Handbremse und Driften

Leertaste im Fahrzeug aktiviert Handbremse. Hinterradtraktion sinkt, kontrollierbares Ausbrechen möglich, schrittweise Rückkehr beim Lösen. Kein vollautomatisches Drift-Skript. Drift und Haftungsverlust abhängig von Geschwindigkeit/Lenkung/Reifen.

### 8.9 Fahrzeugkamera

Standard etwa 6,5 m hinter, 2,8 m über Fahrzeug. Modi Standard, Nah, Motorhaube. Sichtfeld von 68° bei Stillstand bis 82° bei 200 km/h. Distanz bei Speed leicht erhöhen, kontrolliertes dynamisches Folgen, kurze Kameraimpulse bei Kollision. Keine Geometriedurchdringung.

### 8.10 Ein-/Aussteigen

F in sinnvollem Radius. Eigenfahrzeug sofort zugänglich, fremde unverschlossene Fahrzeuge rechtlich als Diebstahl erkennbar. Verschlossene fremde Autos über eine abstrahierte fiktive Spielaktion; keinerlei realweltlich nutzbare Schlossumgehungsanleitung. Figur läuft zur Tür, steigt sichtbar ein, dann Kamera-/Inputwechsel. Aussteigen nur bei gültigem Platz, gegebenenfalls alternative Seite.

### 8.11 Fahrzeugschäden

Jedes Fahrzeug Strukturzustand 0–1000. 1000–800 weitgehend intakt, 799–550 leichte Schäden, 549–300 deutlich beschädigt/Leistung reduziert, 299–100 starke Schäden/Rauch, unter 100 Antriebsausfall, mögliche Zerstörung. Schaden abhängig von Aufprallenergie, Beschuss/Explosion; Kratzer, verformte Elemente oder Materialwechsel, Glasschäden, defekte Lichter, Rauch. Keine reine HUD-Schadensanzeige ohne Auswirkungen.

### 8.12 Reifen

Räder eigene Komponenten, Winkel und Drehung korrekt. Beschädigung reduziert Traktion, zerstörter Reifen erzeugt merkbar schlechteres Fahrverhalten. Fahrverhalten bei normalen Schäden weiterhin steuerbar. Reifeninteraktion muss auch mit Upgrades funktionieren.

### 8.13 Licht

Scheinwerfer, Rücklichter, Bremslichter, Blinker, Rückfahrleuchten. Nachts und im Regen an; Bremslicht beim Bremsen; Rückfahrlicht beim Rückwärtsfahren. Polizeilichter separat und im Umfeld sichtbar. Geometrie der Leuchten existiert auch ausgeschaltet.

### 8.14 Fahrzeug-Audio

Motorstart, Leerlauf, Last, Reifen, Bremsen, Quietschen, Kollision, Türen, Hupe. Klangprofile je Klasse: Kleinwagen, Sport, Lkw, Motorrad, Polizei. Wenn keine Dateien vorhanden, angenehm klingende eigene synthetische Klänge, keine monotonen hohen Dauertöne.

### 8.15 Kraftstoff

Tankkapazitäten: Kleinwagen 45 l, Limousine 60 l, Sportwagen 65 l, SUV 75 l, Pick-up 80 l, Transporter 85 l, Lastwagen 150 l. Verbrauch nach Motorlast und Weg; moderat. Tankpreis 2 virtuelle Dollar/Liter. Bei leerem Tank Motorantrieb stoppen, Rollen weiter möglich.

### 8.16 Motorrad

Zweiradfahrphysik mit stabilisierendem Verfahren, realer Fahrerfigur/Sitzpose, Kurvenneigung, eigenem Kamera-/Audio-Profil, bei schweren Kollisionen getrennte Fahrerreaktion. Keine ständige Sturzspirale bei minimaler Bewegung.

### 8.17 Spawnregeln

Zivilverkehr nur an freien Straßenpositionen außerhalb direkter Sicht, korrekte Fahrtrichtung, nicht in Gebäuden/anderen Fahrzeugen. Geparkte Wagen auf definierten Stellplätzen. Besitzfahrzeuge nur in Garage/geeigneter Übergabezone. Temporäre Missionsfahrzeuge und aktive Spielerfahrzeuge nicht versehentlich aus Streaminglogik entfernen.

## KAPITEL 9 – VERKEHR UND STRASSEN-KI

### 9.1 Zustände

SPAWNING, CRUISING, FOLLOWING, APPROACHING_INTERSECTION, WAITING_AT_LIGHT, TURNING, AVOIDING_OBSTACLE, STOPPED, PARKING, PANICKING, DESPAWNING. Jeder KI-Wagen folgt einer tatsächlichen Straßenroute. Er bremst für Ampeln, Kreuzungen, Hindernisse und langsamere Fahrer. Keine zufälligen geraden Wegpunkte quer durch Häuser.

### 9.2 Dichte

Sichtbar aktive Fahrzeuge je Region Tag/Nacht: Downtown 22–35/10–18; Solace Beach 14–24/12–22; Crown Marina 10–18/8–16; Northgate 12–20/6–12; Westhaven 8–15/3–8; Iron Docks 8–16/4–9; Pine Ridge 2–7/1–4; Cedar Plains 3–8/1–4; Blackwater Marsh 1–4/0–2. Werte für Umgebung des Spielers, nicht dauerhaft vollsimulierte Gesamtwelt. Bei Performanceproblemen dekorative Dichte herabsetzen, Verteilung erhalten.

### 9.3 Fahrstile

Vorsichtig 25 %: mehr Abstand, langsamere Beschleunigung, leicht unter Limit. Normal 60 %: dem Limit entsprechend, ausgeglichen. Ungeduldig 15 %: zügiger, geringerer Abstand, Hupe bei Behinderung. Geschwindigkeiten für Kurven/Verkehr reduzieren, nicht dauernd auf Bordsteinen fahren. Kollisionen sollen selten und erklärbar sein.

### 9.4 Ampelphasen

Hauptachse Grün 22 s, Gelb 3 s, allseits Rot 1 s, Nebenachse Grün 18 s, Gelb 3 s, allseits Rot 1 s. Konfliktierende Fahrtrichtungen niemals gleichzeitig Grün. Fußgängerampeln synchron. Größere Kreuzungen dürfen verlängerte Phasen besitzen. Fahrzeuge beachten echte Ampelzustände.

### 9.5 Abstände

Normalfahrer Folgezeit 1,2 s, vorsichtig 1,7 s, ungeduldig 0,9 s. Abstandsgeregelte Beschleunigung/Bremsung. Kein ständiges Auffahren bei roten Ampeln. Auf dichtem Verkehr müssen Wagen wieder anfahren können.

### 9.6 Spurwechsel

Auf geeigneten mehrspurigen Straßen kontrolliertes Überholen, Zielspur vor Wechsel auf freie Position prüfen. Keine riskanten Überholmanöver auf engen Bergstraßen. Polizei im Einsatz kann Sonderregeln beachten, ohne unrealistisch durch Gegenverkehr hindurchzufahren.

### 9.7 Unfälle

Physisch relevante Kollisionen; Beteiligte bremsen oder halten, schwere Schäden blockieren Fahrbahn, andere Wagen versuchen Verzögerung/Ausweichroute. Ein Unfall darf nicht dauerhaft alle Verkehrseinheiten einfrieren. Nach kontrolliertem Ereignisende Aufräumen außerhalb Sicht.

### 9.8 Parken

Straßenplätze, Supermarkt, Parkhaus, Wohnauffahrten, Werkstätten, Casino, Hafen. Korrekte Parkrichtung und freier Raum. Einfache Parkmanöver an ausgewählten Orten, keine Pflicht zur komplexen Stellplatzsuche aller Fahrzeuge.

### 9.9 Einsatzfahrzeuge

Ziviler Verkehr reagiert auf Sirenen mit Verlangsamen und Ausweichen, sofern sicher. Keine panischen Sprünge durch Hindernisse oder Wände. Bei Kreuzungen Raum lassen.

### 9.10 Simulationsstufen

Full Simulation für unmittelbare Physik und Kollision, Simplified Simulation für entferntere Straßenrouten, Statistical Simulation für weit entfernte Verkehrsaktivität. Beim Wechsel konsistente Positionen, keine sichtbaren Sprünge. Aktive Verfolgungseinheiten und Spielerfahrzeuge erhalten Vorrang.

## KAPITEL 10 – ZIVILISTEN, NPC-VERHALTEN UND LEBENDIGE WELT

### 10.1 NPC-Ziel

Port Solace muss bewohnt wirken. Fußgänger sind nicht bloß Dekorationen. Sie verfolgen nachvollziehbare Ziele, reagieren auf Weltzustände und besitzen vereinfachte Tagesabläufe. Jeder relevante NPC: eindeutige ID, Charaktermodell, Kleidung, Position, Zustand, Bewegungsziel, Heimatbezirk, Persönlichkeit, Mutwert, Reaktionsgeschwindigkeit, Aktivität, erinnerte Ereignisse, optionale Spielerbeziehung und Animationszustand. Nicht jeder Bürger benötigt eine Lebensgeschichte, aber die Vielfalt aus Aussehen, Route und Reaktion muss die Wiederholung reduzieren.

### 10.2 Archetypen

Acht Kategorien: Pendler (Büro/ÖPNV/Kreuzungen), Tourist (Promenade/Sehenswürdigkeiten/Stopps), Anwohner (Einkauf/Park/Wohngebiet), Geschäftsangestellte (fester Arbeitsplatz), Hafenarbeiter (Industrie/Arbeitskleidung), Sportler (Joggen), Nachtleben-Besucher (Bar/Casino am Abend), Sicherheitsmitarbeiter (bewacht Objekte, reagiert auf unbefugtes Verhalten). Jeder Archetyp hat unterschiedliche Wanderziele, zeitliche Gewichtung, Animationen und passende Kleidung. Keine völlig identischen Tageswege sämtlicher NPCs.

### 10.3 Modelle

Mindestens zwölf sichtbare Grundvarianten mit unterschiedlichen Frisuren, Kleidungsstilen, Körperproportionen, Hauttönen und Accessoires. Unterschiedliche Silhouetten, nicht bloß Materialumfärbung. Modelle mit gemeinsamer Animation kompatibel, Kleidung schneidet nicht auffällig durch Körper. Vielfältig, glaubwürdig und respektvoll ohne Stereotype.

### 10.4 Fußgängernetz

Wegpunkte/Navmesh für Gehwege, Plätze, Parks, Promenaden, Überwege und Innenräume. Keine zufälligen Geraden durch Häuser oder befahrene Fahrspuren. Kreuzungen mit Fußgängersignal: Rot warten, Grün gehen; bei Gefahr gegebenenfalls ausweichen. Navigation berücksichtigt Möbel, Zäune und Geländehöhen. Hindernisvermeidung auch für fliehende Gruppen. NPCs sollen nach blockierter Route neue Wege prüfen.

### 10.5 Tagesabläufe

Pendler: 06:00–08:30 Weg zur Arbeit, 08:30–12:00 Bürogebiet, 12:00–13:00 Mittag, 13:00–17:30 Arbeit, 17:30–19:00 Heimweg, nachts überwiegend inaktiv. Tourist: 09:00–11:00 Strand/Marina, 11:00–14:00 Sightseeing, 14:00–18:00 Freizeit, 18:00–22:00 Essen/Nachtleben, danach geringere Aktivität. Für Hafenarbeiter, Sportler, Nachtleben-Besucher und Ladenpersonal eigene passende Zeitfenster. Zeitpläne dürfen auf Populationsebene abstrahiert werden, müssen aber reale Region-/Zeitänderungen erzeugen.

### 10.6 Wahrnehmung

NPC-Sicht durch Entfernung, Blickrichtung, Sichtlinie, Hindernisse, Licht und Aufmerksamkeit bestimmt. Gehör reagiert auf Schüsse, Explosionen, Hupen, schwere Kollisionen, Sirenen und laute Ereignisse. Zustände CALM, CURIOUS, STARTLED, AFRAID, FLEEING, CALLING_POLICE, HIDING, RETURNING_TO_NORMAL. Mutwert und Abstand verändern Reaktion. Ein leiser Vorfall hinter einer Gebäudewand ist nicht weltweit bekannt.

### 10.7 Zeugen

Zeugenmeldung nur bei gültiger Wahrnehmung. NPC beobachtet Handlung, bewertet Schwere, kann nach 3–8 Sekunden Polizei melden. Eine Meldung enthält Tatort, Typ, Zeitpunkt, Täterbezug und letzte bekannte Position. Eine bereits beobachtete Handlung kann auch gemeldet werden, wenn der Zeuge danach wegrennt. Doppelte Meldungen zur selben Tat nicht zu unendlicher Eskalation aufsummieren.

### 10.8 Panik und Flucht

NPCs wählen einen sicheren Fluchtpunkt und umgehen Hindernisse. Verschiedene Menschen reagieren unterschiedlich: manche suchen Schutz hinter einer Mauer, andere laufen ins nahe Gebäude oder entfernen sich schnell. Keine gleichförmigen synchronen Panikbewegungen. Fußgänger sollen sich nicht an einer Ecke dauerhaft gegenseitig blockieren. Rückkehr zum Normalzustand nach Ende der Gefahr und Ablauf einer Abkühlzeit.

### 10.9 Dialoge

Kurze situationsgebundene Texte/Sprachzeilen für Begrüßung, Kauf, Verkehrskonflikt, Unfall, Schuss, Polizeieinsatz, Drängeln. Keine ständige Wiederholung identischer Sätze. Unpassende synthetische Laute vermeiden; wenn keine Stimmen vorhanden, kurze Untertitel und Animation. Ein Ladenbesitzer darf nach Ladenöffnung begrüßen, aber nicht im Sekundentakt denselben Satz ausgeben.

### 10.10 Personal

Kassierer an Kassen, Mechaniker in Werkstatt, Dealer am Tisch, Verkäufer im Autohaus. Bei Interaktion Zustand fixieren, nach Abschluss zurückführen. Die NPCs dürfen nicht während laufendem Kauf verschwinden. Keine zweite Kopie derselben Figur beim mehrfachen Öffnen des Menüs.

### 10.11 Gruppen

Zweiergruppen auf Gehwegen, Dreiergruppe am Strand, Besucher vor Nachtclub, zwei Personen im Park. Gruppen bewegen sich mit leicht versetzten Schritten/Animationen und behalten plausible Abstände. Auf Panik können Gruppen auseinanderlaufen. Gruppen brauchen keine eigenen komplexen Dialoggeneratoren.

### 10.12 Fahrzeugreaktion

Bei herannahendem Auto mit hoher Geschwindigkeit sichtbare Ausweichreaktion, bei Langsamfahrt eher Aufhalten oder Zurücktreten. Hupen erzeugt verschiedene Gesten, Kommentare oder Abwendung. Die Reaktionen dürfen nicht sämtliche Figuren mit übermenschlicher Reflexzeit ausweichen lassen. Ein schwerer Unfall löst echte Schaden-/Polizeiereignisse aus.

### 10.13 Entfernungs-Simulation

Nahe NPCs mit Animation/Kollision/Wahrnehmung, mittlere mit reduziertem Zustand, entfernte statistisch. Beliebige Passanten dürfen außerhalb Sicht neu entstehen, aber Händler, missionsrelevante Figuren und andere persistente Charaktere behalten Zustand. Kein permanenter Rechenaufwand für unzählige Welt-NPCs. Streaming darf relevante Ereignisflags nicht verlieren.

## KAPITEL 11 – POLIZEI, FAHNDUNG UND KRIMINALITÄT

### 11.1 Kern

Polizei nicht als simples auf Spielerkoordinate gerichtetes Auto implementieren. Drei Zustände: unbemerkte Straftat ohne gültige Meldung, aktive Fahndung mit bestätigter Sichtung und Suchphase mit letzter bekannter Position. Die Polizei erhält Informationen nur über gültige Sicht oder Meldung. Sie besitzt keine allwissende Position des Spielers. Sichtlinien, Blockaden und Tarnung durch Fahrzeugwechsel sind echte Mechaniken.

### 11.2 Verbrechenskatalog

Fahrzeugdiebstahl, Angriff auf Zivilisten, Schießen in Öffentlichkeit, Angriff auf Beamten, Fahrzeugbeschädigung, schwerer Unfall, Missionsraub, Sachbeschädigung, gefährliche Flucht, Angriff auf Polizeifahrzeug. Verbrechen-Datensatz: Typ, Schwere, Ort, Zeitpunkt, potentielle Zeugen, Meldestatus, Täterbezug, Eskalationswert. Die Polizei reagiert auf Meldungen statt auf frei erfundene Ereignisse.

### 11.3 Fahndungsstufen

Stufe 0: kein Fahndungsstatus; normale Streife fährt regulär. Stufe 1: lokale Suche und Anhalteversuch durch eine Streife. Stufe 2: mehrere Polizeiwagen verfolgen aggressiver, Verstärkung möglich. Stufe 3: stadtweite Fahndung, mehr Fahrzeuge, erste Straßensperren, längere Suche. Stufe 4: schneller Interceptor, koordinierte Sperren, möglicher Polizeihubschrauber. Stufe 5: maximaler Einsatz, mehrere Einheiten und temporäre Sperrungen, Luftunterstützung, speziellere Gegner. Gleichzeitig aktive Fahrzeuge begrenzen; keine unendliche Welle innerhalb der Kamerasicht.

### 11.4 Eskalationspunkte

Stufe 0 = 0; Stufe 1 = 1–19; Stufe 2 = 20–44; Stufe 3 = 45–79; Stufe 4 = 80–119; Stufe 5 ab 120. Fahrzeugdiebstahl 12, schwerer Unfall 8, öffentlicher Schuss 18, Angriff Zivilist 20, Polizeifahrzeug 25, Beamter 35, Missionsraub 50. Ohne Meldung keine normale automatische Fahndung. Mehrfach derselbe Vorfall darf nicht unendlich Punkte erzeugen.

### 11.5 Fahndungsdaten

Fahndungsstufe, letzte Spielerposition, letzte Sichtungszeit, aktive Einheiten, Sichtkontakt, bekanntes Spielerfahrzeug/-farbe, Suchbereich, zuletzt gesehene Bewegungsrichtung, Eskalationsphase. Bei direkter Sicht präzise Position; nach Sichtverlust nur Suchraum und letzte Position. Polizeiverfolgung muss auf dem Straßennetz navigieren.

### 11.6 Sichtkontakt

Sichtkegel mit Reichweite, Blickwinkel, Hindernistest und Beleuchtung. Ein Polizist hinter einem Haus sieht nicht hindurch. Beim Abbiegen hinter dichtem Gebäude verlieren Verfolger gegebenenfalls Sicht und fahren zur letzten bekannten Position. Neue Zivilistenmeldungen oder Hubschraubersichtung können Informationen aktualisieren. Das Verfolgen darf nicht anhand unsichtbarer Aktualisierungen erfolgen.

### 11.7 Suchphase

Nach Sichtverlust fährt Polizei in den letzten bekannten Bereich und sucht plausible Straßensegmente. Radius nach Stufe: 1 = 100 m, 2 = 150 m, 3 = 220 m, 4 = 300 m, 5 = 400 m. Einheiten mit Suchrouten, manche halten an, Hubschrauber kreist bei höheren Stufen. Nicht jeder Suchwagen muss exakt den Spieler ansteuern. Suchzustand hat echte Dauer.

### 11.8 Fahndung verlieren

Ohne neue Sichtung: Stufe 1 mindestens 25 s, Stufe 2 40 s, Stufe 3 60 s, Stufe 4 85 s, Stufe 5 110 s. Timer beginnt nur ohne gültigen Sichtkontakt; neue Verbrechen verlängern. Nach Erfolg Sternanzeige verschwindet, Streifen kehren schrittweise zum normalen Verhalten zurück. Flucht nicht allein durch Ablaufen eines Timers während aktiver Sicht ermöglichen.

### 11.9 Polizeirollen

PRIMARY_PURSUIT direkt verfolgen; SUPPORT_PURSUIT über alternative Straße abkürzen; ROADBLOCK_UNIT geeigneten Knoten besetzen; SEARCH_UNIT letzte Position durchsuchen; INTERCEPTOR schnellere Wagen auf Hauptverkehrsadern. Rollenzuweisung nach Stufe und Einheitenzahl. Polizeiwagen dürfen nicht alle dieselbe Weltposition ansteuern und sich ineinander verkeilen.

### 11.10 Straßensperren

Nur an geeigneten Straßenknoten außerhalb direkter Sicht. Mindestens zwei Polizeiwagen, auf höheren Stufen zusätzliche Absperrelemente. Physische Objekte, kontrollierte Kollision, mögliche Ausweichroute. Kein spontanes Erscheinen direkt vor der Spielerfront. Bereits existierende Verkehrssituation beachten.

### 11.11 Hubschrauber

Ab Stufe 4 möglich. Eigenständiges 3D-Modell mit Haupt- und Heckrotor, Lichtern, Polizeimarkierung. Höhe ca. 70–120 m über Boden, sichtbarer Anflug, langsame Suchkreise, Suchscheinwerfer nachts, Rotorgeräusch, Rückflug nach Ende. Kein Teleport direkt über Alex. Hubschrauber darf nur bei plausibler Sicht die genaue Position kennen. Kontrolliertes vereinfachtes Flugmodell genügt.

### 11.12 Beamten-KI

PATROLLING, RESPONDING, EXITING_VEHICLE, APPROACHING_SUSPECT, TAKING_COVER, AIMING, ENGAGING, ARRESTING, SEARCHING, RETURNING. Beamte können bei niedriger Stufe anhalten/stellen, bei bewaffnetem Angriff Deckung aufsuchen und kämpfen. Nicht als bloße Gegnerwelle ohne taktische Zustände. Bei Verletzung und Hindernissen nachvollziehbare Reaktionen.

### 11.13 Verhaftung

Auf niedriger Stufe und bei geeignetem Abstand kann ein Beamter Festnahme einleiten. Kurze passende Animation, dann BUSTED-Bildschirm, begrenzter Geldverlust als virtuelle Strafe, Respawn an Polizeistation, Fahndung zurücksetzen. Der Spieler darf nicht nach der Verhaftung am gleichen Ort mit identischem aktiven Fahndungsstatus festsitzen.

### 11.14 Fahrzeugwechsel

Polizei merkt sich erkanntes Verdächtigenfahrzeug. Unbeobachteter Wechsel nach Sichtverlust kann Identifikation erschweren, direkt beobachteter Wechsel nicht. Keine magische Sofort-Löschung einer Fahndung. Fahrzeug-ID, Farbe und letzte Beobachtung verwalten.

### 11.15 Funk

Ereignisgebundene Meldungen: „Fahrzeug gesichtet“, „Verdächtiger biegt nach Westen ab“, „Sichtkontakt verloren“, „Verstärkung angefordert“, „Straßensperre vorbereiten“, „Luftunterstützung unterwegs“, „Suchbereich ausgeweitet“. Nur in tatsächlichen Situationen ausgeben, bei fehlenden Audio-Dateien lesbare Untertitel oder reduzierte Funk-SFX. Keine zufälligen unpassenden Ausrufe.

### 11.16 HUD

Fünf kleine Sterne rechts oben, aktive warm orangegelb, inaktive dunkelgrau. Ohne Sichtkontakt pulsierende Umrisse und Hinweis „POLIZEI SUCHT NACH DIR“. Nach Ende ca. drei Sekunden „FAHNDUNG BEENDET“. Anzeigen sind direkt an PoliceManager gebunden.

### 11.17 Spielgefühl

Enge Downtown-Kurven erschweren Flucht, breite Highways ermöglichen Speed, Westhaven bietet alternative Straßen, Pine Ridge Kurven und Geländestrecken. Echtes Verfolgen, Abkürzen, Suchen und allmähliches Aufgeben. Die Polizei ist fordernd, aber fair. Spieler sollen die Regeln verstehen und absichtlich ausnutzen können, statt gegen unsichtbare Teleport-Tricks zu verlieren.

## KAPITEL 12 – KAMPFSYSTEM UND WAFFEN

### 12.1 Kernmechaniken

Modernes Third-Person-Actiongefühl: Zielen, Schießen, Nachladen, Waffenwechsel, Treffer, Schaden, Rückstoß, Mündungsfeuer, Einschläge, Munition, Deckung, Gegnerreaktionen und Trefferfeedback. Waffen als fiktive Modelle, kein realer Bauplan. Jeder Schuss verarbeitet Zeit, Munition, Hindernisse und Zielzonen korrekt.

### 12.2 Waffen

Meridian P9 Pistole: Magazin 15, Basisschaden 24, maximal 4 Schuss/s, Reload 1,5 s.
Blackline SMG: Magazin 30, Basisschaden 16, 12 Schuss/s, Reload 2,1 s.
AR-56 Sentinel Sturmgewehr: Magazin 30, Basisschaden 22, 10 Schuss/s, Reload 2,3 s.
Ironwood 12 Schrotflinte: Magazin 8, Schaden 12 je Projektil, Schussintervall 0,85 s, Reload 0,65 s je Patrone.
Ranger M14 Präzisionsgewehr: Magazin 10, Basisschaden 55, Schussintervall 1,2 s, Reload 2,8 s.

### 12.3 Hitscan und Sichtlinie

Standard-Hitscan vom Kameraziel mit zusätzlicher physischer Sichtprüfung von der Waffenmündung. Nicht durch nahe Wände schießen. Kollision mit Gelände, Gebäuden, Fahrzeugen und Charakteren. Wirkliche Trefferzone am Charakter, keine pauschale Bildschirmkoordinate. Schießen abhängig von festen zeitlichen Intervallen, nicht FPS.

### 12.4 Rückstoß/Streuung

Pistole kurzer vertikaler Impuls; SMG moderat im Dauerfeuer; Sturmgewehr etwas stärker, kontrollierbar; Shotgun deutlicher Einzelschuss; Präzisionsgewehr kräftig und länger. Streuung abhängig von Stehen, Gehen, Sprint, Ducken, Zielen. Beim Sprinten ungenauer, beim Zielen präzise, geduckt leicht besser. Recoil im Kamera- und Zielsystem wirksam.

### 12.5 Nachladen/Munition

Magazine und Reserve getrennt. Eine Waffe mit 0 Schuss feuert nicht. Nachladen zieht nur verfügbare Reserve und verhindert Munitionserzeugung. Shotgun kann einzelne Patronen nachladen und gegebenenfalls unterbrechen. Wechsel der Waffe bewahrt ihren jeweiligen Magazinzustand. Reload-Animationen müssen den richtigen Zeitpunkt der Munitionsübernahme abbilden.

### 12.6 Trefferzonen

Kopf Multiplikator 1,75, Oberkörper 1,0, Arme/Beine 0,85. Trefferkörper an realistische Proportionen angepasst. Keine permanenten Treffermeldungen bei einem Hindernis zwischen Schütze und Ziel. Bei Gesundheit 0 Gegnerreaktion und Entfernen aus Kampfzustand.

### 12.7 Waffenrad

Tab hält kreisförmiges Waffeninterface offen, zeigt Symbole, Namen, Munition. Singleplayer-Zeit dabei kontrolliert verlangsamen. Auswahl per Mauswinkel, beim Loslassen aktivieren. Optional Nummerntasten. Keine gleichzeitige normale Spielerkamera- und Menüinteraktion.

### 12.8 Deckung

Betonbarrieren, Autos, niedrige Mauern, Kisten als Deckungsobjekte. Nahe Deckung und Interaktion aktivieren passende Haltung und Kamera, Zielschießen seitlich oder darüber. Die reale Schusskollision respektiert Deckungsgeometrie; Beton schützt, dünne Dekoration nicht unbedingt. Aus Deckung wieder aussteigen ohne Blockade.

### 12.9 Gegner

Zustände PATROL, SUSPICIOUS, ALERT, SEEK_COVER, ATTACK, RELOAD, FLANK, RETREAT, INCAPACITATED. KI bewegt sich zwischen passenden Deckungen, feuert in Intervallen, lädt nach, reagiert auf Beschuss und verliert Gesundheit. Keine Gegner, die ohne Animation ununterbrochen auf Alex zulaufen. Nicht durch Wände schießen.

### 12.10 Effekte und Polizei

Mündungsfeuer/-rauch, Schussgeräusche, Rückstoß, Einschläge, optionale Tracer, Nachladen, Klick bei Leerstand. Materialabhängige Treffer: Metallfunken, Betonstaub, Holzsplitter. Effekte per Pool. Schüsse sind Hörereignisse, Zivilisten reagieren und können Polizei melden; offene bewaffnete Aktion soll eine Fahndung erzeugen können. Fahrzeugaufpralle verletzen Figuren geschwindigkeitsabhängig.

## KAPITEL 13 – WIRTSCHAFT, BESITZ UND FORTSCHRITT

### 13.1 Geldsystem

Ausschließlich fiktive Währung „Sunset Dollars“ mit Symbol $. Keine realen Geldtransaktionen, Auszahlungen oder Echtgeldcasinos. Offline-Singleplayer. Startgeld: 750 $ Bargeld, 2.500 $ Bankguthaben; gemietetes Apartment, gebrauchter Volton Metro, Pistole mit begrenzter Munition, Smartphone, Grundinventar. Bargeld für kleinere Käufe/ausgewählte Aktivitäten, Bankkonto für größere Käufe. Transaktionen atomar, keine negativen Bestände durch doppelte Klicks.

### 13.2 Kaufpreise

Volton Metro 4.800 $; Alden Crest 11.500 $; Vexler GT 32.000 $; Corsair S9 78.000 $; Tempest XR 210.000 $; Northstar Trail 28.000 $; Bravon Ridge 36.000 $; Ironhorse 250 24.000 $; Hauler V6 18.000 $; Velocity R 45.000 $. Polizeifahrzeuge nicht normal kaufbar. Autohändler zeigt echte Modelle, Stats und Preise. Nach gültigem Kauf erscheint Wagen auf Übergabeplatz und ist persistent im Besitzregister.

### 13.3 Besitzfahrzeuge

ID, Modell, Lack, Upgrades, Schäden, Tank, Position, Garagenzuordnung, Kaufzeit, Kennzeichen, Besitzflag. Beim Entladen der Welt erhalten. Über passend registrierte Garage zurückholbar, aber nicht willkürlich mitten auf Straße teleportieren. Fahrzeuge können parkbar und speicherbar sein.

### 13.4 Garage

Erste Garage in Westhaven, Preis 8.000 $, vier Plätze. Kauf schaltet Kartensymbol und Garagenmenü frei. Einparken in gültiger Zone, Speicherung auf Bestätigung, Fahrzeugliste und Wahl eines gespeicherten Besitzfahrzeugs. Wechsel nachvollziehbar auf Stellplatz, keine Duplikation, keine Entfernung eines gerade gefahrenen Autos.

### 13.5 Reparatur und Upgrades

Reparaturpreis = 100 $ + Schadensanteil (0–1) × Fahrzeugwert × 0,08; sinnvoll begrenzen. Motor Stage 1 +7 % Beschleunigung für 3.000 $; Motor Stage 2 weitere +8 % für 6.000 $; Sportbremsen +12 % Bremsen für 2.200 $; Sportreifen +8 % Asphaltgriff für 1.800 $; Offroad-Reifen verbesserte Schotter-/Schlammtraktion 1.600 $; Sportfahrwerk geringere Seitenneigung 2.500 $; Lack 500 $; Felgenwechsel 900 $. Optische Upgrades sichtbar und Werte in Fahrphysik gespeichert.

### 13.6 Legale Einnahmen

Kurierauftrag mit Zustellung 120–300 $; Taxifahrt mit NPC-Ein-/Ausstieg 80–220 $; KI-Straßenrennen je Strecke 500–1.500 $; kleine Lieferfahrt mit Parkaufgabe 150–400 $. Keine Auszahlung nur durch Klick auf Missionsknopf. Bedingungen und Zeitfenster müssen wirklich erfüllt sein.

### 13.7 Illegale Einnahmen

Mindestens größere Mission THE HARBOR JOB, Belohnung 18.000 $. Beute wird als Bargeld vergütet. Illegale Aktivitäten erzeugen bei Wahrnehmung Fahndung. Keine mehrfache Auszahlung nach Save-/Checkpoint-Neuladen. Fiktive Spielmechanik ohne reale Anleitungen.

### 13.8 Balancing

Kleine Upgrades nach wenigen Nebenaufträgen bezahlbar, Top-Sportwagen erhebliche Langzeitinvestition. Casino kann gewinnen und verlieren, kein garantierter Gelddrucker. Keine automatische Preisangleichung, die Fahrzeugfortschritt nutzlos macht. Virtuelle Behandlungskosten nach Hospital, Geldstrafen nach Verhaftung begrenzt.

### 13.9 Transaktionen

Letzte 30 Buchungen mit Betrag, Typ, Beschreibung, Zeit und neuem Kontostand speichern. Bank-App zeigt Übersicht. Positive HUD-Buchung gedämpft grün, negative rot, klein und kurz. Bei fehlendem Geld Fehlermeldung statt Kauf. Einkäufe, Gewinne, Werkstatt und Missionen benutzen denselben EconomyManager.

## KAPITEL 14 – THE CROWN CASINO & RESORT

### 14.1 Bedeutung und Architektur

Das Casino ist ein zentraler Gameplay- und Präsentationshöhepunkt, kein Dekogebäude. Durch Parkzone, großzügigen überdachten Haupteingang, Glasautomatik-Tür und Lobby tatsächlich begehbar. Lobby ungefähr 18 × 12 m: Steinboden, Rezeption, Sitzmöbel, Pflanzen, indirektes Licht, Crown-Logo, Informationsstand, NPCs. Casino-Spielbereich etwa 35 × 28 m: dunkles Blau, Gold, warmes Holz und dezentes Rot, aufwendiges Licht, klare Wege. Vorn Chipkasse, links Slots, mittig Roulette, rechts Blackjack, hinten Bar und Sitzbereiche. Keine Kollisionen zwischen begehbaren Wegen und Möbeln.

### 14.2 Chips

1 Chip = 1 virtueller Sunset Dollar. An Kasse Bargeld gegen Chips, Optionen 100, 500, 1.000, 5.000, zusätzlich freie Eingabe; Rücktausch 1:1 möglich. Transaktion atomar, kein Doppelklick-Duplikat. Chips persistent. Kassen-NPC und UI stimmen überein.

### 14.3 Blackjack – Spielmaterial

Sechs Decks à 52 Karten, 312 Karten. Nach ca. 75 % Verbrauch vor nächster Runde neu mischen. Werte: 2–10 direkt, Bube/Dame/König 10, Ass wahlweise 1 oder 11. Soft-Hands richtig auswerten. Vier Symbole Herz, Karo, Pik, Kreuz; Karten sichtbar mit Wert und Symbol. Animationen für Ausgabe und Handbewegung. Dealer steht/sitzt am Tisch.

### 14.4 Blackjack – Ablauf

Spieler betritt Tisch, Kamera schwenkt, wählt Einsatz; Spieler bekommt zwei offene Karten, Dealer eine offene und eine verdeckte. Aktionen HIT, STAND, DOUBLE und SPLIT nach Regeln. Einsatz mindestens 25, maximal 1.000 Chips; +25/+100/+500/CLEAR/DEAL. Ungültige Aktionen deaktivieren. HIT zusätzliche Karte, STAND Ende eigener Ziehphase, DOUBLE verdoppelt Einsatz und zieht genau eine Karte, SPLIT nur bei gleichrangigen Startkarten mit ausreichendem Guthaben und zwei getrennten Händen. Dealer zieht bis 16, bleibt bei 17 oder mehr, auch Soft 17. Natürlicher Blackjack genau zwei Karten und 21, Auszahlung 3:2; normale Gewinne 1:1; Push gibt Einsatz zurück; Bust verliert. Nach Split zählt Ass+Zehnwertkarte als normale 21, nicht natürlicher Blackjack. UI zeigt Chips, Einsatz, Karten, Handwert, Dealer, letzte Runde. Keine zufällige Gewinnfestlegung ohne Kartenregeln.

### 14.5 Roulette – Material

Europäisches Rad mit Zahlen 0–36, exakt eine Null. 3D-Tisch mit Kessel, animiertem Rad, Kugel, Einsatzraster, Chips, Dealer, Gewinnbereich. Ergebnis aus gleichverteilter Auswahl; Kugelanimation muss exakt auf berechneter Zahl enden. Keine geheime Anpassung an Vermögen. Einsätze: Einzelzahl 35:1, Rot/Schwarz 1:1, Gerade/Ungerade 1:1, 1–18/19–36 1:1, Dutzend 2:1, Kolonne 2:1. Zero verliert alle üblichen Außenwetten. Auszahlung als Profit plus Einsatz. Einzelwette ab 10 Chips, Gesamteinsatz bis 2.500. Mehrere Felder gleichzeitig möglich, Einsätze nur vor Spin bearbeiten. UI: CHIP 10/50/100/500, CLEAR BETS, SPIN, EXIT; letzte zehn Zahlen. Chippositionen auf echtem Einsatzfeld. Nach Start keine späten Einsätze. Keine doppelte Auszahlung durch Verlassen/Neuladen.

### 14.6 Slots – drei Varianten

Neon Fortune, Golden Palms, Lucky Crown. Jeder Automat 5 Walzen, je drei sichtbare Symbolpositionen, zehn fest definierte Gewinnlinien, eigenständige Farbwelt. Symbole: Krone, Stern, Kirsche, Glocke, Diamant, Sieben, Palme, Münze. Einsatz 5/10/25/50 Chips. Gewinnlinien über identische Symbolketten, Standard: 3 gleiche 2× Linienwette, 4 gleiche 5×, 5 gleiche 15×, seltene Symbole höher nach offener Auszahlungstabelle. Ergebnis vor Spin ziehen, Walzen passend animieren. Walzen starten gemeinsam und stoppen von links nach rechts leicht versetzt; Gewinne durch beleuchtete Linien anzeigen. Zeige Chipguthaben, Einsatz, letzten Gewinn, Auszahlungstabelle, Spin und Exit. Keine erzwungenen Siege jeder dritten Runde.

### 14.7 Bar, Gäste und Kamera

Casino-Bar mit drei virtuellen Getränken, kurzfristigen, begrenzten Statuswirkungen und optionaler Trinkanimation. Gäste an Automaten, Spieltischen, Lobby, Bar, Gehwegen; Dealer bleiben an Stationen. Keine NPCs durch Tische. Blackjack-Kamera über Spielerhand, Roulette Kessel und Einsatzfeld, Slots frontal. Weiche Übergänge zur Third-Person-Kamera; Spieler bleibt körperlich am Tisch.

### 14.8 Speicher- und Abnahmeregeln

Laufende gültige Einsätze können nicht durch Menuschließen ohne Konsequenz zurückgeholt werden. Bereits bestätigte Chipbelastungen beim Laden nicht doppelt bearbeiten. Casino abgeschlossen erst, wenn Gebäude begehbar, Chips in beide Richtungen handelbar, Blackjack/European Roulette/drei Slots mit echten Regeln spielbar, Auszahlungen korrekt und Chips persistent sind. Nach jedem Spiel normal in freie Welt zurückkehren.

## KAPITEL 15 – WEITERE MINIGAMES UND FREIZEITAKTIVITÄTEN

### 15.1 Anforderungen

Neben Casino mindestens Straßenrennen, Darts, Billard, Basketball, Lieferaufträge und Taxifahrten. Straßenrennen, Darts und Billard erhalten innerhalb des Kapitels höchste Priorität. Jede Aktivität benötigt echte Spielerinteraktion, sichtbare 3D-Umgebung und konkrete Regeln. Sie darf nicht bloß ein Button mit zufälliger Auszahlung sein. Alle Aktivitäten sind wiederholbar, Einmalbelohnungen nur einmal. Menüs und Kamera müssen hinterher in normalen Spielmodus zurückkehren, alte Timer/Einheiten entfernen.

### 15.2 Straßenrennen – Routen

Coastal Sprint entlang Küste etwa 2,4 km, Downtown Circuit über Kreuzungen und enge Kurven etwa 3,1 km, Ridge Run durch Pine Ridge etwa 4 km. Strecken benutzen existierenden RoadNetwork-Graphen, keine Luftlinien. Jedes Rennen drei KI-Gegner mit passenden Autos. Gegner durchfahren Checkpoints regelkonform und werden nicht dauerhaft außerhalb Strecke teleportiert. Rennen im offenen Verkehr; bei Lastspitzen dekorative Verkehrsdichte reduzieren, aber Welt nicht in einen anderen leeren Modus verwandeln.

### 15.3 Straßenrennen – Ablauf

Startmarker am geeigneten Parkplatz. Spieler fährt mit Fahrzeug in markierten Bereich, bestätigt Rennen. Fahrer werden auf sinnvolle Startpositionen gesetzt. Countdown 3, 2, 1, GO; vor Start keine automatische Beschleunigung. Checkpoints in fester Reihenfolge, Mindeststrecke zwischen Checkpoints, kein Durchspringen. HUD zeigt Position 1/4–4/4, Rennzeit, nächster Kontrollpunkt, Minimaproute und Fortschritt. Platzierungen anhand tatsächlich zurückgelegter Route und Checkpointfolge berechnen. Belohnungen: Coastal Sprint 500 $, Downtown Circuit 900 $, Ridge Run 1.500 $, nur bei echtem Sieg. Fahrzeugunterschiede und Fahrfehler sollen Rennausgang beeinflussen.

### 15.4 Darts – Ort und Darstellung

Dartboard in Northgate Bar. E-Interaktion öffnet Kamera vor der Scheibe; Spieler bewegt Fadenkreuz per Maus, hält LMB für wandernde Kraftanzeige und lässt los. Treffer aus Zielpunkt plus geringer kontrollierter Streuung und Wurfkraft berechnen. Dartboard mit Zahlen 1–20, Single-, Double- und Triple-Ringen, Outer Bull 25, Bull 50. Punkte müssen dem real getroffenen Feld entsprechen. Sichtbar platzierte Pfeile statt unsichtbarer Statistik.

### 15.5 Darts – 301-Regeln

Spieler und KI beginnen jeweils mit 301 Punkten. Jeder Zug umfasst maximal drei Würfe. Punkte werden subtrahiert, exakt 0 gewinnt; Überschreiten oder negative Restsumme macht Zug ungültig und stellt Stand vor diesem Zug wieder her. Keine Double-Out-Regel. KI-Gegner mit variabler Zielgenauigkeit, keine konstanten perfekten Würfe. Kostenlos spielen oder 100 $ Einsatz; bei Sieg in Einsatzvariante insgesamt 200 $ Auszahlung, sonst keine. Turn-Anzeige, Restsumme, letzter Wurf, Exit nach Abschluss. Kein unbeabsichtigter zweiter Einsatz durch schnelle Klicks.

### 15.6 Billard – Geometrie

Billardtisch in Northgate Bar, sechs Taschen, eine weiße Spielkugel, sieben volle, sieben halbe, eine schwarze Acht, sichtbarer Queue. Kugeln echte Physikobjekte, rollen, kollidieren, prallen an Banden ab, Reibung reduziert Geschwindigkeit, versenkte Kugeln fallen und werden entfernt. Keine animierten Fake-Kugeln ohne Trefferauswertung. Maus verändert Queue-Winkel; Kraftanzeige regelt Stoßstärke. Optional Zielhilfe zeigt erste Kontaktlinie, aber nicht garantiert den gesamten Lauf.

### 15.7 Billard – 8-Ball

Nach Break werden Voll/Halb anhand der ersten gültig versenkten Gruppenkugel zugeteilt. Spieler räumt eigene Gruppe ab, danach Acht legal versenken. Vorzeitiges Versenken der Acht verliert Partie. Foul: gegnerisches Ball-in-Hand. Spieler und KI wechseln Züge nach geltenden Regeln. KI wählt einfache plausible Stoßrichtung mit Zielkugel/Tasche, sie braucht nicht perfekt zu sein. Kostenlos oder um 150 $ spielen, Sieg mit Einsatz zahlt insgesamt 300 $. Regeloberfläche mit aktiver Gruppe, Kugeln und aktuellem Spieler. Weiße Kugel darf nicht verschwinden, wenn sie in Tasche fällt; korrekte Ball-in-Hand-Wiederherstellung.

### 15.8 Basketball

Northgate-Basketballplatz mit echtem Ring, Brett, Netz- oder Netzandeutung, Ball und Boden. Nach Interaktion Spieler mit Ball, passende Wurfkamera, Maus zielt, Kraftanzeige, physische Ballflugbahn, Kollisionen mit Ring/Brett. Treffer nur, wenn Ball tatsächlich von oben nach unten durch Zone gelangt. 60 Sekunden Challenge, zwei Punkte je Treffer, ab 20 Punkten bestanden. Erste erfolgreiche Challenge 250 $, Wiederholungsgewinn 50 $. Ersterfolg nur einmal speichern; bei Spielabbruch kein unverdienter Preis.

### 15.9 Lieferaufträge

Downtown Express vom Café ins Büro 180 $, Beach Delivery vom Restaurant ins Hotel 220 $, Westhaven Supplies vom Supermarkt zum Wohnhaus 160 $. Spieler nimmt Auftrag bei echtem Geschäft/NPC an, erhält Ziel, transportiert physisches oder inventarbasiertes Paket, gibt am korrekten Ort ab. Großzügige Zeitvorgabe. Kein Abschluss durch bloßes Annehmen oder Öffnen der Karte. Nach Übergabe korrekte Geldbuchung, System bereit für weitere Aufträge.

### 15.10 Taxifahrten

Nur in geeignetem Taxifahrzeug. Taxi-Modus über Fahrzeuginteraktion aktivieren, gültiger NPC-Abholort, in markierter Zone anhalten, NPC steigt sichtbar ein. Dann GPS-Ziel, am Ziel halten, NPC steigt aus, Auszahlung 80–220 $ je Distanz. Mindestens fünf Abhol-/Zielorte. Schwere Kollisionen mindern Trinkgeld. Auftragsabbruch ohne Auszahlung; kein Passagier dauerhaft im Fahrzeug nach Missionende.

### 15.11 Karte und Wiederholung

Aktivitätsicons: Casino Chip/Karte, Rennen Flagge, Darts Zielscheibe, Billard Kugel, Basketball Ball, Lieferung Paket, Taxi Fahrzeug. Filter auf Weltkarte, Interaktionsmarkierungen nur in passender Nähe. Alle regulären Aktivitäten wiederholbar, Einmal-Boni durch persistente Flags schützen. Kameras, UI-Overlays, temporäre NPCs und Events nach jeder Runde korrekt aufräumen.

## KAPITEL 16 – HAUPTMISSION: THE HARBOR JOB

### 16.1 Missionsauftrag

THE HARBOR JOB als zusammenhängende Hauptmission von etwa 15–25 Minuten Zielspielzeit. Sie verknüpft Open-World-Erkundung, Fahrzeugsteuerung, Gespräch, Vorbereitung, Geld, Fluchtfahrzeug, kurze abstrahierte Überfallsequenz, Kampf, Polizei, Fahndung, Flucht, Fortschritt, Speicherung und Belohnung. Der Inhalt ist fiktional; keine realweltlichen Sicherheitsumgehungs- oder Raubanleitungen. Bestehende Systeme verwenden, keine separate Fake-Polizei oder Teleport-Rennen bauen.

### 16.2 Handlung und Figuren

Alex Morgan wird von ehemaligem Hafenarbeiter Marcus Reed kontaktiert. Marcus kennt einen fiktiven privaten Werttransport im Hafen und bietet eine riskante Gelegenheit an. Alex muss Gelände besichtigen, Fahrzeug bereitstellen, die Mission durchführen und danach Fahndung abschütteln. Dialog humorvoll/knapp, keine ausufernden Monologe. Marcus und andere Missionsfiguren mit konkreten Spawnpunkten, Animationen, Triggern und Zustandslogik.

### 16.3 Start

Smartphone-Nachricht: „Alex. Wenn du ein bisschen mehr als Kleingeld verdienen willst, komm heute Abend zu Pier 17. Ich habe einen Job für dich. – Marcus“. Orange Marker bei Pier 17. Innerhalb 3 m E – MIT MARCUS SPRECHEN. Dialog:
Marcus: „Du bist Alex, richtig? Ich hab gehört, du kannst fahren.“
Alex: „Kommt drauf an, wer fragt.“
Marcus: „Jemand, der gerade eine ziemlich gute Gelegenheit gefunden hat.“
Alex: „Was für eine Gelegenheit?“
Marcus: „Ein Transport. Viel Geld. Wenig Zeit.“
Alex: „Das klingt nach dem Teil, den du mir verschweigst.“
Marcus: „Der Teil kommt, sobald wir vorbereitet sind.“
Danach Missionsübersicht und erstes Ziel.

### 16.4 Missionszustände

NOT_STARTED → MEET_MARCUS → RECONNAISSANCE → GETAWAY_VEHICLE → RENDEZVOUS → WAIT_FOR_TRANSPORT → AMBUSH → SECURE_CARGO → ESCAPE_DOCKS → LOSE_POLICE → DELIVER_CARGO → MISSION_COMPLETE; alternativ MISSION_FAILED. Jeder Übergang hat Eintritts-/Austrittsbedingungen und eindeutige Ereignisse. Keine Phasen ohne Abschluss oder mehrfach ausgeführten Setup-Code.

### 16.5 Erkundung

Spieler fährt zum Freight Depot und besucht drei Beobachtungspunkte: öffentlicher Parkplatz, kleine erhöhte Plattform, seitliche Zufahrt. Jeder mit Interaktionsradius und kurzer Kameraansicht. Nach drei echten Beobachtungen erscheint „Erkundung abgeschlossen.“ und Marcus sendet Nachricht. Keine detaillierte reale Schwachstellenanalyse; rein fiktive Missionsmarker und geskriptete Darstellung.

### 16.6 Fluchtfahrzeug

Marcus fordert schnelles Fluchtfahrzeug. Spieler darf ein geeignetes eigenes Auto nutzen oder markierten Vexler GT auf Parkplatz in Westhaven holen. Fahrt zum Treffpunkt in Iron Docks und korrekt in markierte Zone einparken. Nur ein gültig abgestelltes Fahrzeug zählt als bereit. Fahrzeug bleibt an echter Position für spätere Flucht. Anzeige „Fluchtfahrzeug bereit.“

### 16.7 Treffpunkt

Marcus neben unauffälligem Lieferwagen. Dialog:
Marcus: „Gut. Jetzt haben wir wenigstens eine Chance, hier lebend rauszukommen.“
Alex: „Du hast ein unglaubliches Talent, Leute zu beruhigen.“
Marcus: „Gewöhn dich dran.“
Ziel „Begib dich zur markierten Position.“ Spielerposition und Missionsphase korrekt kontrollieren.

### 16.8 Transportankunft

Fiktives gepanzertes Transportfahrzeug mit eigenständiger neutraler Lackierung, keine realen Firmenlogos. Es fährt sichtbar über vordefinierte Route im Hafen statt einfach beim Spieler zu spawnen. Kurze Anzeige/Kamerafahrt zeigt Eintreffen. Die fiktive Überfallaktion nutzt abstrahierte Trigger ohne realistische technische Anleitung zu Raubverbrechen.

### 16.9 Überfall und Kampf

Transport wird an festgelegtem Missionsbereich durch geskriptetes fiktionales Ereignis gestoppt. Drei bewaffnete Sicherheitsgegner erscheinen, nutzen gemeinsame Gegner-KI, Deckung zwischen Containern, niedrigen Mauern und Fahrzeugen, schießen, laden nach, reagieren auf Treffer. Spieler übersteht begrenzten Kampf. Bei Niederlage Checkpoint-Neustart. Die Szene soll räumlich sinnvoll sein und Fahrzeug-/Spielerkollision nutzen.

### 16.10 Fracht

Nach besiegten Gegnern E-Interaktion am Transporter, drei Sekunden Aufnahme einer Frachtbox. Sie erhält eindeutige Missionsitem-ID, wird dem Spielerzustand zugeordnet, Meldung „Ladung gesichert.“ Sofort schwere gemeldete Straftat und Fahndung mindestens Stufe 3, echte Polizeifunk-Reaktion. Kein unmittelbarer Geldgewinn vor Abgabe.

### 16.11 Flucht vom Hafen

Ziel „Entkomme aus dem Hafengebiet.“ Spieler läuft zu tatsächlich geparktem Fluchtwagen, steigt ein, Polizei kommt über Straßennetz. Mindestens drei mögliche Wege: Hauptstraße, South Harbor Bridge, alternative Industrieachse. Keine erzwungene Linie, keine unüberwindbare unsichtbare Missionswand. Verkehr, Fahrzeuge, Schäden und Kamera funktionieren wie im Free Roam.

### 16.12 Polizei abhängen

Außerhalb des Hafens Ziel „Schüttle die Polizei ab.“ Nur globales PoliceManager-Ereignis POLICE_SEARCH_ENDED löst Abschluss aus, nicht bloßer Timer trotz Sichtkontakt. Spieler kann Abbiegen, Verstecken, unbeobachteten Fahrzeugwechsel und Entfernung nutzen. Mission muss bei Übergang vom Fahrzeug zur Fußflucht stabil bleiben.

### 16.13 Abgabe

Nach Fahndungsende GPS-Marker zu abgelegener Garage in Westhaven. Fahrzeug in Zone, Frachtinteraktion, Marcus erscheint. Dialog:
Marcus: „Du hast es tatsächlich geschafft.“
Alex: „Dein Optimismus ist wirklich inspirierend.“
Marcus: „Ich hab dir doch gesagt, das lohnt sich.“
Alex: „Beim nächsten Mal sagst du mir vorher, wie viele Polizeiautos dazugehören.“
Marcus: „Beim nächsten Mal? Gefällt mir.“
Anschließend THE HARBOR JOB COMPLETED und +18.000 $. Belohnung genau einmal, freie Welt bleibt offen, kein Game-Over.

### 16.14 Fehler und Checkpoints

Fehlschlag bei endgültiger Kampfunfähigkeit, unzugänglicher zwingender Fracht, fatalem Missions-NPC-Verlust oder kritischem Missionsfahrzeugfehler. Checkpoints nach Erkundung, Fluchtfahrzeug, Überfallbeginn, Fracht, Hafenausfahrt, Fahndungsverlust. Wiederherstellen aller benötigten NPCs/Fahrzeuge ohne Duplikation, Geld nur am echten Ende. Checkpoints persistent oder innerhalb der Mission wiederladbar. Marker Orange, weltweite 3D-Indikatoren dezent, Zieltext oben. Mission soll dramaturgisch ein Abenteuer mit Anfang, Vorbereitung, Krise, Flucht und Belohnung sein.

## KAPITEL 17 – DYNAMISCHE WELTEREIGNISSE

### 17.1 System

Open World braucht spontane Ereignisse auch ohne Mission. Ereignisse besitzen ID, gültige Bezirke, Spawn-Bedingungen, Spieler-Mindestabstand, Dauer, NPCs, Fahrzeuge, Ausgänge und Aufräumregeln. Nicht mitten im Meer, nicht durch Gebäude, nicht bei kritischer Mission. Im Durchschnitt höchstens alle sechs bis zehn Spielminuten ein größeres lokales Ereignis, maximal zwei gleichzeitig in der aktiven Umgebung. Erstellt nicht fortlaufend unendlich viele Fahrzeuge.

### 17.2 Verkehrsunfall

Zwei sichtbar beschädigte Fahrzeuge am Straßenrand, Fahrer stehen daneben, Passanten betrachten Szene, Verkehr verlangsamt. Nach Ablauf kontrollierte Aufräumlogik. Wenn Spieler ein Fahrzeug übernommen hat, nicht despawnen. Schäden und stehender Verkehr müssen mit bestehenden Systemen übereinstimmen.

### 17.3 Polizeikontrolle

Eine Streife hinter zivilem Fahrzeug, zwei NPCs im Gespräch, gelegentlich Warnblinker und Umgebungsreaktionen. Spieler kann vorbeifahren und Situation beobachten. Es muss kein kompliziertes Dialogmenü sein; Welt soll glaubwürdig wirken.

### 17.4 Fliehender Verdächtiger

Ein NPC kann von Polizei verfolgt werden, über vorhandene Straßen-/Fußwege. Polizei verfolgt nicht automatisch Alex. Eingreifen des Spielers kann über allgemeine Ereignisse neue Reaktionen auslösen. Nur an geeigneten Stellen; keine Fahrzeugkollisionen direkt im Spieler-Spawn.

### 17.5 Panne

Am Straßenrand steht Fahrzeug mit geöffneter Motorhaube und wartendem NPC. E-Interaktion abstrahiert Hilfe, gibt einmalig 75 $ für Ereignisabschluss. Keine echte Reparaturanleitung. Pannenfahrzeug ist passend geparkt; vorbeifahrender Verkehr weicht aus.

### 17.6 Straßenmusik

An Solace Beach tritt Straßenmusiker auf, spielt eigenes oder lizenziertes kurzes Musikstück, Gruppe NPCs bleibt zeitweise stehen. Spieler kann Trinkgeld geben. Musik und Zuschauer verschwinden nach Ereignisende kontrolliert.

### 17.7 Fahrzeugtreffen

Auf Parkplatz Crown Marina stehen mehrere Sportwagen mit NPCs. Nachts durch Licht atmosphärisch; mindestens ein Fahrzeug verlässt Treffpunkt über echte Verkehrsroute. Wagen unterliegen normalen Fahrzeugdaten und können bei Spielerinteraktion passend reagieren.

### 17.8 Wetter

Bei Regen weniger Strandbesucher, nasse Straßen und Pfützen; in Pine Ridge reduzierte Sicht; bei schwerem Regen eventuell niedrige flache Überflutungsfläche. Ereignisse verwenden denselben Wetterzustand, nicht getrennte Fake-Effekte. Nach Ende Ereignis-Objekte sicher entfernen und bestehende Besitzobjekte respektieren.

## KAPITEL 18 – BENUTZEROBERFLÄCHE UND HUD

### 18.1 Design

Professionelle moderne Game-UI statt Standard-HTML-App. Anthrazit, Weiß, helles Grau, warmes Orangegelb, gedämpftes Grün/Rot für Geld. Montserrat bevorzugt bei verfügbarer Lizenz, sonst vergleichbare klare Schrift. Dezent transparente dunkle Flächen, saubere Typografie und Hierarchie, klare Zustände und präzise Abstände. Keine generischen riesigen Webbuttons, grellen Gradients, ungeordneten Menüs. 16:9 bei 1080p Referenz, responsive auf anderen Desktopgrößen.

### 18.2 Hauptmenü

Im Hintergrund atmosphärische Ansicht der Stadt am späten Nachmittag mit langsamer Kamerabewegung. Großes Logo PROJECT SUNSET. Menüpunkte NEUES SPIEL, SPIEL LADEN, EINSTELLUNGEN, STEUERUNG, CREDITS. Orangegelber Aktivauswahlzustand, alle Buttons tatsächlich verbunden. Credits ohne erfundene reale Mitarbeiter oder Lizenzen.

### 18.3 Neuer Spielstart

Loading-Screen mit Projektname und echtem Fortschritt, dann Alex im Northgate-Apartment um 08:30. Kurze Steuerungseinblendung statt langer Zwangstutorials. Spieler kann schnell laufen und Apartment verlassen.

### 18.4 HUD-Layout

Unten links Minimap + Gesundheit/Ausdauer, unten rechts Waffe/Munition bzw. Fahrzeuggeschwindigkeit/Tank, oben rechts Geld/Fahndung, oben Mitte Missionsziel, zentral dezentes Fadenkreuz bei Zielmodus, rechts Mitte Interaktionshinweis, links Mitte Ereignis-/Geldmeldungen. HUD überdeckt Welt nicht unnötig. Lesbare Skalierung und keine Überlagerungen.

### 18.5 Minimap

Geografisch korrekte Straßen/Küsten/POIs, Spieler in Mitte, Richtungsindikator, Kameraausrichtung oder optional fix Nord. Radius ca. 180 m, bei Fahrzeuggeschwindigkeit etwas weiter zoomen. Anzeigen Spieler, Ziel, Besitzwagen, Geschäfte, Casino, Garage, Werkstatt, Aktivitäten, relevante Polizei. Keine Anzeige sämtlicher Dekogegenstände. Symbole und Rotationsrichtung konsistent.

### 18.6 Status und Munition

Gesundheit 0–100 als schlanke helle Leiste, bei Gefahr rot. Ausdauer darunter, bei Nutzung stärker eingeblendet, bei Erschöpfung Hinweis. Waffensymbol, Name beim Wechsel und Munition als Magazin / Reserve z. B. 15 / 90. Wirklicher Waffenzustand, nicht hardcodierter UI-Wert.

### 18.7 Fahrzeug-HUD

Geschwindigkeit km/h, Gang/Fahrtrichtung, Kraftstoff, Fahrzeugzustand, optional Drehzahl. Kompakt unten rechts, nicht übergroßer Racing-Tacho. Wechsel beim Einsteigen/Aussteigen sauber. Fahrtwerte aus tatsächlichem Fahrzeug-Physics-State.

### 18.8 Missions- und Interaktionshinweise

Oben Mitte kleines Feld mit Titel THE HARBOR JOB und aktuellem Ziel, bei Wechsel kurz aufleuchten. Interaktion E – TÜR ÖFFNEN, E – MIT VERKÄUFER SPRECHEN, F – FAHRZEUG BETRETEN, E – BLACKJACK SPIELEN, E – WERKSTATT NUTZEN, abhängig vom Zustand. Keine falschen Aufforderungen bei verriegelten oder zu weit entfernten Objekten.

### 18.9 Benachrichtigungen

Typ, Icon, Dauer, Priorität. „+250–Lieferungabgeschlossen“,„-500 – Fahrzeuglackierung“, „Neues Missionsziel verfügbar“, „Polizei alarmiert“, „Tank fast leer“. Kurze Anzeige ca. 3,5 Sekunden, kleine Fläche, Priorisierung wichtiger Meldungen. Nicht zehn gleichzeitig stapeln. Zuverlässig auch nach World Streaming.

### 18.10 Pause

Abgedunkelter Hintergrund, FORTSETZEN, KARTE, INVENTAR, EINSTELLUNGEN, SPIEL SPEICHERN, HAUPTMENÜ. ESC schließt. Singleplayer pausiert Physik und KI. Beim Öffnen keine weiterlaufenden Eingabewerte. Bestätigungen bei Speichern/Verlassen sinnvoll.

### 18.11 Weltkarte und GPS

Karte zeigt reale Küsten, Straßen, Highways, Bezirke, POIs, Spieler, Ziele; per Maus verschieben, Rad zoomen, Klick Marker setzen. Route mit Pfadfindung über echten RoadNetwork-Graph, Fußgängerrouten bei Fußmodus separat. Orange Route auf Minimap; bei falscher Abzweigung neu berechnen ohne Standbild. Marker kann wieder entfernt werden.

### 18.12 Inventar

Zweispaltig mit Kategorien Verbrauchsgüter, Waffen, Munition, Missionsgegenstände, Schlüssel/Zugang. Objektname, Symbol, Zahl, Text, optional Verkaufspreis/Verwendung. Verbrauch verringert echte Menge und ändert Spielerzustand. Bei 0 Bestand Button nicht ausführbar.

### 18.13 Fahrzeugmenüs

Modell, Klasse, Kaufpreis, Speed, Beschleunigung, Zustand, Tank, Besitzerstatus und Upgrades. Werte aus realen Fahrzeugdaten, inklusive Tuning. Kauf- und Werkstattmenüs sind unterschiedlich, aber stilistisch einheitlich. Rendern von Fahrzeugvorschau nur, wenn es zuverlässig funktioniert.

### 18.14 Einstellungen

Master/Musik/Effekte, Maus-Sensitivität, Kamerainvertierung, Grafikqualität, Renderauflösung, Bewegungsunschärfe, Kamerawackeln reduzieren, Nordausrichtung Minimap, Untertitel. Persistenz nach Neustart. Änderungen wirken unmittelbar, soweit technisch möglich.

## KAPITEL 19 – SMARTPHONE UND SPIELERKOMMUNIKATION

### 19.1 Oberfläche

H öffnet ein vertikales Smartphone rechts im Bild. Modernes dunkles UI mit passenden App-Icons; normale Steuerung während Bedienung eingeschränkt, Welt nicht zwingend komplett pausiert. H oder ESC schließt korrekt. Keine Browserstandard-Formulare. Bedienung per Maus.

### 19.2 Apps

Messages: Missionskommunikation; Map: Weltkarte; Garage: Besitzfahrzeuge; Bank: Geld und Transaktionen; Activities: Aktivitäten; Contacts: wichtige Figuren/Dienste; Settings: Einstellungen. Jede App öffnet wirklich eine Seite und hat passende Daten. Keine optischen, funktionslosen App-Symbole.

### 19.3 Nachrichten

Marcus besitzt eigenen Nachrichtenverlauf; neue Missionsnachrichten werden bei Fortschritt freigegeben und bleiben lesbar. Gelesen-/Ungelesenstatus korrekt, Scrollen, Absender und Zeit. Neue Nachricht erzeugt kleine Benachrichtigung, verschwindet nach Sekunden; eigentlicher Inhalt bleibt. Bei intensivem Kampf dezente Anzeige.

### 19.4 Kontakte

Marcus Reed (Mission), Westhaven Motors (Autos), AutoFix (Werkstatt), Crown Casino (Info), Sunset Dispatch (Lieferung/Taxi). Kontaktaktion öffnet passende Informationen oder verfügbare Spieloption. Kein fiktives echtes Telefonsystem nötig.

### 19.5 Bank

Bargeld, Bankkonto, Gesamtvermögen, letzte Transaktionen. An Geldautomaten Transfer zwischen Bargeld und Konto mit exakter Belastung/Gutschrift. Keine Überweisung bei negativer/ungültiger Eingabe, kein Geld-Duplikat. Garage-App zeigt Modell, Zustand, Ort und Garagenzuordnung; beliebige Teleport-Rückholung verboten, nur Service an gültigem Parkplatz und bei Bedarf mit Kosten.

## KAPITEL 20 – WETTER, TAGESZEITEN UND ATMOSPHÄRE

### 20.1 Weltzeit

Ein Ingame-Tag dauert 96 reale Minuten; eine reale Minute entspricht 15 Ingame-Minuten. 05–07 Morgendämmerung, 07–11 Vormittag, 11–16 Tageslicht, 16–19 Nachmittag/Abend, 19–21 Dämmerung, 21–05 Nacht. Kontinuierliche Sonnenbewegung, Schattenrichtung passt zur Himmelsposition, keine abrupten Lichtwechsel. Schlafen im Apartment überspringt sechs oder acht Stunden und aktualisiert Weltzustände.

### 20.2 Licht und Himmel

Gerichtetes Sonnenlicht mit wärmerem Morgen/Abend und neutralerem Mittag. Nachts Himmels- und künstliches Licht. Dynamischer Himmel mit Blau, Wolken, warmem Sonnenuntergang, Dämmerung und Stern-/Nachthimmel. Wolken ziehen langsam, es sei denn Unwetter. Himmel, Sonne und Schatten müssen derselben Tageszeit entsprechen.

### 20.3 Wettertypen

CLEAR, PARTLY_CLOUDY, OVERCAST, RAIN, THUNDERSTORM. Langfristige Gewichte: 35 % klar, 30 % teilweise bewölkt, 18 % bedeckt, 12 % Regen, 5 % Gewitter. Wetterphasen mit sinnvoller Mindestdauer und weichen Übergängen. Nicht alle paar Sekunden ein anderer Zustand. Weltweite Wetterdaten zentral verfügbar für Rendering, KI, Traktion und Audio.

### 20.4 Regen

Performante Regenpartikel im Kamerabereich, Richtung überwiegend nach unten, bei Wind geneigt. Gleichzeitig nasse Straßen mit höherem Glanz, Reflexionen, Pfützen, Regenklang, geänderte Sicht, Fahrzeughandling und Passantenverteilung. Nicht bloß ein Regentropfenfilter vor der Kamera. Je nach Intensität dichterer Regen und weniger Strandbesucher.

### 20.5 Nassmaterialien und Pfützen

Asphalt bei Regen mit reduzierter Rauheit und kontrolliertem Lichtreflex. Wenn SSR zu teuer, alternative Reflexionslösung. Pfützen vor allem auf alten Nebenstraßen, Industriehöfen, niedrigen Parkflächen und Randbereichen; keine perfekt runden Wasserflecken auf steilen Hängen. Nach Regen langsame Abtrocknung, bei Regenstart Zunahme.

### 20.6 Gewitter

Kräftiger Regen, Wind, gelegentliche Blitze mit kurzer Helligkeitsänderung, Donner mit plausibler Verzögerung. Blitze nicht permanent. Vegetation bewegt sich stärker, Verkehr reagiert vorsichtiger. Gewitter darf nicht zu gefährlich flackernder unkontrollierter Beleuchtung führen.

### 20.7 Wind

Zentraler Windwert beeinflusst Palmen, Bäume, Sträucher, Gras und Regen; dezente Shaderbewegung ausreichend. Bei normalem Wetter geringe Bewegung, bei Sturm stärker. Bäume sollen sich nicht wie starre ganze Objekte rhythmisch rotieren.

### 20.8 Nachtaktivität

Bei Dämmerung Straßenlampen einschalten, Innenstadtfenster teils an, Wohnfenster weniger, Casino besonders hell. Fahrzeugbeleuchtung bei Nacht und Regen, Bremslichter weiter erkennbar. NPC-Tagesabläufe, Geschäftsöffnungszeiten und Tourismus-/Nachtleben-Nachfrage folgen der Uhr. Keine reine Verdunklung der gesamten Szene.

### 20.9 Qualitätsstufen

Low weniger Partikel und Reflexionen, High mehr, gleiche Wetterregeln. Gameplaytraktion darf nicht von der Grafikeinstellung abhängen. Wetterübergänge müssen Speicher/Performance stabil lassen. Nach zehn Wetterwechseln keine alten Regenpartikel-/Audioquellen ansammeln.

## KAPITEL 21 – AUDIO, MUSIK UND SOUNDDESIGN

### 21.1 Grundkonzept

Alle wichtigen Geräusche räumlich und spielzustandsabhängig. Nicht jedes Geräusch direkt mit gleicher Lautstärke an der Kamera. Fahrzeug, NPC, Sirene, Schuss, Kollision, Maschinen, Wasser, Casino und Umgebung mit Positionsbezug und Entfernungskurve. Audiokanal darf beim World Streaming keine alten Quellen in entfernten Regionen unbemerkt weiter abspielen.

### 21.2 Audio-Busse

Getrennte Gruppen MASTER, MUSIC, AMBIENCE, VEHICLES, COMBAT, UI, DIALOGUE. Jede Gruppe in Einstellungen regelbar, MASTER skaliert alle. Deaktivierung von Musik darf Fahrzeugklang nicht stummschalten. Wechsel ins Casino mischt Außenatmosphäre weich aus, nicht mit hörbarem harten Schnitt.

### 21.3 Stadtteilklänge

Downtown: Reifen, Verkehr, entfernte Hupen, Gespräche, Stadtgeräusche. Beach: Wellen, Möwen, Wind, Strandatmosphäre. Crown Marina: Wasser, entfernte Musik, Besucher. Northgate: moderater Verkehr, alltägliche Wohnstraßengeräusche. Westhaven: ruhigere Wohngebiete, Wind/Vögel. Iron Docks: Maschinen, Metall, Container, tiefe Industrietöne. Pine Ridge: Wind, Blätter, Vogelrufe. Cedar Plains: Natur und vereinzelte Fahrzeuge. Blackwater Marsh: Insekten, Wasser, entfernte Tiere. Regionale Klangmischung über Entfernungen weich ausblenden.

### 21.4 Fußschritte

Oberflächen Asphalt, Beton, Holz, Sand, Gras, Schotter, Innenraumboden. Unterschiedlicher Klang und Schrittintervall je Gehen, Joggen, Sprinten und Ducken. Schrittgeräusche möglichst mit Animationskontakten synchron. Keine Maschinengewehr-artigen Schrittgeräusche bei niedriger Geschwindigkeit.

### 21.5 Fahrzeuge

Motorstart, Leerlauf, steigende Last/Drehzahl, Schalten, Reifengeräusche, Bremsen, Quietschen, Aufprall, Türen, Hupe, Schäden. Separate Klangprofile Kleinwagen/Sport/Lkw/Motorrad. Bei Geschwindigkeit geeignete Mischung; Scheinwerfer ohne Motorgeräusch bei ausgeschaltetem Antrieb zulässig. Polizeisirene mit räumlicher Lautstärke und optional Doppler, bei Entfernen leiser.

### 21.6 Polizei und Kampf

Funkmeldungen als separate Kategorie, Trigger durch echte Zustände. Schüsse mit Waffentyp, Einschläge für Metall/Beton/Holz, Nachladen, leeres Magazin, Explosionen. Entfernte Schüsse deutlich leiser/gedämpfter. Explosion in 100 Metern darf nicht dieselbe Stärke wie direkt vor Alex haben. Sirenenkaskaden begrenzen, sodass fünf Polizeiautos keinen unerträglichen Klang erzeugen.

### 21.7 Casino

Im Casino leise atmosphärische Musik, Stimmen und Slot-Geräusche. Blackjack: Karten, Chips, leiser Gewinn-/Verlustsound. Roulette: Rad, Kugel, Chipsetzung, Ergebnis. Slots: Start/Stop der fünf Walzen, Treffer, Gewinn. Keine permanent maximal lauten Jackpot-Sounds. Die tatsächlichen Aktionen bestimmen die Audioereignisse.

### 21.8 Musikzustände

Exploration ruhige atmosphärische Musik, Pursuit spannender Beat/Spannung bei Polizei, Mission stärkere Musik während Phasen. Weiche Übergänge. Nur selbst erstellte, frei verwendbare oder korrekt lizenzierte Audiostücke. Keine Musik aus GTA, bekannten Filmen oder kommerziellen Spielen. Wenn Musik nicht beschafft werden kann, eher deaktivieren als gefälschte lizenzierte Dateien vorgeben.

### 21.9 UI

Menüfokus dezentes Signal, Bestätigung etwas deutlicher, Fehler eigener kurzer Ton, Geldbuchung leise Rückmeldung, Mission neuer Hinweis. Priorisierung wichtiger Sounds, Voice-Limit, Sound-Pooling, keine Audioquellenlecks. Audio reagiert auf Pause und Tabfokus richtig.

## KAPITEL 22 – ASSET-PRODUKTION, MODELLE UND MATERIALIEN

### 22.1 Assets statt Platzhalter

Grafikqualität hängt von tatsächlichen Assets ab. Prüfe verfügbare Werkzeuge und legal nutzbare Modellbibliotheken. Wenn geeignete Modelle vorliegen, verwende sie inklusive Lizenzkontrolle. Andernfalls eigene prozedurale Modelle mit differenzierter Form, Details und Materialien erzeugen. Prozedurale Geometrie ist erlaubt, aber keine Welt ausschließlich aus Quadern und Zylindern ohne erkennbare Gestaltung. Nenne keine erfundenen Assetquellen.

### 22.2 Rechte

Nur eigene oder korrekt lizenzierte Assets. Bei externen Downloads Quelle, Name, Lizenz, ggf. Attribution und Nutzung dokumentieren. Keine Ripps kommerzieller Spiele, keine echten Automarkenlogos, keine geschützten Charaktere, keine unlizenzierte Musik. Bei rechtlichem/technischem Hindernis eigenständiges alternatives Objekt bauen.

### 22.3 Fahrzeugteile

Jedes Fahrzeug sichtbar aus Karosserie, Fenstern, Front-/Heckscheibe, vier Rädern (Motorrad zwei), Felgen, Frontlichtern, Rücklichtern, Spiegeln, Grill, Stoßstangen,
