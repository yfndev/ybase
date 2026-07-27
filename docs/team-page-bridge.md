# ybase → yfn-landing Team-Page-Bridge

## Ziel

ybase wird die fachliche Single Source of Truth für:

- aktive und öffentlich sichtbare Teammitglieder,
- Department- und Teamnamen,
- die Zuordnung von Mitgliedern zu Teams,
- öffentliche Rollen und Team-Leads,
- Vorstandsrollen,
- die Reihenfolge auf der Team-Seite.

Payload bleibt für redaktionelle Inhalte und Darstellung zuständig, zum Beispiel
Überschriften, Gruppenbild und Layout. Personelle Daten sollen nach der Migration
nicht mehr parallel in Payload gepflegt werden.

## Ausgangslage

### ybase

ybase modelliert bereits:

- `Department`: Name, Organisation und Archivstatus,
- `Team`: Name, Department, Organisation und Archivstatus,
- `User`: Name, `teamId`, `positionTitle`, Mitgliedsstatus und
  Onboarding-Status.

Die bestehende API für veröffentlichte Stellenanzeigen zeigt bereits das
geeignete Integrationsmuster:

- organisationsgebundener, gehashter Bearer-Token,
- versionierter Read-Endpunkt unter `/api/v1`,
- explizite Projektion und Transformation der internen Daten in einen
  öffentlichen DTO,
- keine direkte Freigabe der MongoDB-Modelle.

### yfn-landing

Die Organisationsstruktur liegt aktuell direkt im Payload-Seitenblock
`orgaStructure`:

- `departments.groups` entspricht fachlich den ybase-Departments,
- ein Element in `group.departments` ist trotz des Namens eine Team-Karte und
  entspricht fachlich einem ybase-Team,
- `members` entspricht den ybase-Mitgliedern,
- `board.members` wird separat gepflegt.

Das aktuelle Frontend benötigt für normale Mitglieder nur Name und Lead-Status.
Für den Vorstand benötigt es Ressort, Name und Vorsitz-Status.

Die Landingpage bindet an anderer Stelle bereits öffentliche Community-Profile
von `member.youngfounders.network` ein. Diese Profile sind fachlich nicht der
interne Vereins-/Team-Bestand und sollten nicht mit der neuen Bridge vermischt
werden.

## Architekturentscheidung

### Empfohlen: Pull-Feed mit Cache und gezielter Invalidierung

```text
P&C bearbeitet ybase
        |
        v
ybase MongoDB
        |
        | GET /api/v1/team-directory
        | Authorization: Bearer <read-only token>
        v
yfn-landing Server
        |
        | Next.js Data Cache, z. B. 5 Minuten
        v
Team-Seite

Nach erfolgreicher Änderung in ybase:
ybase --signierter Revalidate-Request--> yfn-landing --revalidateTag--> frische Daten
```

Die Landingpage liest den Feed ausschließlich serverseitig. Der Token gelangt
weder in den Browser noch in das gerenderte HTML.

Vorteile:

- keine zweite editierbare Kopie des Team-Bestands,
- keine Payload-Upserts, Konflikte oder verwaisten Datensätze,
- Änderungen sind nach Cache-Invalidierung nahezu sofort sichtbar,
- die Landingpage kann bei einer kurzen ybase-Störung den letzten erfolgreichen
  Cache-Stand weiter ausliefern,
- Payload bleibt für Content zuständig, ybase für Organisationsdaten.

### Nicht empfohlen: ybase schreibt Teamdaten in Payload

Ein Push-Sync in eine Payload-Collection ist nur sinnvoll, wenn Redakteur:innen
die importierten Datensätze in Payload nachbearbeiten müssen. Das würde jedoch
eine zweite Datenhoheit, Merge-Regeln, Löschsemantik und Drift-Erkennung
erfordern. Für die aktuelle Team-Seite ist dieser zusätzliche Zustand nicht
notwendig.

## Ziel-Datenmodell in ybase

Die internen Berechtigungsrollen (`admin`, `finance`, `people_culture`,
`member`) dürfen nicht als öffentliche Teamrollen verwendet werden.

Für einen risikoarmen ersten Schritt können die bestehenden Kernfelder
weiterverwendet werden:

- `User.teamId`: primäres Team,
- `User.positionTitle`: öffentlich dargestellte Rolle,
- `User.memberStatus`: nur `active` ist grundsätzlich veröffentlichbar,
- `Department.isArchived` und `Team.isArchived`: archivierte Einheiten werden
  nicht veröffentlicht.

Ergänzt werden sollten explizite Veröffentlichungsfelder:

```ts
interface PublicTeamProfile {
  isPublished: boolean;
  displayName?: string;
  role?: string;
  isTeamLead: boolean;
  sortOrder: number;
  board?: {
    role: string;
    isChair: boolean;
    sortOrder: number;
  };
}
```

