import React, { Component } from "react";
import "./App.css";

import SpotifyWebApi from "spotify-web-api-js";
const spotifyAPI = new SpotifyWebApi();

export default class App extends Component {
    constructor() {
        super();

        // Get hash parameters (for oauth autentication)
        const params = this.getHashParams();
        const token = params.access_token;

        if (token) spotifyAPI.setAccessToken(token);

        this.state = {
            width: window.innerWidth,
            height: window.innerHeight,
            isPortrait: window.innerWidth <= window.innerHeight,
            loggedIn: token ? true : false,
            nowPlaying: { name: "", albumArt: "" }
        };

        // State of the window
        window.state = {
            isMobile: false,
            isMobileLandscape: false
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
            if (response) this.setState({ nowPlaying: { name: response.item.name, albumArt: response.item.album.images[0].url } });
        });
    };

    render() {
        this.updateDeviceType();

        // In mobile
        if (window.state.isMobile) {
            // Not logged in
            if (!this.state.loggedIn) {
                return (
                    <div className="app_splashscreen">
                        <a ref={elem => (this.loginWithSpotifyButton = elem)} href="http://localhost:8888/login">
                            {" "}
                        </a>
                    </div>
                );
            } else {
                return (
                    <div className="app_wrapper">
                        <div>Now Playing: {this.state.nowPlaying.name}</div>
                        <div>
                            <img src={this.state.nowPlaying.albumArt} alt="" style={{ height: 150 }} />
                        </div>
                        {this.state.loggedIn && <button onClick={() => this.getNowPlaying()}>Check Now Playing</button>}
                    </div>
                );
            }
        }
        return <div className="app_desktop" />;
    }

    // Load files
    componentDidMount() {
        // Not logged in go to spotify login page
        if (!this.state.loggedIn && this.loginWithSpotifyButton) this.loginWithSpotifyButton.click();
    }

    // Stop listening to events
    componentWillUnmount() {
        window.removeEventListener("resize", () => window.PubSub.emit("onWindowResize"));
        window.PubSub.unsub("onWindowResize", this.handleWindowResize);
    }
}
