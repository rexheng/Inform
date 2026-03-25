"""Ranking engine: score providers by wait time + distance."""

from dataclasses import dataclass

from app.services.geocoding import haversine_km


@dataclass
class RankedProvider:
    ods_code: str
    name: str
    distance_km: float
    performance_62d: float | None
    performance_31d: float | None
    performance_fds: float | None
    total_patients_62d: int
    score: float


def rank_providers(
    providers: list[dict],
    user_lat: float,
    user_lng: float,
    weight_wait: float = 0.7,
    weight_distance: float = 0.3,
) -> list[RankedProvider]:
    """Rank providers by combined wait time + distance score (lower = better).

    providers: list of dicts with keys:
        ods_code, name, lat, lng, performance_62d, performance_31d,
        performance_fds, total_patients_62d
    """
    if not providers:
        return []

    # Calculate distances
    items = []
    for p in providers:
        dist = haversine_km(user_lat, user_lng, p["lat"], p["lng"])
        items.append({**p, "distance_km": dist})

    # Normalise wait time: use (1 - performance_62d) so lower performance = worse
    # Higher (1-perf) = longer waits = worse
    wait_values = []
    for item in items:
        perf = item.get("performance_62d")
        if perf is not None and perf > 0:
            wait_values.append(1 - perf)
        else:
            wait_values.append(1.0)  # worst case if no data

    distances = [item["distance_km"] for item in items]

    wait_min, wait_max = min(wait_values), max(wait_values)
    dist_min, dist_max = min(distances), max(distances)

    wait_range = wait_max - wait_min if wait_max != wait_min else 1.0
    dist_range = dist_max - dist_min if dist_max != dist_min else 1.0

    results = []
    for item, wait_val, dist_val in zip(items, wait_values, distances):
        wait_norm = (wait_val - wait_min) / wait_range
        dist_norm = (dist_val - dist_min) / dist_range
        score = weight_wait * wait_norm + weight_distance * dist_norm

        results.append(RankedProvider(
            ods_code=item["ods_code"],
            name=item["name"],
            distance_km=round(dist_val, 1),
            performance_62d=item.get("performance_62d"),
            performance_31d=item.get("performance_31d"),
            performance_fds=item.get("performance_fds"),
            total_patients_62d=item.get("total_patients_62d", 0),
            score=round(score, 4),
        ))

    results.sort(key=lambda r: r.score)
    return results