Das Profil kann in Phase 1 als eingebettetes Feld am `User` liegen. Es trennt
öffentliche Freigaben von Login-, Finance- und P&C-Daten. `displayName` und
`role` sind optionale öffentliche Overrides; ohne Override werden `name` und
`positionTitle` verwendet.

Diese pragmatische Ablage setzt voraus, dass jedes offizielle Teammitglied ein
ybase-`User`-Profil besitzt. Falls ybase künftig Vereinsmitglieder schon vor
ihrem ersten Login verwalten soll, muss die fachliche `Member`-Entität vom
Auth-`User` getrennt und nur optional mit einem Login verknüpft werden.

Zusätzlich:

```ts
Department.websiteSortOrder: number
Team.websiteSortOrder: number
```

Wichtige Regeln:

- `isPublished` ist standardmäßig `false` (Opt-in).
- Veröffentlichbar ist nur, wer `memberStatus === "active"` ist.
- Ein archiviertes Department oder Team erscheint nicht im Feed.
- Der Feed enthält niemals E-Mail, Telefon, Bankdaten, interne Rolle,
  Bewerbungs-ID oder Onboarding-Daten.
- Ein fehlender Name, ein fehlendes aktives Team oder eine fehlende öffentliche
  Rolle verhindert die Veröffentlichung und wird in ybase als
  Validierungsfehler angezeigt.
- Eine Vorstandsrolle kann zusätzlich zur normalen Teamzuordnung bestehen.

### Spätere Erweiterung

Wenn Mitglieder künftig gleichzeitig mehreren Teams angehören sollen, sollte
`User.teamId` nicht mit Sonderfällen überladen werden. Dann empfiehlt sich eine
eigene `memberAssignments`-Collection mit `userId`, `teamId`, Rolle,
Lead-Status, Gültigkeitszeitraum und Sortierung. Diese Normalisierung ist für
den ersten Bridge-Release nicht erforderlich.

## Feed-Vertrag

Endpunkt:

```http
GET /api/v1/team-directory
Authorization: Bearer ybase_team_<secret>
```

Beispiel:

```json
{
  "version": "v1",
  "generatedAt": "2026-07-27T12:00:00.000Z",
  "revision": "sha256-of-response",
  "data": {
    "board": [
      {
        "id": "ybase:org_1:member:user_1",
        "name": "Erika Beispiel",
        "role": "Tech",
        "isChair": false,
        "sortOrder": 20
      }
    ],
    "departments": [
      {
        "id": "ybase:org_1:department:dep_1",
        "name": "Operations",
        "sortOrder": 20,
        "teams": [
          {
            "id": "ybase:org_1:team:team_1",
            "name": "People & Culture",
            "sortOrder": 10,
            "members": [
              {
                "id": "ybase:org_1:member:user_2",
                "name": "Max Beispiel",
                "role": "People Lead",
                "isLead": true,
                "sortOrder": 10
              }
            ]
          }
        ]
      }
    ]
  }
}
```

Der Vertrag ist unabhängig von den internen MongoDB-Typen. Felder werden in v1
nur additiv ergänzt; Breaking Changes erhalten einen neuen Endpunkt oder eine
neue Version.

Zusätzliche HTTP-Eigenschaften:

- Bearer-Token mit eigener Berechtigung `team-directory:read`,
- Token nur gehasht in ybase speichern und separat vom Job-Feed rotieren,
- `ETag` aus `revision` unterstützen,
- kurze Timeouts auf der Landingpage,
- strukturierte Fehler ohne interne Daten,
- Rate Limit als zusätzlicher Schutz, nicht als primäre Authentifizierung.

## Änderungen in ybase

### 1. Modell und Pflegeoberfläche

- Öffentliche Profilfelder am Mitglied ergänzen.
- Sortierreihenfolge an Departments und Teams ergänzen.
- Im Member-Drawer einen klar abgegrenzten Bereich
  „Öffentliche Team-Seite“ ergänzen.
- Vorschau anzeigen, welche Daten veröffentlicht werden.
- Veröffentlichung nur bei vollständigem, valide zugeordnetem Profil erlauben.
- Änderungen an Veröffentlichungsdaten im bestehenden Audit-Log erfassen.

### 2. Read-Modell

- `getTeamDirectoryV1(organizationId)` implementieren.
- Ausschließlich erlaubte Felder per MongoDB-Projektion lesen.
- Departments, Teams und Mitglieder deterministisch sortieren.
- Stabile, namespaced IDs wie beim Job-Feed ausgeben.
- Leere Teams standardmäßig nicht ausgeben.
- Unit-Tests für Filterung, Sortierung, Archivierung und Datenschutz ergänzen.

