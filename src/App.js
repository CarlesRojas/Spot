import React, { Component } from "react";
import Script from "react-load-script";
import "./App.css";
import Cover from "./jsx/Cover";
import Library from "./jsx/Library";
import Lyrics from "./jsx/Lyrics";
import Playing from "./jsx/Playing";
import Profile from "./jsx/Profile";
import Popup from "./jsx/Popup";
import SlideTransition from "./jsx/SlideTransition";
import SpotifyWebApi from "spotify-web-api-js";
window.spotifyAPI = new SpotifyWebApi();

export default class App extends Component {
    constructor() {
        super();

        // Get hash parameters (for oauth autentication)
        const params = this.getHashParams();

        // State of the window
        window.info = {
            isMobile: false,

            // Credentials
            accessToken: params.access_token,
            refreshToken: params.refresh_token,
            tokenExpireDateTime: new Date(Date.now() + 25 * 60 * 1000),
            deviceID: null,

            // Ordered Lists
            songList: [],
            albumList: [],
            artistList: [],

            // Library and Music
            progressIntervalID: null,
            updateProgressInterval: 5000, // CARLES Change to 15
            library: {
                songs: {},
                albums: {},
                artists: {},
                playlists: {}
            }
        };

        // Obtain token info from cookies
        this.getTokenInfoFromCookies();

        // Set the state for the app
        this.state = {
            // Window info
            width: window.innerWidth,
            height: window.innerHeight,
            isPortrait: window.innerWidth <= window.innerHeight,
            loggedIn: window.info.accessToken ? true : false,

            // Playback info
            playbackState: {
                playing: false,
                repeat: false,
                repeatOne: false,
                shuffle: false,
                songID: null,
                albumID: null,
                artistID: null,
                playlistID: null,
                exists: false,
                image: null
            },
            duration: 0,
            progress: 0,
            percentage: 0,

            // Popups
            popups: {
                playlist: "",
                playlistSongs: {},
                playlistName: "Unknown Playlist",
                playlistImage: "https://i.imgur.com/iajaWIN.png",

                album: "",
                albumSongs: {},
                albumName: "Unknown Album",
                albumImage: "https://i.imgur.com/iajaWIN.png",

                artist: "",
                artistSongs: {},
                artistAlbums: {},
                artistName: "Unknown Artist",
                artistImage: "https://i.imgur.com/PgCafqK.png",

                sortBy: false,
                sortByCallback: null,
                sortByItems: [],

                addTo: false,
                addToCallback: null,
                addToItems: [],
                addToIds: []
            }
        };

        // Create spotify Player
        this.createSpotPlayer();

        // Define the prettify function for all to access
        window.prettifyName = this.prettifyName;

        // Subscribe to events
        window.addEventListener("resize", () => window.PubSub.emit("onWindowResize"));
        window.PubSub.sub("onWindowResize", this.handleWindowResize);
        window.PubSub.sub("onPausePlay", this.handlePausePlay);

        window.PubSub.sub("onSongSelected", this.handleSongSelected);
        window.PubSub.sub("onAlbumSelected", this.handleAlbumSelected);
        window.PubSub.sub("onArtistSelected", this.handleArtistSelected);
        window.PubSub.sub("onPlaylistSelected", this.handlePlaylistSelected);

        window.PubSub.sub("onAddToClicked", this.handleAddToClicked);
        window.PubSub.sub("onSortByClicked", this.handleSortByClicked);
        window.PubSub.sub("onClosePopup", this.handleClosePopup);
        window.PubSub.sub("onSongLikeClicked", this.handleSongLikeClicked);
        window.PubSub.sub("onProfileLikeClicked", this.handleProfileLikeClicked);
    }

    //##############################################
    //       WINDOW & DEVICE CHANGES
    //##############################################

    // Handle a change in the size of the window
    handleWindowResize = () => {
        this.setState({
            width: window.innerWidth,
            height: window.innerHeight,
            isPortrait: window.innerWidth <= window.innerHeight
        });
    };

    // Updates what type of device we are on
    updateDeviceType = () => {
        const { width, isPortrait } = this.state;
        const isPhone = (isPortrait && width <= 480) || (!isPortrait && width <= 850);
        const isTablet = !isPhone && ((isPortrait && width <= 851) || (!isPortrait && width <= 1024));

        window.info.isMobile = isPortrait || isPhone || isTablet;
    };

    //##############################################
    //       OAUTH SETUP
    //##############################################

