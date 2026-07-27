# ybase als Quelle der YFN-Teamseite

## Ziel

ybase ist die einzige Quelle für Mitglieder, Departments, Teams und Rollen auf
der öffentlichen Teamseite. Es gibt keine zusätzlichen Veröffentlichungs- oder
Darstellungseinstellungen pro Mitglied.

Die Synchronisierung verwendet ausschließlich bestehende ybase-Daten:

- `User.name` als Name,
- `User.positionTitle` als Rolle,
- `User.teamId` als Teamzuordnung,
- Team und Department aus der Organisationsstruktur,
- `User.memberStatus` für die Sichtbarkeit.

Alle aktiven Mitglieder mit vollständigem Namen, Position und aktivem Team
werden automatisch ausgegeben. Mitglieder im Onboarding oder mit dem Status
„Inaktiv“ bleiben in ybase bestehen, erscheinen aber nicht im Feed.

Vorstand, Leads oder andere organisatorische Gruppen werden wie jede andere
Struktur über die regulären Departments, Teams und Positionen in ybase
abgebildet. Es gibt dafür keine separaten Felder oder Overrides.

## Architektur

```text
P&C pflegt Mitglied und Organisationsstruktur in ybase
        |
        v
ybase MongoDB
        |
        | GET /api/v1/team-directory
        v
yfn-landing Server
        |
        | Next.js Data Cache, maximal 5 Minuten
        v
öffentliche Teamseite
```

Der Feed enthält ausschließlich Daten, die auf der Teamseite öffentlich
angezeigt werden. Er ist fest auf die über
`YFN_TEAM_DIRECTORY_ORGANIZATION_ID` konfigurierte Organisation begrenzt.
Deshalb sind weder Token noch Webhook- oder Revalidate-Secrets erforderlich.

## Feed-Vertrag

Endpunkt:

```http
GET /api/v1/team-directory
```

Beispiel:

```json
{
  "version": "v1",
  "generatedAt": "2026-07-27T12:00:00.000Z",
  "revision": "sha256...",
  "data": {
    "departments": [
      {
        "id": "ybase:org-id:department:department-id",
        "name": "Operations",
        "teams": [
          {
            "id": "ybase:org-id:team:team-id",
            "name": "People & Culture",
            "members": [
              {
                "id": "ybase:org-id:member:member-id",
                "name": "Ada Beispiel",
                "role": "People Lead"
              }
            ]
          }
        ]
      }
    ]
  }
}
```

Departments, Teams und Mitglieder werden alphabetisch sortiert. Leere Teams
und Departments werden nicht ausgegeben. E-Mail-Adressen, Telefonnummern,
interne Berechtigungsrollen, Bewerbungs- und Finanzdaten sind nie Bestandteil
des DTOs.

Der Endpunkt unterstützt `ETag` und sendet öffentliche Cache-Header. Fehlt die
Organisationskonfiguration, antwortet er mit `503` und `Cache-Control:
no-store`.

## Konfiguration

Es gibt insgesamt nur zwei Variablen:

1. In ybase:

   ```env
   YFN_TEAM_DIRECTORY_ORGANIZATION_ID=<YFN_ORGANIZATION_ID>
   ```

2. In yfn-landing:

   ```env
   YBASE_TEAM_DIRECTORY_URL=https://<ybase-domain>/api/v1/team-directory
   ```

## Rollout

1. Organisations-ID in ybase konfigurieren und ybase deployen.
2. Bei allen aktiven Mitgliedern Name, Position und Teamzuordnung prüfen.
3. Die Feed-URL in yfn-landing konfigurieren und die Landingpage deployen.
4. Im Payload-Block **Orga Struktur** die Datenquelle
   **Automatisch aus ybase** wählen.
5. Rollenänderung, Teamwechsel und Statuswechsel zu **Inaktiv** Ende-zu-Ende
   prüfen. Änderungen erscheinen spätestens nach fünf Minuten.

## Abnahmekriterien

- Alle vollständigen aktiven Mitglieder erscheinen automatisch.
- „Im Onboarding“ und „Inaktiv“ erscheinen nicht.
- Name und Rolle stammen direkt aus dem bestehenden Mitgliedsprofil.
- Team- und Departmentnamen stammen direkt aus der Organisationsstruktur.
- Es existieren keine öffentlichen Profil-Overrides, Website-Sortierfelder,
  Board-/Lead-Felder oder Integrationsoberflächen.
- Der Feed enthält keine sensiblen Mitgliedsdaten.
- Die Landingpage bleibt bei einem kurzfristigen ybase-Ausfall kontrolliert
  verfügbar und versucht den Abruf spätestens nach fünf Minuten erneut.
