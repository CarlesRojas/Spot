import React, { Component } from "react";
import "./App.css";

import SpotifyWebApi from "spotify-web-api-js";
const spotifyAPI = new SpotifyWebApi();

export default class App extends Component {
    constructor() {
        super();
        this.state = {
            width: window.innerWidth,
            height: window.innerHeight,
            isPortrait: window.innerWidth <= window.innerHeight
        };

        // Loaded data
        window.loadedData = {
            userSettings: {
                listSelected: "",
                sortSelected: "name",
                sortReversed: false
            }
        };

        // State of the window
        window.state = {
            isMobile: false,
            isMobileLandscape: false
        };

        this.updateDeviceType();

        // Subscribe to events
        window.addEventListener("resize", () => window.PubSub.emit("onWindowResize"));
        window.PubSub.sub("onWindowResize", this.handleWindowResize);

        // Get hash parameters (for oauth autentication)
        const params = this.getHashParams();
        const token = params.access_token;

        if (token) spotifyAPI.setAccessToken(token);

        this.state = {
            loggedIn: token ? true : false,
            nowPlaying: { name: "Not Checked", albumArt: "" }
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

    getNowPlaying = () => {
        spotifyAPI.getMyCurrentPlaybackState().then(response => {
            this.setState({
                nowPlaying: {
                    name: response.item.name,
                    albumArt: response.item.album.images[0].url
                }
            });
        });
    };

    render() {
        this.updateDeviceType();

        // In mobile
        if (window.state.isMobile) {
            return (
                <a href="http://localhost:8888">
                    <button>Login With Spotify</button>
                </a>
            );
        }

        // In desktop mode, show the list to the side and sections to the right
        else {
            return (
                <div className="App">
                    <a href="http://localhost:8888/login"> Login to Spotify </a>
                    <div>Now Playing: {this.state.nowPlaying.name}</div>
                    <div>
                        <img src={this.state.nowPlaying.albumArt} style={{ height: 150 }} />
                    </div>
                    {this.state.loggedIn && <button onClick={() => this.getNowPlaying()}>Check Now Playing</button>}
                </div>
            );
        }
    }

    // Load files
    componentDidMount() {}

    // Stop listening to events
    componentWillUnmount() {
        window.removeEventListener("resize", () => window.PubSub.emit("onWindowResize"));
        window.PubSub.unsub("onWindowResize", this.handleWindowResize);
    }
}
