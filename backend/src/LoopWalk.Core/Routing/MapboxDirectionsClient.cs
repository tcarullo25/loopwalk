using System.Globalization;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using LoopWalk.Core.Geometry;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace LoopWalk.Core.Routing;

/// <summary>
/// Typed <see cref="HttpClient"/> over the Mapbox Directions API. Talks HTTP and nothing else —
/// retry and radius-correction policy live in <see cref="LoopRouteGenerator"/>.
/// </summary>
public sealed class MapboxDirectionsClient : IMapboxDirectionsClient
{
    /// <summary>Mapbox caps a Directions request at 25 coordinates, start and end included.</summary>
    public const int MaxCoordinates = 25;

    private readonly HttpClient _httpClient;
    private readonly MapboxOptions _options;
    private readonly ILogger<MapboxDirectionsClient> _logger;

    public MapboxDirectionsClient(
        HttpClient httpClient,
        IOptions<MapboxOptions> options,
        ILogger<MapboxDirectionsClient> logger)
    {
        _httpClient = httpClient;
        _options = options.Value;
        _logger = logger;
    }

    public async Task<DirectionsResult?> GetWalkingRouteAsync(
        IReadOnlyList<GeoPoint> coordinates,
        CancellationToken ct = default)
    {
        ArgumentNullException.ThrowIfNull(coordinates);
        if (coordinates.Count is < 2 or > MaxCoordinates)
            throw new ArgumentOutOfRangeException(nameof(coordinates), coordinates.Count,
                $"A Directions request needs between 2 and {MaxCoordinates} coordinates.");

        var requestUri = BuildRequestUri(coordinates);

        MapboxDirectionsResponse? payload;
        try
        {
            using var response = await _httpClient.GetAsync(requestUri, ct);

            if (!response.IsSuccessStatusCode)
            {
                var body = await response.Content.ReadAsStringAsync(ct);
                _logger.LogWarning("Mapbox Directions returned {StatusCode}: {Body}", response.StatusCode, body);
                throw new MapboxException($"Mapbox Directions returned {(int)response.StatusCode}.");
            }

            payload = await response.Content.ReadFromJsonAsync<MapboxDirectionsResponse>(ct);
        }
        catch (HttpRequestException ex)
        {
            throw new MapboxException("Could not reach the Mapbox Directions API.", ex);
        }
        catch (TaskCanceledException ex) when (!ct.IsCancellationRequested)
        {
            throw new MapboxException("The Mapbox Directions request timed out.", ex);
        }
        catch (JsonException ex)
        {
            throw new MapboxException("The Mapbox Directions response could not be parsed.", ex);
        }

        return MapResult(payload);
    }

    private DirectionsResult? MapResult(MapboxDirectionsResponse? payload)
    {
        if (payload is null)
            throw new MapboxException("The Mapbox Directions response was empty.");

        // "NoRoute" / "NoSegment" mean the request was fine but the geography isn't walkable.
        // That's a real answer, not a failure — let the caller decide what to do about it.
        if (payload.Code is "NoRoute" or "NoSegment")
        {
            _logger.LogInformation("Mapbox found no walkable route ({Code}).", payload.Code);
            return null;
        }

        if (payload.Code != "Ok")
            throw new MapboxException($"Mapbox Directions returned code '{payload.Code}': {payload.Message}");

        var route = payload.Routes?.FirstOrDefault();
        if (route?.Geometry?.Coordinates is not { Count: > 0 } positions)
            return null;

        var geometry = new GeoPoint[positions.Count];
        for (var i = 0; i < positions.Count; i++)
        {
            var position = positions[i];
            if (position.Length < 2)
                throw new MapboxException("The Mapbox route geometry contained a malformed position.");

            // GeoJSON positions are [lon, lat] — flipped relative to how we name them.
            geometry[i] = new GeoPoint(position[1], position[0]);
        }

        return new DirectionsResult(route.Distance, route.Duration, geometry);
    }

    private string BuildRequestUri(IReadOnlyList<GeoPoint> coordinates)
    {
        var path = new StringBuilder("directions/v5/")
            .Append(_options.Profile)
            .Append('/');

        for (var i = 0; i < coordinates.Count; i++)
        {
            if (i > 0) path.Append(';');
            var point = coordinates[i];
            path.Append(point.Lon.ToString("G9", CultureInfo.InvariantCulture))
                .Append(',')
                .Append(point.Lat.ToString("G9", CultureInfo.InvariantCulture));
        }

        path.Append("?geometries=geojson&overview=full&continue_straight=false&access_token=")
            .Append(Uri.EscapeDataString(_options.AccessToken));

        return path.ToString();
    }
}
