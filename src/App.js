import React, { Component } from "react";
import "./App.css";

import Script from "react-load-script";
import SpotifyWebApi from "spotify-web-api-js";
const spotifyAPI = new SpotifyWebApi();

export default class App extends Component {
    constructor() {
        super();

        // Get hash parameters (for oauth autentication)
        const params = this.getHashParams();

        // State of the window
        window.state = {
            isMobile: false,
            isMobileLandscape: false,
            access_token: params.access_token,
            refresh_token: params.refresh_token,
            token_duration: 1800000, // Milliseconds
            deviceID: null
        };

        if (window.state.access_token) spotifyAPI.setAccessToken(window.state.access_token);

        this.state = {
            width: window.innerWidth,
            height: window.innerHeight,
            isPortrait: window.innerWidth <= window.innerHeight,
            loggedIn: window.state.access_token ? true : false,
            nowPlaying: { name: "", albumArt: "" }
        };

        // Loaded data
        window.loadedData = {
            userSettings: {
                listSelected: "",
                sortSelected: "name",
                sortReversed: false
            }
        };

        // Subscribe to events
        window.addEventListener("resize", () => window.PubSub.emit("onWindowResize"));
        window.PubSub.sub("onWindowResize", this.handleWindowResize);

        // Connects to Spotify Playback & creates a new Player
        window.onSpotifyWebPlaybackSDKReady = () => {
            window.state.player = new window.Spotify.Player({
                name: "Spot",
                getOAuthToken: callback => {
                    callback(window.state.access_token);
                }
            });

            // Error handling
            window.state.player.addListener("initialization_error", ({ message }) => {
                //console.error(message);
            });
            window.state.player.addListener("authentication_error", ({ message }) => {
                //console.error(message);
            });
            window.state.player.addListener("account_error", ({ message }) => {
                //console.error(message);
            });
            window.state.player.addListener("playback_error", ({ message }) => {
                //console.error(message);
            });

            // Playback status updates
            window.state.player.addListener("player_state_changed", state => {
                //console.log(state);
            });

            // Ready
            window.state.player.addListener("ready", ({ device_id }) => {
                window.state.deviceID = device_id;

                // Start playing on Spot
                spotifyAPI.transferMyPlayback([window.state.deviceID], { play: true }).then(
                    response => {
                        console.log("Now Playing on Spot");
                    },
                    function(err) {
                        console.error(err);
                    }
                );
            });

            // Not Ready
            window.state.player.addListener("not_ready", ({ device_id }) => {
                console.log("Device ID has gone offline", device_id);
            });

            // Connect to the player!
            window.state.player.connect();
        };

        // Set the dark mode
        //document.body.classList.add("dark");
    }

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

        window.state.isMobile = isPortrait || isPhone || isTablet;
        window.state.isMobileLandscape = (isPhone || isTablet) && !isPortrait;
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

    // Obtains the current playback state for the user
    getNowPlaying = () => {
        spotifyAPI.getMyCurrentPlaybackState().then(
            response => {
                if (response) this.setState({ nowPlaying: { name: response.item.name, albumArt: response.item.album.images[0].url } });
            },
            function(err) {
                console.error(err);
            }
        );
    };

    // Handles the load of the Spotify Web Playback Script
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
            body: JSON.stringify({ refresh_token: window.state.refresh_token }),
            headers: { "Content-Type": "application/json" }
        })
            .then(res => res.json())
            .then(function(data) {
                window.state.access_token = data.access_token;
                spotifyAPI.setAccessToken(window.state.access_token);
            })
            .catch(error => console.log(error));

        window.setTimeout(() => {
            this.refreshSpotifyToken();
        }, window.state.token_duration);
    };

    // Renders the component
    render() {
        this.updateDeviceType();

        // In mobile
        if (window.state.isMobile) {
            // Not logged in
            if (!this.state.loggedIn) {
                return <div className="app_splashscreen" />;
            } else {
                return (
                    <React.Fragment>
                        <Script url="https://sdk.scdn.co/spotify-player.js" onLoad={this.handleSpotifyPlaybackScriptLoad} />
                        <div className="app_wrapper">
                            <div className="app_image_div">
                                <img className="app_image" src={this.state.nowPlaying.albumArt} alt="" />
                            </div>
                            <div>{this.state.nowPlaying.name}</div>
                            {this.state.loggedIn && <button onClick={() => this.getNowPlaying()}>Check Now Playing</button>}
                        </div>
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
            window.setTimeout(() => {
                this.refreshSpotifyToken();
            }, window.state.token_duration);

            console.log("logged");
        }
    }

    // Stop listening to events
    componentWillUnmount() {
        window.removeEventListener("resize", () => window.PubSub.emit("onWindowResize"));
        window.PubSub.unsub("onWindowResize", this.handleWindowResize);
    }
}