    getTokenInfoFromCookies = () => {
        // Get tokens and info from the cookie or set it if there was none
        if (window.info.accessToken) {
            window.spotifyAPI.setAccessToken(window.info.accessToken);

            this.setCookie("spot_accessToken", window.info.accessToken, 5);
            this.setCookie("spot_refreshToken", window.info.refreshToken, 5);
            this.setCookie("spot_tokenExpireDateTime", window.info.tokenExpireDateTime, 5);
        } else {
            var accessTokenCookie = this.getCookie("spot_accessToken");
            var refreshTokenCookie = this.getCookie("spot_refreshToken");
            var tokenExpireDateTimeCookie = new Date(Date.parse(this.getCookie("spot_tokenExpireDateTime")));

            if (accessTokenCookie && refreshTokenCookie && tokenExpireDateTimeCookie && tokenExpireDateTimeCookie > Date.now()) {
                window.spotifyAPI.setAccessToken(accessTokenCookie);

                window.info.accessToken = accessTokenCookie;
                window.info.refreshToken = refreshTokenCookie;
                window.info.tokenExpireDateTime = tokenExpireDateTimeCookie;
            }
        }
    };

    // Obtains parameters from the hash of the URL
    getHashParams = () => {
        var hashParams = {};
        var e;
        var r = /([^&;=]+)=?([^&;]*)/g;
        var q = window.location.hash.substring(1);
        while ((e = r.exec(q))) hashParams[e[1]] = decodeURIComponent(e[2]);
        return hashParams;
    };

    // Handles the load of the Spotify Web Playback Script-
    handleSpotifyPlaybackScriptLoad = () => {
        return new Promise(resolve => {
            if (window.Spotify) {
                resolve();
            } else {
                this.onSpotifyWebPlaybackSDKReady = resolve;
            }
        });
    };

    // Refresh the token
    refreshSpotifyToken = () => {
        fetch("http://localhost:8888/refresh_token", {
            method: "POST",
            body: JSON.stringify({ refresh_token: window.info.refreshToken }),
            headers: { "Content-Type": "application/json" }
        })
            .then(res => res.json())
            .then(data => {
                window.info.accessToken = data.access_token;
                window.info.tokenExpireDateTime = new Date(Date.now() + 25 * 60 * 1000);
                this.setCookie("spot_accessToken", window.info.accessToken, 5);
                this.setCookie("spot_tokenExpireDateTime", window.info.tokenExpireDateTime, 5);
                window.spotifyAPI.setAccessToken(window.info.accessToken);
            })
            .catch(error => console.log(error));

        window.refreshTokenInterval = window.setInterval(() => {
            if (Date.now() > window.info.tokenExpireDateTime) {
                window.clearInterval(window.refreshTokenInterval);
                this.refreshSpotifyToken();
            }
        }, 2 * 60 * 1000);
    };

    //##############################################
    //       SPOTIFY API
    //##############################################

    createSpotPlayer = () => {
        // Connects to Spotify Playback & creates a new Player
        window.onSpotifyWebPlaybackSDKReady = () => {
            window.info.player = new window.Spotify.Player({
                name: "Spot",
                getOAuthToken: callback => {
                    callback(window.info.accessToken);
                }
            });

            // Error handling
            window.info.player.addListener("initialization_error", ({ message }) => {
                //console.error(message);
            });
            window.info.player.addListener("authentication_error", ({ message }) => {
                //console.error(message);
            });
            window.info.player.addListener("account_error", ({ message }) => {
                //console.error(message);
            });
            window.info.player.addListener("playback_error", ({ message }) => {
                //console.error(message);
            });

            // Playback status updates
            window.info.player.addListener("player_state_changed", state => {
                this.handlePlaybackChange();
            });

            // Ready
            window.info.player.addListener("ready", ({ device_id }) => {
                this.transferPlayer(device_id);
            });

            // Not Ready
            window.info.player.addListener("not_ready", ({ device_id }) => {
                console.log("Device ID has gone offline", device_id);
            });

            // Connect to the player!
            window.info.player.connect();
        };
    };

    // Transfer the spotify player to Spot in this device
    transferPlayer = deviceID => {
        window.info.deviceID = deviceID;

        // Start playing on Spot
        window.spotifyAPI.transferMyPlayback([window.info.deviceID], { play: true }).then(
            response => {
                console.log("Now Playing on Spot");
                this.handlePlaybackChange();
            },
            err => {
                if (err.status === 401) window.location.assign("http://localhost:8888/login");
                else if (err.status === 404) this.transferPlayer(window.info.deviceID);
                else console.error(err);
            }
        );
    };

