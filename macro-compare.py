"""Compare IMF and World Bank annual figures for one year, every country in both.

Usage (downloads both datasets, no key needed):
    python macro-compare.py 2023                 # inflation (default)
    python macro-compare.py 2023 unemployment
Or with files you saved yourself:
    python macro-compare.py 2023 inflation imf.json worldbank.json
"""
import json, statistics, sys, urllib.request

year = sys.argv[1] if len(sys.argv) > 1 else "2023"
which = sys.argv[2] if len(sys.argv) > 2 else "inflation"
CODES = {"inflation": ("PCPIPCH", "FP.CPI.TOTL.ZG"),
         "unemployment": ("LUR", "SL.UEM.TOTL.ZS")}
imf_code, wb_code = CODES[which]
IMF_URL = f"https://www.imf.org/external/datamapper/api/v1/{imf_code}"
WB_URL = (f"https://api.worldbank.org/v2/country/all/indicator/{wb_code}"
          f"?date={year}&format=json&per_page=400")

def load(src):
    if src.startswith("http"):
        with urllib.request.urlopen(src, timeout=60) as r:
            return json.load(r)
    with open(src, encoding="utf-8") as f:
        return json.load(f)

imf = load(sys.argv[3] if len(sys.argv) > 3 else IMF_URL)["values"][imf_code]
wb_rows = load(sys.argv[4] if len(sys.argv) > 4 else WB_URL)[1]

# World Bank regional and income-group aggregates (not countries).
AGGREGATES = {"AFE","AFW","ARB","CSS","CEB","EAR","EAS","EAP","TEA","EMU","ECS","ECA","TEC","EUU",
              "FCV","HPC","IBD","IBT","IDB","IDX","IDA","LTE","LCN","LAC","TLA","LDC","LMY","MEA",
              "MNA","TMN","MIC","NAC","OED","OSS","PSS","PST","PRE","SST","SAS","TSA","SSF","SSA",
              "TSS","WLD"}

rows = []
for r in wb_rows:
    iso, wb = r["countryiso3code"], r["value"]
    if not iso or iso in AGGREGATES or wb is None:
        continue
    im = imf.get(iso, {}).get(year)
    if im is None:
        continue
    rows.append((iso, r["country"]["value"], im, round(wb, 2), round(wb - im, 2)))

gaps = [abs(r[4]) for r in rows]
print(f"{which.capitalize()}, {year}: {len(rows)} countries in both sources")
print(f"Median absolute difference: {statistics.median(gaps):.2f} percentage points")
for t in (0.1, 0.5, 1, 2):
    print(f"Within {t} pp: {sum(g <= t for g in gaps)} of {len(rows)}")
print("Largest gaps (iso, country, IMF, World Bank, difference):")
for r in sorted(rows, key=lambda r: -abs(r[4]))[:8]:
    print("  ", r)
