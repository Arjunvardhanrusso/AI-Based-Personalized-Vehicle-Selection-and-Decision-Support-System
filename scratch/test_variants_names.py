import json

with open("data/variants.json", "r", encoding="utf-8") as f:
    variants = json.load(f)

for k, v in list(variants.items())[:10]:
    print(f"{v.get('brand')} | {v.get('model_name')} | {v.get('name')} | {v.get('variant_name')}")