    // Obtains the current playback state for the user
    handlePlaybackChange = () => {
        window.setTimeout(() => {
            window.spotifyAPI.getMyCurrentPlaybackState().then(
                response => {
                    if (response) {
                        const { playbackState } = this.state;
                        const artistID = response.item.artists.length ? response.item.artists[0] : null;

                        var newPlaybackState = {};
                        newPlaybackState["playing"] = response.is_playing;
                        newPlaybackState["repeat"] = false;
                        newPlaybackState["repeatOne"] = false;
                        newPlaybackState["shuffle"] = response.shuffle_state;
                        newPlaybackState["songID"] = response.item.id;
                        newPlaybackState["albumID"] = playbackState.albumID === response.item.album.id ? playbackState.albumID : null;
                        newPlaybackState["artistID"] = playbackState.artistID === artistID ? playbackState.artistID : null;
                        newPlaybackState["playlistID"] = null; // CARLES <- Update for playlists
                        newPlaybackState["exists"] = true;
                        newPlaybackState["image"] = response.item.album.images.length > 0 ? response.item.album.images[0].url : null;
                        newPlaybackState["duration"] = response.item.duration_ms;
                        newPlaybackState["progress"] = response.progress_ms;
                        newPlaybackState["percentage"] = (response.progress_ms / response.item.duration_ms) * 100;

                        if (response.is_playing) {
                            if (!window.info.progressIntervalID) {
                                window.info.progressIntervalID = window.setInterval(
                                    this.updateSongProgress.bind(this),
                                    window.info.updateProgressInterval
                                );
                            }
                        } else {
                            if (window.info.progressIntervalID) {
                                window.clearInterval(window.info.progressIntervalID);
                                window.info.progressIntervalID = null;
                            }
                        }

                        this.setState({
                            playbackState: newPlaybackState,
                            duration: response.item.duration_ms,
                            progress: response.progress_ms,
                            percentage: (response.progress_ms / response.item.duration_ms) * 100
                        });
                    }
                },
                err => {
                    if (err.status === 401) window.location.assign("http://localhost:8888/login");
                    else if (err.status === 404) this.transferPlayer(window.info.deviceID);
                    else console.error(err);

                    var newPlaybackState = {};
                    newPlaybackState["playing"] = false;
                    newPlaybackState["repeat"] = false;
                    newPlaybackState["repeatOne"] = false;
                    newPlaybackState["shuffle"] = false;
                    newPlaybackState["songID"] = null;
                    newPlaybackState["albumID"] = null;
                    newPlaybackState["artistID"] = null;
                    newPlaybackState["playlistID"] = null;
                    newPlaybackState["exists"] = false;
                    newPlaybackState["image"] = null;

                    if (window.info.progressIntervalID) {
                        window.clearInterval(window.info.progressIntervalID);
                        window.info.progressIntervalID = null;
                    }
                    this.setState({
                        playbackState: newPlaybackState,
                        duration: 0,
                        progress: 0,
                        percentage: 0
                    });
                }
            );
        }, 200);
    };

    // Update the progress of the song
    updateSongProgress = () => {
        const { updateProgressInterval } = window.info;
        const { duration, progress } = this.state;
        var newProgress = progress + updateProgressInterval;
        var newPercentage = (newProgress / duration) * 100;
        this.setState({ progress: newProgress, percentage: newPercentage });
    };

    // Pause or Play the current song
    handlePausePlay = () => {
        const { playing } = this.state.playbackState;

        if (playing) {
            const { playbackState } = this.state;

            var newPlaybackState = JSON.parse(JSON.stringify(playbackState));
            newPlaybackState.playing = false;
            this.setState({ playbackState: newPlaybackState });

            window.spotifyAPI.pause().then(
                response => {
                    this.handlePlaybackChange();
                },
                err => {
                    if (err.status === 401) window.location.assign("http://localhost:8888/login");
                    else if (err.status === 404) this.transferPlayer(window.info.deviceID);
                    else console.error(err);
                }
            );
        } else {
            const { playbackState } = this.state;

            newPlaybackState = JSON.parse(JSON.stringify(playbackState));
            newPlaybackState.playing = true;
            this.setState({ playbackState: newPlaybackState });

            window.spotifyAPI.play().then(
                response => {
                    this.handlePlaybackChange();
                },
                err => {
                    if (err.status === 401) window.location.assign("http://localhost:8888/login");
                    else if (err.status === 404) this.transferPlayer(window.info.deviceID);
                    else console.error(err);
                }
            );
        }
    };

    // Get the user's library
    getUserLibrary = offset => {
        var limit = 50;

        window.spotifyAPI.getMySavedTracks({ offset: offset, limit: limit }).then(
            response => {
                const { items, next } = response;

                for (let i = 0; i < items.length; i++) this.parseAndSaveSavedTracks(items[i]);

                if (next) this.getUserLibrary((offset += 50));
                else {
                    this.forceUpdate();

                    // Get artists images
                    var artists = Object.keys(window.info.library.artists);
                    this.getArtistsImages(artists, 0);
                }
            },
            err => {
                if (err.status === 401) window.location.assign("http://localhost:8888/login");
                else if (err.status === 404) this.transferPlayer(window.info.deviceID);
                else console.error(err);
            }
        );
    };

