import os
from fastapi import FastAPI, Path, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import requests
from dotenv import load_dotenv
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials

load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)

class SpotifyArtist(BaseModel):
    name: str

class SpotifyAlbum(BaseModel):
    name: str

class SpotifyTrack(BaseModel):
    name: str
    artists: List[SpotifyArtist]
    album: SpotifyAlbum

class LRCLibResponse(BaseModel):
    id: int
    trackName: str
    artistName: str
    albumName: str
    duration: float
    plainLyrics: str

@app.get("/track/{spotify_id}", response_model=List[LRCLibResponse])
def get_track(spotify_id: str = Path(...)):
    client_id = os.getenv("SPOTIFY_CLIENT_ID")
    client_secret = os.getenv("SPOTIFY_CLIENT_SECRET")
    if not client_id or not client_secret:
        raise HTTPException(status_code=500, detail="SPOTIPY_CLIENT_ID and SPOTIPY_CLIENT_SECRET must be set")

    auth_manager = SpotifyClientCredentials(client_id=client_id, client_secret=client_secret)
    sp = spotipy.Spotify(auth_manager=auth_manager)
    try:
        track_data = sp.track(spotify_id)
        track = SpotifyTrack(
            name=track_data["name"],
            artists=[SpotifyArtist(name=artist["name"]) for artist in track_data["artists"]],
            album=SpotifyAlbum(name=track_data["album"]["name"])
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch or parse Spotify track: {e}")

    # Get lyrics from LRCLib
    lrclib_url = (
        f"https://lrclib.net/api/search?track_name={track.name}&artist_name={track.artists[0].name}&album_name={track.album.name}&limit=5"
    )
    lrclib_response = requests.get(lrclib_url)
    if not lrclib_response.ok:
        raise HTTPException(status_code=lrclib_response.status_code, detail="Failed to fetch from LRCLib")
    try:
        results = [LRCLibResponse(**item) for item in lrclib_response.json()]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse LRCLib response: {e}")
    return results 