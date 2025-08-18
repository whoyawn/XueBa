import gleam/dynamic/decode.{type Decoder}
import gleam/int
import gleam/io
import gleam/list
import gleam/option.{type Option, None, Some}
import gleam/string
import lustre
import lustre/attribute
import lustre/effect
import lustre/element
import lustre/element/html
import lustre/event
import lustre_http
import modem

// Always use production API URL
fn get_api_base_url() -> String {
  "https://xueba-9azgj.ondigitalocean.app"
}

pub fn main() {
  let app = lustre.application(init, update, view)
  let assert Ok(_) = lustre.start(app, "#app", Nil)

  Nil
}

pub type Track {
  Track(
    id: Int,
    track_name: String,
    artist_name: String,
    album_name: String,
    plain_lyrics: String,
  )
}

pub type Model {
  Model(search_url: String, tracks: List(Track), error: Option(String))
}

fn init(_flags) -> #(Model, effect.Effect(Msg)) {
  io.println("Initializing app...")
  let initial_url = modem.initial_uri()
  io.println("Initial URL: " <> string.inspect(initial_url))

  case initial_url {
    Ok(uri) -> {
      io.println("URI path: " <> uri.path)
      io.println("URI query: " <> string.inspect(uri.query))

      // Check if we're on the search path (from 404.html redirect)
      case uri.path {
        "/search" -> {
          // Handle search path - extract query from path
          case uri.query {
            Some(query) -> {
              io.println("Search path query: " <> query)
              case string.split_once(query, "=") {
                Ok(#("q", url)) -> {
                  io.println("Found URL in search path: " <> url)
                  // URL-decode the Spotify URL before extracting track ID
                  let decoded_url = string.replace(url, "%2F", "/")
                  io.println("Decoded URL: " <> decoded_url)
                  let track_id = extract_track_id(decoded_url)
                  case track_id {
                    Some(id) -> {
                      io.println("Found track ID: " <> id)
                      #(Model(decoded_url, [], None), search_tracks(id))
                    }
                    None -> {
                      io.println("No valid track ID found in search path")
                      #(Model("", [], None), effect.none())
                    }
                  }
                }
                _ -> {
                  io.println("Search path query doesn't match expected format")
                  #(Model("", [], None), effect.none())
                }
              }
            }
            None -> {
              io.println("Search path has no query")
              #(Model("", [], None), effect.none())
            }
          }
        }
        _ -> {
          // Handle regular query parameters (not from search path)
          io.println("=== HANDLING REGULAR QUERY ===")
          case uri.query {
            Some(query) -> {
              io.println("Regular query string: " <> query)
              io.println("Processing regular query on path: " <> uri.path)
              io.println(
                "Query starts with '?': "
                <> string.inspect(string.starts_with(query, "?")),
              )
              // Handle malformed URLs with double question marks
              let clean_query = case string.starts_with(query, "?") {
                True ->
                  case string.split(query, "?") {
                    [_, rest, ..] -> rest
                    _ -> query
                  }
                False -> query
              }
              io.println("Cleaned query: " <> clean_query)
              case string.split_once(clean_query, "=") {
                Ok(#("q", url)) -> {
                  io.println("Found URL in regular query: " <> url)
                  // URL-decode the Spotify URL before extracting track ID
                  let decoded_url = string.replace(url, "%2F", "/")
                  io.println("Decoded URL: " <> decoded_url)
                  let track_id = extract_track_id(decoded_url)
                  case track_id {
                    Some(id) -> {
                      io.println("Found track ID: " <> id)
                      #(Model(decoded_url, [], None), search_tracks(id))
                    }
                    None -> {
                      io.println("No valid track ID found")
                      #(Model("", [], None), effect.none())
                    }
                  }
                }
                _ -> {
                  io.println("Regular query doesn't match expected format")
                  #(Model("", [], None), effect.none())
                }
              }
            }
            None -> {
              io.println("No query parameter found")
              #(Model("", [], None), effect.none())
            }
          }
        }
      }
    }
    Error(_) -> {
      io.println("Failed to get initial URL")
      #(Model("", [], None), effect.none())
    }
  }
}

pub type Msg {
  SearchUrlChanged(String)
  SearchClicked
  ApiReturnedTracks(Result(List(Track), lustre_http.HttpError))
}

pub fn update(model: Model, msg: Msg) -> #(Model, effect.Effect(Msg)) {
  case msg {
    SearchUrlChanged(url) -> {
      // URL-decode the Spotify URL before extracting track ID
      let decoded_url = string.replace(url, "%2F", "/")
      let track_id = extract_track_id(decoded_url)
      case track_id {
        Some(id) -> #(
          Model(..model, search_url: decoded_url),
          search_tracks(id),
        )
        None -> #(Model(..model, search_url: decoded_url), effect.none())
      }
    }

    SearchClicked -> {
      let track_id = extract_track_id(model.search_url)
      case track_id {
        Some(id) -> {
          let encoded_url = string.replace(model.search_url, "/", "%2F")
          #(
            model,
            effect.batch([
              search_tracks(id),
              modem.push("/search", Some("q=" <> encoded_url), None),
            ]),
          )
        }
        None -> #(
          Model(..model, error: Some("Invalid Spotify URL")),
          effect.none(),
        )
      }
    }

    ApiReturnedTracks(Ok(tracks)) -> {
      io.println(
        "API returned tracks successfully. Count: "
        <> int.to_string(list.length(tracks)),
      )
      #(Model(..model, tracks: tracks, error: None), effect.none())
    }

    ApiReturnedTracks(Error(error)) -> {
      io.println("API returned error")
      case error {
        lustre_http.BadUrl(url) -> io.println("Bad URL: " <> url)
        lustre_http.InternalServerError(body) ->
          io.println("Server 500 body: " <> body)
        lustre_http.JsonError(decode_error) ->
          io.println("JSON decode error: " <> string.inspect(decode_error))
        lustre_http.NetworkError ->
          io.println("Network error: unable to reach server")
        lustre_http.NotFound -> io.println("Resource not found (404)")
        lustre_http.OtherError(status, body) ->
          io.println(
            "Unexpected status " <> int.to_string(status) <> ", body: " <> body,
          )
        lustre_http.Unauthorized -> io.println("Unauthorized (401)")
      }
      #(Model(..model, error: Some(http_error_to_string(error))), effect.none())
    }
  }
}