    // Parse song info (To keep only what will be used)
    parseAndSaveSavedTracks = song => {
        var dateAdded = new Date(song.added_at);
        song = song.track;
        var songID = song.id;
        var albumID = song.album.id;
        var artistID = song.artists.length ? song.artists[0].id : "";

        // Add song
        if (!(songID in window.info.library.songs)) {
            var songInfo = {};
            songInfo["songID"] = songID;
            songInfo["dateAdded"] = dateAdded;
            songInfo["name"] = song.name;
            songInfo["duration"] = song.duration_ms;
            songInfo["albumID"] = albumID;
            songInfo["albumName"] = song.album.name;
            songInfo["artistID"] = artistID;
            songInfo["artistName"] = song.artists.length ? song.artists[0].name : "";
            songInfo["trackNumber"] = song.track_number;
            songInfo["image"] = song.album.images.length ? song.album.images[0].url : "https://i.imgur.com/iajaWIN.png";
            window.info.library.songs[songID] = songInfo;
        }

        // Add song to the album if already in the library
        if (albumID in window.info.library.albums) {
            var albumInfo = window.info.library.albums[albumID];
            if (!(songID in albumInfo.songs)) albumInfo["songs"][songID] = null;
            if (albumInfo.dateAdded < dateAdded) albumInfo["dateAdded"] = dateAdded;
        }

        // Add the album otherwise
        else {
            albumInfo = {};
            albumInfo["albumID"] = albumID;
            albumInfo["dateAdded"] = dateAdded;
            albumInfo["name"] = song.album.name;
            albumInfo["image"] = song.album.images.length ? song.album.images[0].url : "https://i.imgur.com/iajaWIN.png";
            albumInfo["artistID"] = artistID;
            albumInfo["songs"] = {};
            albumInfo["songs"][songID] = null;
            window.info.library.albums[albumID] = albumInfo;
        }

        // Add song & album to the artist if already in the library
        if (artistID in window.info.library.artists) {
            var artistInfo = window.info.library.artists[artistID];
            if (!(songID in artistInfo.songs)) artistInfo["songs"][songID] = null;
            if (!(albumID in artistInfo.albums)) artistInfo["albums"][albumID] = null;
            if (artistInfo.dateAdded < dateAdded) artistInfo["dateAdded"] = dateAdded;
        }

        // Add the artist otherwise
        else {
            artistInfo = {};
            artistInfo["artistID"] = artistID;
            artistInfo["dateAdded"] = dateAdded;
            artistInfo["name"] = song.artists.length ? song.artists[0].name : "";
            artistInfo["image"] = null;
            artistInfo["albums"] = {};
            artistInfo["albums"][albumID] = null;
            artistInfo["songs"] = {};
            artistInfo["songs"][songID] = null;
            window.info.library.artists[artistID] = artistInfo;
        }
    };

    // Gets the images for the artists in the list
    getArtistsImages = (artists, offset) => {
        var limit = 50;
        var curr = artists.slice(offset, offset + limit);

        // Return in there is no more artists to get
        if (curr.length <= 0) {
            this.getUserPlaylists(0);
            return;
        }

        window.spotifyAPI.getArtists(curr).then(
            response => {
                for (let i = 0; i < response.artists.length; i++) {
                    var artistID = response.artists[i].id;
                    if (artistID in window.info.library.artists) {
                        var url = response.artists[i]["images"].length ? response.artists[i]["images"][0].url : "https://i.imgur.com/PgCafqK.png";
                        window.info.library.artists[artistID]["image"] = url;
                    }
                }
                this.getArtistsImages(artists, offset + limit);
            },
            err => {
                if (err.status === 401) window.location.assign("http://localhost:8888/login");
                else if (err.status === 404) this.transferPlayer(window.info.deviceID);
                else console.error(err);
            }
        );
    };

    // Gets the user playlists
    getUserPlaylists = offset => {
        var limit = 50;

        window.spotifyAPI.getUserPlaylists({ offset: offset, limit: limit }).then(
            response => {
                const { items, next } = response;

                for (let i = 0; i < items.length; i++) this.parseAndSavePlaylists(items[i], i);

                if (next) this.getUserPlaylists((offset += limit));
                else {
                    this.forceUpdate();

                    // Get the songs in each playlist
                    var playlists = Object.keys(window.info.library.playlists);

                    for (var i = 0; i < playlists.length; ++i) this.getPlaylistSongs(playlists[i], 0, 100);

                    // Loading library complete
                    window.PubSub.emit("onLibraryLoaded");
                }
            },
            err => {
                if (err.status === 401) window.location.assign("http://localhost:8888/login");
                else if (err.status === 404) this.transferPlayer(window.info.deviceID);
                else console.error(err);
            }
        );
    };

