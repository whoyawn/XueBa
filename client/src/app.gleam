import gleam/bool
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
    duration: Int,
    plain_lyrics: String,
  )
}

pub type Model {
  Model(search_url: String, tracks: List(Track), error: Option(String))
}

fn init(_flags) -> #(Model, effect.Effect(Msg)) {
  #(Model("", [], None), effect.none())
}

pub type Msg {
  SearchUrlChanged(String)
  SearchClicked
  ApiReturnedTracks(Result(List(Track), lustre_http.HttpError))
}

pub fn update(model: Model, msg: Msg) -> #(Model, effect.Effect(Msg)) {
  case msg {
    SearchUrlChanged(url) -> #(Model(..model, search_url: url), effect.none())
    SearchClicked -> {
      let track_id = extract_track_id(model.search_url)
      case track_id {
        Some(id) -> #(model, search_tracks(id))
        None -> #(
          Model(..model, error: Some("Invalid Spotify URL")),
          effect.none(),
        )
      }
    }
    ApiReturnedTracks(Ok(tracks)) -> #(
      Model(..model, tracks: tracks, error: None),
      effect.none(),
    )
    ApiReturnedTracks(Error(_)) -> #(
      Model(..model, error: Some("Failed to fetch tracks")),
      effect.none(),
    )
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
  let url = "http://localhost:3000/track/" <> track_id
  io.println("URL: " <> url)
  let decoder = decode.list(track_decoder())
  let expect = lustre_http.expect_json(decoder, ApiReturnedTracks)

  lustre_http.get(url, expect)
}

fn track_decoder() -> Decoder(Track) {
  use id <- decode.field("id", decode.int)
  use track_name <- decode.field("trackName", decode.string)
  use artist_name <- decode.field("artistName", decode.string)
  use album_name <- decode.field("albumName", decode.string)
  use duration <- decode.field("duration", decode.int)
  use plain_lyrics <- decode.field("plainLyrics", decode.string)

  decode.success(Track(
    id:,
    track_name:,
    artist_name:,
    album_name:,
    duration:,
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
          html.p([], [
            element.text(
              "Duration: " <> int.to_string(track.duration) <> " seconds",
            ),
          ]),
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
