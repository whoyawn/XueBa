use axum::{
    routing::get,
    Router,
    Json,
    extract::Path,
    http::{Method, header},
};
use serde::{Deserialize, Serialize};
use std::env;
use dotenv::dotenv;
use tower_http::cors::{CorsLayer, Any};

#[derive(Debug, Deserialize)]
struct SpotifyTrack {
    name: String,
    artists: Vec<SpotifyArtist>,
    album: SpotifyAlbum,
}

#[derive(Debug, Deserialize)]
struct SpotifyArtist {
    name: String,
}

#[derive(Debug, Deserialize)]
struct SpotifyAlbum {
    name: String,
}

#[allow(non_snake_case)]
#[derive(Debug, Deserialize, Serialize)]
struct LRCLibResponse {
    id: i32,
    trackName: String,
    artistName: String,
    albumName: String,
    duration: f32,
    plainLyrics: String,
}

async fn get_track(Path(spotify_id): Path<String>) -> Json<Vec<LRCLibResponse>> {
    dotenv().ok();
    
    let spotify_token = env::var("SPOTIFY_ACCESS_TOKEN").expect("SPOTIFY_ACCESS_TOKEN must be set");
    let client = reqwest::Client::new();

    // Get track info from Spotify
    let spotify_url = format!("https://api.spotify.com/v1/tracks/{}", spotify_id);
    let spotify_response: SpotifyTrack = client
        .get(&spotify_url)
        .header("Authorization", format!("Bearer {}", spotify_token))
        .send()
        .await
        .expect("Failed to fetch from Spotify")
        .json()
        .await
        .expect("Failed to parse Spotify response");

    // Get lyrics from LRCLib
    let lrclib_url = format!("https://lrclib.net/api/search?track_name={}&artist_name={}&album_name={}&limit=5", 
        spotify_response.name, 
        spotify_response.artists[0].name,
        spotify_response.album.name
    );
    
    let lrclib_response: Vec<LRCLibResponse> = client
        .get(&lrclib_url)
        .send()
        .await
        .expect("Failed to fetch from LRCLib")
        .json()
        .await
        .expect("Failed to parse LRCLib response");

    Json(lrclib_response)

}

#[tokio::main]
async fn main() {
    // Build our application with a route
    let app = Router::new()
        .route("/track/:spotify_id", get(get_track))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods([Method::GET])
                .allow_headers([header::CONTENT_TYPE])
        );

    // Run it with hyper on localhost:3000
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await.unwrap();
    println!("Server running on http://localhost:3000");
    axum::serve(listener, app).await.unwrap();
}