    // Parse and save playlists to the library
    parseAndSavePlaylists = (playlist, order) => {
        var playlistID = playlist.id;
        var dateAdded = order;

        // Add playlist
        if (!(playlistID in window.info.library.playlists)) {
            var playlistInfo = {};
            playlistInfo["playlistID"] = playlistID;
            playlistInfo["dateAdded"] = dateAdded;
            playlistInfo["name"] = playlist.name;
            playlistInfo["image"] = playlist.images.length ? playlist.images[0].url : "https://i.imgur.com/06SzS3d.png";
            playlistInfo["songs"] = {};
            window.info.library.playlists[playlistID] = playlistInfo;
        }
    };

    // Get the songs in each playlist
    getPlaylistSongs = (playlist, offset) => {
        var limit = 100;

        window.spotifyAPI.getPlaylistTracks(playlist, { fields: "items(track(id))", offset: offset, limit: limit }).then(
            response => {
                const { items, next } = response;

                for (var i = 0; i < items.length; ++i) {
                    var songID = items[i].track.id;
                    if (songID in window.info.library.songs && playlist in window.info.library.playlists) {
                        window.info.library.playlists[playlist].songs[songID] = null;
                    }
                }

                if (next) this.getPlaylistSongs((offset += limit));
            },
            err => {
                if (err.status === 401) window.location.assign("http://localhost:8888/login");
                else if (err.status === 404) this.transferPlayer(window.info.deviceID);
                else console.error(err);
            }
        );
    };

    // Removes the ids from Spotify, using its API
    removeSongsFromSpotify = ids => {
        var chunk = 5;
        for (var i = 0; i < ids.length; i += chunk) {
            var current = ids.slice(i, i + chunk);
            window.spotifyAPI.removeFromMySavedTracks(current).then(
                response => {},
                err => {
                    if (err.status === 401) window.location.assign("http://localhost:8888/login");
                    else if (err.status === 404) this.transferPlayer(window.info.deviceID);
                    else console.error(err);
                }
            );
        }
    };

    // Adds the songs in ids to the playlist named 'name'
    addToPlaylist = (playlistID, ids) => {
        ids = ids.map(id => "spotify:track:" + id);
        var callLimit = 20;

        for (var i = 0; i < ids.length; i += callLimit) {
            var currIDs = ids.slice(i, callLimit);
            window.spotifyAPI.addTracksToPlaylist(playlistID, currIDs, {}).then(
                response => {},
                err => {
                    if (err.status === 401) window.location.assign("http://localhost:8888/login");
                    else if (err.status === 404) this.transferPlayer(window.info.deviceID);
                    else console.error(err);
                }
            );
        }
    };

    // Remove extra info from a song, album or artist name
    prettifyName = name => {
        const separators = [" - ", "(", ":", ",", " /"];

        var index = Number.MAX_SAFE_INTEGER;
        for (var i = 0; i < separators.length; ++i) {
            var result = name.indexOf(separators[i]);
            if (result > 0) index = Math.min(index, name.indexOf(separators[i]));
        }

        if (index > 0 && index < name.length) name = name.substring(0, index);
        return name.trim();
    };

    //##############################################
    //       USER ACTIONS
    //##############################################

    // Called when a song is selected
    handleSongSelected = ({ id }) => {
        window.spotifyAPI.play({ uris: ["spotify:track:" + id] }).then(
            response => {},
            err => {
                if (err.status === 401) window.location.assign("http://localhost:8888/login");
                else if (err.status === 404) this.transferPlayer(window.info.deviceID);
                else console.error(err);
            }
        );
    };

    // Called when the user selects an album from the library
    handleAlbumSelected = ({ id }) => {
        var newPopups = { ...this.state.popups };

        if (id in window.info.library.albums) {
            newPopups.album = id;
            newPopups.albumName = window.info.library.albums[id].name;
            newPopups.albumImage = window.info.library.albums[id].image;

            newPopups.albumSongs = {};
            Object.keys(window.info.library.albums[id].songs)
                .filter(songID => songID in window.info.library.songs)
                .map(songID => {
                    return (newPopups.albumSongs[songID] = window.info.library.songs[songID]);
                });
        } else {
            // CARLES implement for when the album is not in library (coming from search)
            newPopups.album = id;
            newPopups.albumName = "Unknown Album";
            newPopups.albumImage = "https://i.imgur.com/iajaWIN.png";
            newPopups.albumSongs = [];
        }

        this.setState({ popups: newPopups });
    };

