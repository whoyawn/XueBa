use axum::{
    routing::get,
    Router,
    extract::Path,
};
use dotenv::dotenv;

#[tokio::main]
async fn main() {
    // Build our application with a route
    let app = Router::new()
        .route("/track/:spotify_id", get(get_track));

    // Run it with hyper on localhost:3000
    let listener = tokio::net::TcpListener::bind("127.0.0.1:3000").await.unwrap();
    println!("Server running on http://localhost:3000");
    axum::serve(listener, app).await.unwrap();
}

async fn get_track(Path(spotify_id): Path<String>) -> String {
    dotenv().ok();
    format!("Hello, {}", spotify_id)
}