### 3. Authentifizierung

- Eigene `teamDirectoryTokens`-Collection oder ein generalisiertes,
  gescoptes `integrationTokens`-Modell anlegen.
- Für den ersten Release ist eine eigene Collection analog zu
  `jobFeedTokens` risikoärmer.
- Rotations-Endpunkt und Admin-Oberfläche bereitstellen.
- Den Klartext-Token nur unmittelbar nach Rotation anzeigen.

### 4. Cache-Invalidierung

Nach erfolgreichen Mutationen an:

- öffentlichem Mitgliedsprofil,
- Mitgliedsstatus,
- Teamzuordnung oder Position,
- Teamname/Archivstatus/Sortierung,
- Departmentname/Archivstatus/Sortierung

wird ein signierter Revalidate-Request an yfn-landing gesendet.

Die Datenbankänderung darf nicht zurückgerollt werden, wenn die Invalidierung
fehlschlägt. Stattdessen:

- Fehler loggen,
- wenige Male mit Backoff wiederholen,
- als Sicherheitsnetz bleibt die zeitbasierte Revalidierung aktiv.

Für den MVP kann die Bridge zunächst nur mit einer kurzen zeitbasierten
Revalidierung starten; der Webhook folgt anschließend.

## Änderungen in yfn-landing

### 1. Server-only Client

- `YBASE_TEAM_DIRECTORY_URL` und `YBASE_TEAM_DIRECTORY_TOKEN` als
  Server-Umgebungsvariablen einführen.
- Einen typisierten Client mit Schema-Validierung, Timeout und aussagekräftigem
  Logging implementieren.
- Fetch über einen dedizierten Next.js Cache-Tag, zum Beispiel
  `ybase-team-directory`.
- Secrets niemals über `NEXT_PUBLIC_*` konfigurieren.

### 2. Payload-Block trennen

Der `orgaStructure`-Block behält redaktionelle Felder:

- Eyebrow,
- Titel und Highlight,
- Gruppenbild,
- Abschnittsüberschriften,
- optional Layout-Einstellungen wie die Spaltenzahl.

Die Arrays für Vorstand, Departments, Teams und Mitglieder werden im
`ybase`-Modus nicht mehr redaktionell gepflegt. Für die Migration kann ein
temporäres Feld `dataSource: "manual" | "ybase"` eingeführt werden:

1. bestehende Seite bleibt zunächst auf `manual`,
2. ybase-Daten werden vollständig gepflegt und in einer Preview geprüft,
3. die Seite wird einmalig auf `ybase` umgestellt,
4. nach erfolgreicher Stabilisierungsphase wird der manuelle Modus entfernt.

Layout-Metadaten dürfen nicht über Namen mit den ybase-Daten verknüpft werden.
Falls individuelle Spaltenzahlen pro Department nötig bleiben, werden stabile
ybase-Department-IDs als Schlüssel gespeichert.

### 3. Rendering

- `Department` aus dem Feed auf die bestehende `Group`-Darstellung abbilden.
- `Team` auf die bestehende Team-Karte abbilden.
- Rolle zusätzlich zum Namen darstellen; `isLead` steuert weiterhin das
  Lead-Badge.
- Vorstandsdaten auf den bestehenden `BoardCircle` abbilden.
- Bei ungültiger Live-Antwort den letzten gültigen Cache-Stand verwenden.
- Ohne vorhandenen Cache eine kontrollierte, beobachtbare Fehlerdarstellung
  rendern; keine leere Team-Seite als scheinbar erfolgreicher Zustand.

### 4. Revalidate-Endpunkt

- Internen POST-Endpunkt anlegen.
- Request per HMAC oder starkem getrennten Secret verifizieren.
- Cache-Tag und betroffenen Team-Seitenpfad invalidieren.
- Wiederholte Events idempotent behandeln.

## Migration und Rollout

### Phase 0 – Daten- und Produktentscheidungen

- Festlegen, ob `positionTitle` automatisch die öffentliche Rolle ist oder
  explizit freigegeben/überschrieben werden muss.
- Festlegen, wer `isPublished`, Lead-, Board- und Sortierfelder bearbeiten darf.
- Datenschutzfreigabe für die Namensveröffentlichung dokumentieren.
- Klären, ob leere Teams sichtbar sein sollen.
- Prüfen, ob wirklich jedes zu veröffentlichende Vereinsmitglied bereits ein
  ybase-Loginprofil besitzt; andernfalls `Member` und Auth-`User` vor der Bridge
  entkoppeln.

### Phase 1 – ybase als publizierbare Datenquelle

- Modell, UI, Validierung und Audit-Logs ergänzen.
- Bestehende Payload-Daten einmalig nach ybase übertragen.
- P&C prüft die vollständige Vorschau.

