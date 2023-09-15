# SchoolAzure

## Installation and Running

mangler

1. Download Files
2. In your cmd, write "node server.js"
3. Open browser and enter the domain "http://localhost:3000/"

## Frontend usage [https://github.com/Kemixd3/SchoolAzure]

Go to the azure page [] to use the program

### List of artists/artists

Sort by selecting what data you want

1. search artists, album and tracks
2. search artists
3. search albums by a specific artist
4. search 

In the search bar type what you are looking for and click search

## Backend Usage [https://github.com/Kemixd3/SchoolAzure]

### Get / Post / Put / Delete / Search albums
GET /albums 
POST /albums { album_title, release_date }
PUT /albums/:albumId { album_title, release_date }
DELETE /albums/:albumId

SEARCH /search/albums { album_name }


### Get / Post / Put / Delete / Search artists
GET /artists 
POST /artists { artist_name, birth_date }
PUT /artists/:artistId { artist_name, birth_date }
DELETE /artists/:artistId

SEARCH /search/artist { artist_name }


### Get / Post / Put / Delete / Search tracks
GET /tracks 
POST /tracks { track_title, duration, album_id }
PUT /tracks/:trackId { track_title, duration, album_id }
DELETE /tracks/:trackId 

SEARCH /search/tracks { track_name }


### General Search 
GET /search/searchAll { search_word }


### Complete Album
POST /albums_and_songs { album_title, release_date, songs }

### Extract full Album