    // Called when the user selects an artist from the library
    handleArtistSelected = ({ id }) => {
        var newPopups = { ...this.state.popups };

        if (id in window.info.library.artists) {
            newPopups.artist = id;
            newPopups.artistName = window.info.library.artists[id].name;
            newPopups.artistImage = window.info.library.artists[id].image;

            newPopups.artistSongs = {};
            Object.keys(window.info.library.artists[id].songs)
                .filter(songID => songID in window.info.library.songs)
                .map(songID => {
                    return (newPopups.artistSongs[songID] = window.info.library.songs[songID]);
                });

            newPopups.artistAlbums = {};
            Object.keys(window.info.library.artists[id].albums)
                .filter(albumID => albumID in window.info.library.albums)
                .map(albumID => {
                    return (newPopups.artistAlbums[albumID] = window.info.library.albums[albumID]);
                });
        } else {
            // CARLES implement for when the artist is not in library (coming from search)
            newPopups.artist = id;
            newPopups.artistName = "Unknown Artist";
            newPopups.artistImage = "https://i.imgur.com/PgCafqK.png";
            newPopups.artistSongs = [];
            newPopups.artistAlbums = [];
        }

        this.setState({ popups: newPopups });
    };

    // Called when the user selects a playlist from the library
    handlePlaylistSelected = ({ id }) => {
        var newPopups = { ...this.state.popups };

        if (id in window.info.library.playlists) {
            newPopups.playlist = id;
            newPopups.playlistName = window.info.library.playlists[id].name;
            newPopups.playlistImage = window.info.library.playlists[id].image;

            newPopups.playlistSongs = {};
            Object.keys(window.info.library.playlists[id].songs)
                .filter(songID => songID in window.info.library.songs)
                .map(songID => {
                    return (newPopups.playlistSongs[songID] = window.info.library.songs[songID]);
                });

            newPopups.playlistAlbums = [];
        } else {
            newPopups.playlist = id;
            newPopups.playlistName = "Unknown Playlist";
            newPopups.playlistImage = "https://i.imgur.com/06SzS3d.png";
            newPopups.playlistSongs = [];
            newPopups.playlistAlbums = [];
        }

        this.setState({ popups: newPopups });
    };

    // Called when the user selects the sort option
    handleSortByClicked = ({ items, callback }) => {
        var newPopups = { ...this.state.popups };

        newPopups.sortBy = true;
        newPopups.sortByCallback = callback;
        newPopups.sortByItems = items;

        this.setState({ popups: newPopups });
    };

    // Called when the user selects the add to option
    handleAddToClicked = ({ ids }) => {
        var newPopups = { ...this.state.popups };

        var items = Object.values(window.info.library.playlists).map(playlist => {
            return {
                name: playlist.name,
                callbackName: playlist.playlistID,
                selected: false
            };
        });

        newPopups.addTo = true;
        newPopups.addToCallback = this.handlePopupPlaylistClicked.bind(this);
        newPopups.addToItems = items;
        newPopups.addToIds = ids;

        this.setState({ popups: newPopups });
    };

    // Callback function for when a playlist is selected in the Add To popup
    handlePopupPlaylistClicked = name => {
        const { addToIds } = this.state.popups;
        this.addToPlaylist(name, addToIds);
    };

    // Called when the user clicks the back button in a popup. Type: "album", "artist", "playlist", sortBy or addTo
    handleClosePopup = ({ type }) => {
        var newPopups = { ...this.state.popups };

        switch (type) {
            case "playlist":
                newPopups.playlist = "";
                break;

            case "album":
                newPopups.album = "";
                break;

            case "artist":
                newPopups.artist = "";
                break;

            case "sortBy":
                newPopups.sortBy = false;
                newPopups.sortByCallback = null;
                newPopups.sortByItems = [];
                break;

            case "addTo":
            default:
                newPopups.addTo = false;
                newPopups.addToCallback = null;
                newPopups.addToItems = [];
                newPopups.addToIds = null;
                break;
        }

        this.setState({ popups: newPopups });
    };

    // Removes deleted songs and albums from the popups
    updatePopups = () => {
        var newPopups = { ...this.state.popups };

        // Delete the songs from the album that are not in the library anymore
        var songsInAlbum = Object.keys(newPopups.albumSongs);
        for (var i = 0; i < Object.keys(newPopups.albumSongs).length; ++i)
            if (!(songsInAlbum[i] in window.info.library.songs)) delete newPopups.albumSongs[songsInAlbum[i]];

        // Delete the songs from the artist that are not in the library anymore
        var songsInArtist = Object.keys(newPopups.artistSongs);
        for (i = 0; i < Object.keys(newPopups.artistSongs).length; ++i)
            if (!(songsInArtist[i] in window.info.library.songs)) delete newPopups.artistSongs[songsInArtist[i]];

        // Delete the albums from the artist that are not in the library anymore
        var albumsInArtist = Object.keys(newPopups.artistAlbums);
        for (i = 0; i < Object.keys(newPopups.artistAlbums).length; ++i)
            if (!(albumsInArtist[i] in window.info.library.albums)) delete newPopups.artistAlbums[albumsInArtist[i]];

        // Close the album popup if there are no more songs in it
        if (Object.keys(newPopups.albumSongs).length <= 0) newPopups.album = "";

        // Close the artist popup if there are no more songs in it
        if (Object.keys(newPopups.artistSongs).length <= 0) newPopups.artist = "";

        this.setState({ popups: newPopups });
    };