Ergebnis: ybase enthält den vollständigen, freigegebenen Team-Bestand, ohne
dass die öffentliche Seite bereits umgestellt ist.

### Phase 2 – Feed und Landing-Integration

- Read-only Token und v1-Feed implementieren.
- Server-Client und ybase-Modus in yfn-landing implementieren.
- Contract-, Integrations- und Rendering-Tests ergänzen.
- In Staging mit Produktionskopie der Struktur testen.

Ergebnis: Die Team-Seite kann kontrolliert zwischen manuell und ybase wechseln.

### Phase 3 – Cutover

- Letzten Datenvergleich zwischen Payload und Feed durchführen.
- Payload-Seite auf `dataSource: "ybase"` umstellen.
- Smoke-Test auf Desktop und Mobile.
- Logs, Antwortzeit und Feed-Fehler mindestens einige Tage beobachten.
- Während dieser Zeit dient der manuelle Stand nur als unveränderte
  Rollback-Option.

### Phase 4 – Single Source of Truth erzwingen

- Manuelle Personen-, Team- und Department-Felder aus dem Block entfernen.
- Veraltete Payload-Daten per Migration löschen.
- Cache-Invalidierungs-Webhook aktivieren.
- Betriebsdokumentation für Token-Rotation und Störungen ergänzen.

## Tests und Abnahmekriterien

### ybase

- Nur aktive, explizit veröffentlichte Mitglieder werden ausgegeben.
- Offboarden oder Entpublizieren entfernt ein Mitglied aus dem Feed.
- Archivierte Teams und Departments werden mitsamt Unterelementen entfernt.
- Eine Umbenennung erscheint ohne Änderung in Payload.
- Sortierung ist bei identischen Daten deterministisch.
- Kein sensibles `User`-Feld kann im DTO oder Snapshot erscheinen.
- Ungültige und rotierte Tokens werden abgelehnt.

### yfn-landing

- Feed-Daten werden korrekt in Vorstand, Departments, Teams und Mitglieder
  gerendert.
- Rollen und Leads werden korrekt dargestellt.
- Der Token ist in keinem Client-Bundle enthalten.
- Ein Timeout zerstört keinen vorhandenen Cache-Stand.
- Schemafehler werden geloggt und nicht still als leeres Team interpretiert.
- Revalidate-Requests aktualisieren die Seite; ungültige Signaturen nicht.
- Die bisherige Team-Seite bleibt während der Migration als Rollback verfügbar.

### Ende-zu-Ende

Der Cutover ist erfolgreich, wenn eine berechtigte Person in ybase:

1. einen Teamnamen ändert,
2. ein Mitglied einem anderen Team zuordnet,
3. dessen öffentliche Rolle ändert,
4. ein Mitglied entpubliziert,

und alle Änderungen ohne Payload-Edit innerhalb des vereinbarten
Aktualisierungsfensters korrekt auf der öffentlichen Team-Seite erscheinen.

## Empfohlene Arbeitspakete

1. **ybase Public-Team-Modell und UI**
2. **ybase Team-Directory v1 Feed und Token**
3. **yfn-landing Server-Client und Schema**
4. **OrgaStructure ybase-Modus und Rollenanzeige**
5. **Datenmigration, Preview und Cutover**
6. **Webhook, Monitoring und Entfernung des manuellen Modus**

Die Pakete 1 und 3 können nach Festlegung des Feed-Vertrags parallel begonnen
werden. Der Cutover erfolgt erst, wenn Feed, UI und Datenmigration gemeinsam
abgenommen sind.

## Inbetriebnahme

1. ybase deployen und unter **Einstellungen → Organisation** einen neuen
   Team-Seiten-Leseschlüssel erzeugen.
2. In yfn-landing `YBASE_TEAM_DIRECTORY_URL` auf den produktiven
   `/api/v1/team-directory`-Endpunkt setzen und den Leseschlüssel als
   `YBASE_TEAM_DIRECTORY_TOKEN` hinterlegen.
3. Ein separates zufälliges Secret in yfn-landing als
   `YBASE_REVALIDATE_SECRET` und in ybase als
   `YFN_LANDING_REVALIDATE_SECRET` hinterlegen.
4. In ybase `YFN_LANDING_REVALIDATE_URL` auf
   `https://<landing-domain>/api/revalidate/team-directory` setzen.
5. In ybase die gewünschten aktiven Mitglieder unter
   **Team → Mitglied bearbeiten → Öffentliche Team-Seite** freigeben.
6. yfn-landing deployen, im Payload-Block **Orga Struktur** die Datenquelle
   **Automatisch aus ybase** wählen und die Seite veröffentlichen.
7. Rollenänderung, Teamwechsel und Entpublizierung einmal Ende-zu-Ende prüfen.
