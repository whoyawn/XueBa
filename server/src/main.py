import os
from fastapi import FastAPI, Path, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import requests
from dotenv import load_dotenv

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
    spotify_token = os.getenv("SPOTIFY_ACCESS_TOKEN")
    if not spotify_token:
        raise HTTPException(status_code=500, detail="SPOTIFY_ACCESS_TOKEN must be set")

    # Get track info from Spotify
    spotify_url = f"https://api.spotify.com/v1/tracks/{spotify_id}"
    headers = {"Authorization": f"Bearer {spotify_token}"}
    spotify_response = requests.get(spotify_url, headers=headers)
    if not spotify_response.ok:
        raise HTTPException(status_code=spotify_response.status_code, detail="Failed to fetch from Spotify")
    track_data = spotify_response.json()
    try:
        track = SpotifyTrack(**track_data)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to parse Spotify response: {e}")

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