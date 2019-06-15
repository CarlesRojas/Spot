import React, { Component } from "react";
import Script from "react-load-script";
import "./App.css";
import Cover from "./jsx/Cover";
import Library from "./jsx/Library";
import Lyrics from "./jsx/Lyrics";
import Playing from "./jsx/Playing";
import Profile from "./jsx/Profile";
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
                album: "",
                artist: ""
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
        window.PubSub.sub("onClosePopup", this.handleClosePopup);
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
        window.spotifyAPI.transferMyPlayback([window.info.deviceID], { play: false }).then(
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
                                window.info.progressIntervalID = window.setInterval(this.updateSongProgress.bind(this), window.info.updateProgressInterval);
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
                    this.getArtistsImages(artists, 0, 50);
                }
            },
            err => {
                if (err.status === 401) window.location.assign("http://localhost:8888/login");
                else if (err.status === 404) this.transferPlayer(window.info.deviceID);
                else console.error(err);
            }
        );

        // Get and Save album and artist info
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
    getArtistsImages = (artists, offset, limit) => {
        var curr = artists.slice(offset, offset + limit);

        // Return in there is no more artists to get
        if (curr.length <= 0) {
            window.PubSub.emit("onLibraryLoaded");
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
                this.getArtistsImages(artists, offset + limit, limit);
            },
            err => {
                if (err.status === 401) window.location.assign("http://localhost:8888/login");
                else if (err.status === 404) this.transferPlayer(window.info.deviceID);
                else console.error(err);
            }
        );
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
            response => {
                console.log("Done! ", response);
            },
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
        newPopups.album = id;

        this.setState({ popups: newPopups });
    };

    // Called when the user selects an artist from the library
    handleArtistSelected = ({ id }) => {
        var newPopups = { ...this.state.popups };
        newPopups.artist = id;

        this.setState({ popups: newPopups });
    };

    // Called when the user clicks the back button in a popup. Type: "album", "artist"
    handleClosePopup = ({ type }) => {
        var newPopups = { ...this.state.popups };

        switch (type) {
            case "album":
                newPopups.album = "";
                break;
            case "artist":
            default:
                newPopups.artist = "";
                break;
        }

        this.setState({ popups: newPopups });
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
            cover = <Cover playing={playing} song={this.prettifyName(name)} albumCover={image} artist={this.prettifyName(artistName)} percentage={percentage} />;
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

                        <SlideTransition isOpen={popups.artist !== ""} duration={150} vertical={true} moveTopToBottom={popups.artist !== ""}>
                            <div className="app_popupWrapper">
                                <Profile type={"artist"} id={popups.artist} playbackState={playbackState} />
                            </div>
                        </SlideTransition>

                        <SlideTransition isOpen={popups.album !== ""} duration={150} vertical={true} moveTopToBottom={popups.album !== ""}>
                            <div className="app_popupWrapper">
                                <Profile type={"album"} id={popups.album} playbackState={playbackState} />
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
        window.PubSub.sub("onClosePopup", this.handleClosePopup);
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
