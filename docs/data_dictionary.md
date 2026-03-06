# Data Dictionary

## Core Entity: `SpendingData`

This defines the fundamental structure of a public money operation (contract or subsidy) within the application.

| Field | Type | Description |
|-------|------|-------------|
| `id` | `string` | Unique identifier of the transaction (e.g., TR-1A2B3C) |
| `amount` | `number` | The monetary value of the contract/subsidy in EUR |
| `date` | `string` | ISO string of when the operation was registered |
| `category` | `enum` | Domain of the contract ("Health", "Defense", "Education", "Infrastructure", "Other") |
| `region` | `string` | The Spanish Autonomous Community where the funds apply |
| `recipient` | `string` | The name of the company or entity receiving the funds |
| `recipientCif` | `string` | The CIF/NIF (Tax ID) of the recipient entity |
| `title` | `string` | A brief, plain-language description of the operation |
| `type` | `enum` | Classification: "Contrato Mayor", "Contrato Menor", "Subvención" |

## Aggregated Data Structures (`getAggregatedData`)
The UI consumes aggregated values mapped in `src/lib/api.ts`:
- `totalAmount`: Sum of all historical or filtered spending.
- `activeContracts`: Total count of absolute contracts.
- `minorContracts`: Count of `Contrato Menor` type (often scrutinized for transparency).
- `byRegion`: Geographical distribution (Amount per Region).
- `byCategory`: Sectorial distribution (Amount per Category).
- `topCompanies`: Leaderboard of entities sorted by total amount received.
- `monthlyTrend`: Time-series representation of spending over months.
