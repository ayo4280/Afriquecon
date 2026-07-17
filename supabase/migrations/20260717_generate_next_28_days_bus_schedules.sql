-- Generate the next 28 days of bookable departures from the active route matrix.
--
-- This is intentionally idempotent: a schedule is created only when a route
-- has a configured departure day, a valid 12-hour departure time (for example
-- `7am` or `6:30pm`), a fare, and an estimated journey duration. Existing
-- schedules with the same route and departure timestamp are retained.
--
-- Run once in the Supabase SQL Editor. The final result lists only the rows
-- created during that run.

WITH route_times AS (
  SELECT
    r.origin,
    r.destination,
    r.base_rate_fcfa,
    r.estimated_hours,
    lower(trim(r.departure_days)) AS departure_days,
    time_parts.parts
  FROM public.routes AS r
  CROSS JOIN LATERAL regexp_match(
    lower(trim(r.departure_time)),
    '^([1-9]|1[0-2])(?::([0-5][0-9]))?\s*(am|pm)$'
  ) AS time_parts(parts)
  WHERE r.active = true
    AND r.departure_days IS NOT NULL
    AND trim(r.departure_days) <> ''
    AND r.departure_time IS NOT NULL
    AND r.base_rate_fcfa IS NOT NULL
    AND r.estimated_hours IS NOT NULL
    AND r.estimated_hours > 0
),
schedule_candidates AS (
  SELECT
    route.origin,
    route.destination,
    route.base_rate_fcfa,
    route.estimated_hours,
    (
      dates.service_day::date + make_time(
        (route.parts[1]::integer % 12) + CASE WHEN route.parts[3] = 'pm' THEN 12 ELSE 0 END,
        coalesce(route.parts[2], '0')::integer,
        0
      )
    ) AS departure_at
  FROM route_times AS route
  CROSS JOIN generate_series(current_date, current_date + 27, interval '1 day') AS dates(service_day)
  WHERE route.departure_days LIKE '%' || lower(to_char(dates.service_day::date, 'FMDay')) || '%'
),
inserted AS (
  INSERT INTO public.bus_schedules (
    origin,
    destination,
    departure_time,
    arrival_time,
    base_fare_fcfa,
    available_seats,
    status
  )
  SELECT
    candidate.origin,
    candidate.destination,
    candidate.departure_at,
    candidate.departure_at + make_interval(hours => candidate.estimated_hours),
    candidate.base_rate_fcfa,
    48,
    'scheduled'
  FROM schedule_candidates AS candidate
  WHERE candidate.departure_at > localtimestamp
    AND NOT EXISTS (
      SELECT 1
      FROM public.bus_schedules AS existing
      WHERE existing.origin = candidate.origin
        AND existing.destination = candidate.destination
        AND existing.departure_time = candidate.departure_at
    )
  RETURNING id, origin, destination, departure_time, arrival_time, base_fare_fcfa
)
SELECT *
FROM inserted
ORDER BY departure_time, origin, destination;
