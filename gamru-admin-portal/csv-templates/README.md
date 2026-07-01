# CSV Upload Templates — Gamru

Ready-to-use CSV samples for every bulk-upload screen in the project. Each file
matches the exact column names and delimiter the UI / backend validator expects.

| Feature (UI location)                         | File                                  | Delimiter | Backend route                  |
| --------------------------------------------- | ------------------------------------- | --------- | ------------------------------ |
| Gamification → Prizeshark Catalog             | `prizeshark-catalog.csv`              | `;`       | (UI bulk modal, delimiter `;`) |
| Gamification → Token Rules (Casino)           | `token-rules-casino.csv`              | `,`       | bulk tokens                    |
| Gamification → Token Rules (Sports)           | `token-rules-sports.csv`              | `,`       | bulk tokens                    |
| Gamification → XP Point Rules (Casino)        | `xp-point-rules-casino.csv`           | `,`       | bulk XP                        |
| Gamification → XP Point Rules (Sports)        | `xp-point-rules-sports.csv`           | `,`       | bulk XP                        |
| Settings → Casino Catalog → Games             | `casino-catalog-games.csv`            | `,`       | `/api/casino-catalog/games`    |
| Settings → Casino Catalog → Categories        | `casino-catalog-categories.csv`       | `,`       | `/api/casino-catalog/categories` |
| Settings → Casino Catalog → Providers         | `casino-catalog-providers.csv`        | `,`       | `/api/casino-catalog/providers`  |
| Settings → Sports Catalog → Sports            | `sports-catalog-sports.csv`           | `,`       | `/api/sport-catalog/sports`    |
| Settings → Sports Catalog → Teams             | `sports-catalog-teams.csv`            | `,`       | `/api/sport-catalog/teams`     |
| Settings → Sports Catalog → Tournaments       | `sports-catalog-tournaments.csv`      | `,`       | `/api/sport-catalog/tournaments` |
| Settings → Sports Catalog → Markets           | `sports-catalog-markets.csv`          | `,`       | `/api/sport-catalog/markets`   |
| CRM → Player Data (Assign Data Via CSV)       | `player-data.csv`                     | `,`       | `/api/player-data/bulk`        |

## Notes

- **Prizeshark Catalog** is the only feature that asks for a delimiter in the
  upload modal. The screenshot shows `;` selected by default — the sample file
  uses `;` to match. If you switch the radio to `,` in the UI, use a
  comma-separated version instead.
- **Casino games** use a JSON object for `device_support` — keep the quotes
  around `"{""mobile"":true,""desktop"":true}"` exactly as shown so Excel /
  the parser treats it as one cell.
- All `id` columns on the casino side are free-form strings (max 150 chars).
  Use whatever ID convention your provider uses (slug, GUID, numeric).
- Player Data `data_type` must be one of: `STRING`, `BOOLEAN`, `NUMBER`, `DATE`.
- Token / XP Rules `Transaction Type` must be `Debit` or `Credit`.