fn http_error_to_string(error: lustre_http.HttpError) -> String {
  case error {
    lustre_http.BadUrl(url) -> "Invalid URL: " <> url

    lustre_http.InternalServerError(body) ->
      "Internal server error (500). Body: " <> body

    lustre_http.JsonError(_) -> "Failed to decode JSON"

    lustre_http.NetworkError -> "Network error: unable to reach the server"

    lustre_http.NotFound -> "Resource not found (404)"

    lustre_http.OtherError(status, body) ->
      "Unexpected status " <> int.to_string(status) <> ". Body: " <> body

    lustre_http.Unauthorized -> "Unauthorized (401): authentication required"
  }
}

fn extract_track_id(url: String) -> Option(String) {
  let parts = string.split(url, "/")
  io.println("URL parts: " <> string.join(parts, ", "))

  case parts {
    [_, _, _, "track", id_with_query, ..] -> {
      let id_parts = string.split(id_with_query, "?")
      io.println("ID parts: " <> string.join(id_parts, ", "))

      case id_parts {
        [id, ..] -> {
          io.println("Found track ID: " <> id)
          Some(id)
        }
        _ -> {
          io.println("No ID found in parts")
          None
        }
      }
    }
    _ -> {
      io.println("URL doesn't match expected format")
      None
    }
  }
}

fn search_tracks(track_id: String) -> effect.Effect(Msg) {
  let url = get_api_base_url() <> "/track/" <> track_id
  io.println("Making API request to: " <> url)
  io.println("About to make HTTP request...")
  let decoder = decode.list(track_decoder())
  io.println("Decoder created successfully")
  let expect = lustre_http.expect_json(decoder, ApiReturnedTracks)
  io.println("Expect function created, calling lustre_http.get...")

  lustre_http.get(url, expect)
}

fn track_decoder() -> Decoder(Track) {
  use id <- decode.field("id", decode.int)
  use track_name <- decode.field("trackName", decode.string)
  use artist_name <- decode.field("artistName", decode.string)
  use album_name <- decode.field("albumName", decode.string)
  use plain_lyrics <- decode.field("plainLyrics", decode.string)

  decode.success(Track(
    id:,
    track_name:,
    artist_name:,
    album_name:,
    plain_lyrics:,
  ))
}

pub fn view(model: Model) -> element.Element(Msg) {
  let container_styles = [#("padding", "20px")]

  let search_container_styles = [#("margin-bottom", "20px")]

  let input_styles = [
    #("padding", "8px"),
    #("margin-right", "10px"),
    #("width", "300px"),
  ]

  let button_styles = [#("padding", "8px 16px")]

  let error_styles = [#("color", "red"), #("margin-bottom", "10px")]

  let track_styles = [
    #("margin-bottom", "20px"),
    #("padding", "10px"),
    #("border", "1px solid #ccc"),
    #("border-radius", "4px"),
  ]

  let lyrics_styles = [#("white-space", "pre-wrap")]

  html.div([attribute.style(container_styles)], [
    html.div([attribute.style(search_container_styles)], [
      html.input([
        attribute.type_("text"),
        attribute.placeholder("Enter Spotify URL"),
        attribute.value(model.search_url),
        event.on_input(SearchUrlChanged),
        attribute.style(input_styles),
      ]),
      html.button(
        [event.on_click(SearchClicked), attribute.style(button_styles)],
        [element.text("Search")],
      ),
    ]),
    case model.error {
      Some(error) ->
        html.div([attribute.style(error_styles)], [element.text(error)])
      None -> element.text("")
    },
    html.div(
      [],
      list.map(model.tracks, fn(track: Track) {
        let pleco_url = "plecoapi://x-callback-url/s?q=" <> track.plain_lyrics
        html.div([attribute.style(track_styles)], [
          html.h3([], [element.text(track.track_name)]),
          html.p([], [element.text("Artist: " <> track.artist_name)]),
          html.p([], [element.text("Album: " <> track.album_name)]),
          // duration removed
          html.a(
            [
              attribute.href(pleco_url),
              attribute.style([
                #("color", "blue"),
                #("text-decoration", "underline"),
              ]),
            ],
            [element.text("Open in Pleco")],
          ),
          html.pre([attribute.style(lyrics_styles)], [
            element.text(track.plain_lyrics),
          ]),
        ])
      }),
    ),
  ])
}
