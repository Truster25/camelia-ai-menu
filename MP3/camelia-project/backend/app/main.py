"""First API slice. Menu records are demonstration data, not restaurant data."""
from fastapi import FastAPI

app = FastAPI(title="Camellia Menu API", version="0.1.0")

DEMO_DISHES = [
    {"id": 1, "name": "The garden bowl", "category": "Fresh & light", "description": "Seasonal greens, grains and a bright citrus dressing.", "price": 8500, "tag": "Fresh favourite", "tone": "green"},
    {"id": 2, "name": "Grilled chicken plate", "category": "From the grill", "description": "A comforting plate with vegetables and house-inspired sides.", "price": 12000, "tag": "Guest favourite", "tone": "amber"},
    {"id": 3, "name": "Camellia coffee", "category": "Drinks", "description": "A warm, aromatic cup for the moments in between.", "price": 3500, "tag": "Slow moments", "tone": "brown"},
]

@app.get('/api/health')
def health():
    return {"status": "ok", "data_source": "demo"}

@app.get('/api/menu')
def menu():
    return {"items": DEMO_DISHES, "notice": "Sample dishes and prices for demonstration only."}
