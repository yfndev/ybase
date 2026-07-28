# Team-Directory-Sync

YBase ist die Quelle für die öffentliche Organisationsstruktur. Der
read-only Endpoint `GET /api/v1/team-directory` veröffentlicht die Daten der
Organisation aus `YFN_TEAM_DIRECTORY_ORGANIZATION_ID`.

## Sichtbarkeit

Der Feed enthält ausschließlich aktive Mitglieder. Für die operative
Teamstruktur werden außerdem ein aktives Department, ein aktives Team und ein
Name vorausgesetzt. Die interne Position ist optional und wird nicht im
Organigramm veröffentlicht. Eine optionale `boardMembership` ordnet ein
Vorstandsmitglied direkt einem aktiven Department zu. Vorstandsmitglieder sind
keinem Team innerhalb dieses Departments zugeordnet.

`isTeamLead` markiert Mitglieder, die im jeweiligen Team hervorgehoben werden.
Für bestehende Consumer enthält `role` bei diesen Mitgliedern zusätzlich
`"Lead"` und ist für alle anderen Mitglieder leer.

Interne Berechtigungsrollen wie `admin`, `finance` oder `people_culture` werden
nicht veröffentlicht.

## Darstellung im Organigramm

Der Consumer stellt die Ebenen in dieser Reihenfolge dar:

1. Vorstand
2. Departments
3. Teams
4. Teammitglieder

Vorstandsmitglieder stehen auf Department-Ebene oberhalb der Teams. Innerhalb
eines Teams stehen Leads vor den übrigen Mitgliedern und erhalten eine
Lead-Hervorhebung. Weitere Positionen werden nicht dargestellt.

## Vertrag

```json
{
  "version": "v1",
  "generatedAt": "2026-07-28T12:00:00.000Z",
  "revision": "sha256",
  "data": {
    "board": [
      {
        "id": "ybase:org:member:user",
        "departmentId": "ybase:org:department:department",
        "name": "Ada Beispiel",
        "role": "Operations",
        "isChair": true
      }
    ],
    "departments": [
      {
        "id": "ybase:org:department:department",
        "name": "Programs",
        "teams": [
          {
            "id": "ybase:org:team:team",
            "name": "Startup in School",
            "members": [
              {
                "id": "ybase:org:member:user",
                "name": "Ada Beispiel",
                "role": "Lead",
                "isLead": true
              }
            ]
          }
        ]
      }
    ]
  }
}
```

Die `revision` ist ein Hash über `data` und wird als ETag ausgeliefert. Der
YBase-Endpoint darf 60 Sekunden gecacht und bis zu 300 Sekunden veraltet
weiterverwendet werden. Der Landingpage-Consumer lädt den Feed serverseitig und
revalidiert ihn derzeit alle fünf Minuten.