    // Called when the user likes / unlikes a song
    handleSongLikeClicked = ({ id }) => {
        // Remove song from library
        if (id in window.info.library.songs) {
            this.removeSongFromLibrary(id);
            this.removeSongsFromSpotify([id]);
        }

        // Add to library CARLES
        else {
        }
    };

    // Called when the user likes / unlikes an album/artist
    handleProfileLikeClicked = ({ id, type }) => {
        // Delete the album from the library
        if (type === "album") {
            if (id in window.info.library.albums) {
                const albumSongs = Object.keys(window.info.library.albums[id].songs);
                for (var i = 0; i < albumSongs.length; ++i) {
                    this.removeSongFromLibrary(albumSongs[i]);
                }
                this.removeSongsFromSpotify(albumSongs);
            }
        }

        // Delete the artist from the library
        else {
            if (id in window.info.library.artists) {
                const artistSongs = Object.keys(window.info.library.artists[id].songs);
                for (i = 0; i < artistSongs.length; ++i) {
                    this.removeSongFromLibrary(artistSongs[i]);
                }
                this.removeSongsFromSpotify(artistSongs);
            }
        }
    };

    // Removes the id from the local library
    removeSongFromLibrary = id => {
        // Remove song from library
        if (id in window.info.library.songs) {
            var albumID = window.info.library.songs[id].albumID;
            var artistID = window.info.library.songs[id].artistID;
            delete window.info.library.songs[id];

            // Delete album or just the song inside it
            if (albumID in window.info.library.albums && id in window.info.library.albums[albumID].songs) {
                if (Object.keys(window.info.library.albums[albumID].songs).length <= 1) {
                    delete window.info.library.albums[albumID];
                    window.PubSub.emit("onAlbumDeleted");

                    // Delete artist or remove the album from inside it
                    if (artistID in window.info.library.artists && albumID in window.info.library.artists[artistID].albums) {
                        if (Object.keys(window.info.library.artists[artistID].albums).length <= 1) {
                            delete window.info.library.artists[artistID];
                            window.PubSub.emit("onArtistDeleted");
                        } else delete window.info.library.artists[artistID].albums[albumID];
                    }
                } else delete window.info.library.albums[albumID].songs[id];
            }

            // Delete artist or just the song inside it
            if (artistID in window.info.library.artists && id in window.info.library.artists[artistID].songs) {
                if (Object.keys(window.info.library.artists[artistID].songs).length <= 1) {
                    delete window.info.library.artists[artistID];
                    window.PubSub.emit("onArtistDeleted");
                } else delete window.info.library.artists[artistID].songs[id];
            }

            this.updatePopups();
            window.PubSub.emit("onSongDeleted");
        }
    };

    //##############################################
    //       REACT CICLE METHODS
    //##############################################

