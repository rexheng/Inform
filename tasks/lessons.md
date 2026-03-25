# Lessons Learned

## Data Format
- NHS Cancer Waiting Times "Monthly Combined CSV" has NO metadata header rows — header is row 1
- Filter by `Basis="Provider"` (not Commissioner) for trust-level data
- `Parent_Org="London"` reliably identifies London trusts
- 23 London trusts in dataset (19 main NHS + 4 specialist/private)
- Standards: FDS=28-day Faster Diagnosis, 31D=31-day, 62D=62-day
- Performance column is a 0-1 float (proportion treated within standard)
