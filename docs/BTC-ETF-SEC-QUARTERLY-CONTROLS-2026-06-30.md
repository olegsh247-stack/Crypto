# BTC spot-trust holdings — SEC quarterly control points (2026-06-30)

**Purpose:** independently checkable quarter-end reference values for the 13 active direct-BTC trust products in Plan 100. These are reported holdings at the same observation date, not a daily historical panel and not live/current values.

**Observation date:** 2026-06-30. **Unit:** BTC. **Source:** each trust's own SEC Form 10-Q schedule of investments / bitcoin fair-value disclosure. Precision is preserved as reported; some filings round whole-BTC quantities, so apparent differences in decimal precision are source-defined and must not be “corrected” by estimation.

| Ticker | Trust | Reported BTC on 2026-06-30 | Official SEC filing |
|---|---|---:|---|
| IBIT | iShares Bitcoin Trust ETF | 734,261 | [Form 10-Q](https://www.sec.gov/Archives/edgar/data/1980994/000143774926026004/bit20260630c_10q.htm) |
| FBTC | Fidelity Wise Origin Bitcoin Fund | 174,383 | [Form 10-Q](https://www.sec.gov/Archives/edgar/data/1852317/000119312526337679/ck0001852317-20260630.htm) |
| GBTC | Grayscale Bitcoin Trust ETF | 138,505.75680424 | [Form 10-Q](https://www.sec.gov/Archives/edgar/data/1588489/000158848926000005/gbtc-20260630.htm) |
| BTC | Grayscale Bitcoin Mini Trust ETF | 54,280.40050138 | [Form 10-Q](https://www.sec.gov/Archives/edgar/data/2015034/000201503426000008/btc-20260630.htm) |
| ARKB | ARK 21Shares Bitcoin ETF | 32,178.2280 | [Form 10-Q](https://www.sec.gov/Archives/edgar/data/1869699/000121390026086191/ea0299118-10q_ark21shares.htm) |
| BITB | Bitwise Bitcoin ETF | 36,207.6919 | [Form 10-Q](https://www.sec.gov/Archives/edgar/data/1763415/000119312526340183/bitb-20260630.htm) |
| HODL | VanEck Bitcoin ETF | 16,241.00 | [Form 10-Q](https://www.sec.gov/Archives/edgar/data/1838028/000093041326002505/c117299_10q-ixbrl.htm) |
| BTCO | Invesco Galaxy Bitcoin ETF | 5,345 | [Form 10-Q](https://www.sec.gov/Archives/edgar/data/1855781/000119312526338719/btco-20260630.htm) |
| EZBC | Franklin Bitcoin ETF | 5,664.0163 | [Form 10-Q](https://www.sec.gov/Archives/edgar/data/1992870/000114036126033208/ef20077161_10q.htm) |
| BRRR | CoinShares Bitcoin ETF | 5,864 | [Form 10-Q](https://www.sec.gov/Archives/edgar/data/1841175/000199937126017701/brrr-10q_063026.htm) |
| BTCW | WisdomTree Bitcoin Fund | 2,310 | [Form 10-Q](https://www.sec.gov/Archives/edgar/data/1850391/000121465926009996/wtb8626110q.htm) |
| MSBT | Morgan Stanley Bitcoin Trust | 5,059.30771216 | [Form 10-Q](https://www.sec.gov/Archives/edgar/data/2103612/000110465926095885/msbt-20260630x10q.htm) |
| OBTC | Osprey Bitcoin Trust | 945.07 | [Form 10-Q](https://www.sec.gov/Archives/edgar/data/1767057/000149315226037040/form10-q.htm) |

## Quality and use rules

- This is a **13/13 ticker same-date SEC control snapshot**, not proof of a complete daily history.
- The snapshot is suitable for checking whether quarterly extraction logic recognizes the right quantity concepts and source documents. The source filings remain authoritative.
- Do not use these quarter-end points to forward-fill daily values or infer unobserved dates.
- Do not compare to daily observations unless their observed_date is exactly 2026-06-30 and the field represents the same fund-held BTC quantity.
- Missing daily history remains missing, not zero. No values here are derived from USD flows or AUM/price.
- No production ingestion, database write, source-registry acceptance, scenario evaluation, score/probability change, deployment, or PR merge is implied.


## Recheck log — 2026-10-16

Direct SEC document content was re-opened for the following control rows and the stated quantity was confirmed in the filing's investment schedule: **IBIT (734,261), FBTC (174,383), GBTC (138,505.75680424), Grayscale Mini BTC (54,280.40050138), ARKB (32,178.2280), BITB (36,207.6919), BTCO (5,345), and EZBC (5,664.0163)**. The IBIT URL was corrected to the actual SEC document filename `bit20260630c_10q.htm`; the previously listed `ibit-20260630.htm` was not the filing's actual document URL.

The first pass verified 8 rows. A second pass then re-opened the SEC filings for the remaining five rows: HODL (16,241.00), BRRR (5,864), BTCW (2,310), MSBT (5,059.30771216), and OBTC (945.07). Together, all **13/13** listed values have now been checked against the cited SEC filings' investment schedules. In particular, BTCW's filing distinguishes its rounded schedule quantity (2,310 BTC) from a reference-rate quantity (2,309.689 BTC); this table intentionally records the schedule quantity, and the methodology distinction must be retained.


Second-pass primary-source checks:
- HODL: SEC investment schedule reports 16,241.00 BTC at 2026-06-30.
- BRRR: SEC investment schedule reports 5,864 BTC.
- BTCW: SEC investment schedule reports 2,310 BTC; Note describes 2,309.689 BTC at the Reference Rate valuation.
- MSBT: SEC investment schedule reports 5,059.30771216 BTC.
- OBTC: SEC investment schedule reports 945.07 BTC.