    // Renders the component
    render() {
        const { playbackState, percentage, popups } = this.state;
        const { playing, songID, exists } = playbackState;
        this.updateDeviceType();

        // Get the current song info & Cover
        var cover = null;
        var background = null;
        if (exists && songID && window.info.library.songs && songID in window.info.library.songs) {
            const { name, artistID, image } = window.info.library.songs[songID];
            const artistName = artistID in window.info.library.artists ? window.info.library.artists[artistID].name : "";

            background = image;
            cover = (
                <Cover
                    playing={playing}
                    song={this.prettifyName(name)}
                    albumCover={image}
                    artist={this.prettifyName(artistName)}
                    percentage={percentage}
                />
            );
        }

        // In mobile
        if (window.info.isMobile) {
            // Not logged in
            if (!this.state.loggedIn) {
                return <div className="app_splashscreen" />;
            } else {
                return (
                    <React.Fragment>
                        <Script url="https://sdk.scdn.co/spotify-player.js" onLoad={this.handleSpotifyPlaybackScriptLoad} />
                        <div className="app_background" style={{ backgroundImage: "url(" + background + ")" }} />
                        <div className="app_backgroundBlurred" style={{ backgroundImage: "url(" + background + ")" }} />
                        <div className="app_wrapper">
                            <Library playbackState={playbackState} />
                            <Lyrics playbackState={playbackState} />
                            <Playing playbackState={playbackState} />
                            {cover}
                        </div>

                        <SlideTransition isOpen={popups.playlist !== ""} duration={150} vertical={true} moveTopToBottom={popups.playlist !== ""}>
                            <div className="app_popupWrapper">
                                <Profile
                                    type={"playlist"}
                                    id={popups.playlist}
                                    playbackState={playbackState}
                                    name={popups.playlistName}
                                    image={popups.playlistImage}
                                    songList={popups.playlistSongs}
                                    albumList={[]}
                                />
                            </div>
                        </SlideTransition>

                        <SlideTransition isOpen={popups.artist !== ""} duration={150} vertical={true} moveTopToBottom={popups.artist !== ""}>
                            <div className="app_popupWrapper">
                                <Profile
                                    type={"artist"}
                                    id={popups.artist}
                                    playbackState={playbackState}
                                    name={popups.artistName}
                                    image={popups.artistImage}
                                    songList={popups.artistSongs}
                                    albumList={popups.artistAlbums}
                                />
                            </div>
                        </SlideTransition>

                        <SlideTransition isOpen={popups.album !== ""} duration={150} vertical={true} moveTopToBottom={popups.album !== ""}>
                            <div className="app_popupWrapper">
                                <Profile
                                    type={"album"}
                                    id={popups.album}
                                    playbackState={playbackState}
                                    name={popups.albumName}
                                    image={popups.albumImage}
                                    songList={popups.albumSongs}
                                    albumList={[]}
                                />
                            </div>
                        </SlideTransition>

                        <SlideTransition isOpen={popups.sortBy} duration={150} vertical={true} moveTopToBottom={popups.sortBy}>
                            <div className="app_popupWrapper">
                                <Popup type={"sortBy"} items={popups.sortByItems} callback={popups.sortByCallback} />
                            </div>
                        </SlideTransition>

                        <SlideTransition isOpen={popups.addTo} duration={150} vertical={true} moveTopToBottom={popups.addTo}>
                            <div className="app_popupWrapper">
                                <Popup type={"addTo"} items={popups.addToItems} callback={popups.addToCallback} />
                            </div>
                        </SlideTransition>
                    </React.Fragment>
                );
            }
        }
        return <div className="app_desktop" />;
    }

    // When the component updates
    componentDidUpdate() {
        // If not logged in, go to spotify login page
        if (!this.state.loggedIn) {
            window.location.assign("http://localhost:8888/login");
            console.log("update");
        }
    }

    // When the compnent mounts for the first time
    componentDidMount() {
        // If not logged in, go to spotify login page
        if (!this.state.loggedIn) {
            window.location.assign("http://localhost:8888/login");
            console.log("not logged");
        } else {
            // Set up the refresh token behaviour
            window.refreshTokenInterval = window.setInterval(() => {
                if (Date.now() > window.info.tokenExpireDateTime) {
                    window.clearInterval(window.refreshTokenInterval);
                    this.refreshSpotifyToken();
                }
            }, 2 * 60 * 1000);

            // Get the user library
            this.getUserLibrary(0);

            console.log("logged");
        }
    }

    // Stop listening to events
    componentWillUnmount() {
        window.removeEventListener("resize", () => window.PubSub.emit("onWindowResize"));
        window.PubSub.unsub("onWindowResize", this.handleWindowResize);
        window.PubSub.unsub("onPausePlay", this.handlePausePlay);

        window.PubSub.unsub("onSongSelected", this.handleSongSelected);
        window.PubSub.unsub("onAlbumSelected", this.handleAlbumSelected);
        window.PubSub.unsub("onArtistSelected", this.handleArtistSelected);
        window.PubSub.unsub("onPlaylistSelected", this.handlePlaylistSelected);

        window.PubSub.unsub("onAddToClicked", this.handleAddToClicked);
        window.PubSub.unsub("onSortByClicked", this.handleSortByClicked);
        window.PubSub.unsub("onClosePopup", this.handleClosePopup);
        window.PubSub.unsub("onSongLikeClicked", this.handleSongLikeClicked);
        window.PubSub.unsub("onProfileLikeClicked", this.handleProfileLikeClicked);
    }

    //##############################################
    //       COOKIE HANDLE
    //##############################################

    // Set a cookie
    setCookie = (name, value, cookieDurationInDays) => {
        var d = new Date();
        d.setTime(d.getTime() + cookieDurationInDays * 24 * 60 * 60 * 1000);
        var expires = "expires=" + d.toUTCString();
        document.cookie = name + "=" + value + ";" + expires + ";path=/";
    };

    // Get a cookie
    getCookie = name => {
        var formatedName = name + "=";
        var decodedCookie = decodeURIComponent(document.cookie);
        var splitedCookies = decodedCookie.split(";");
        for (var i = 0; i < splitedCookies.length; i++) {
            var currentCookie = splitedCookies[i];
            while (currentCookie.charAt(0) === " ") {
                currentCookie = currentCookie.substring(1);
            }
            if (currentCookie.indexOf(formatedName) === 0) {
                return currentCookie.substring(formatedName.length, currentCookie.length);
            }
        }
        return "";
    };
}
