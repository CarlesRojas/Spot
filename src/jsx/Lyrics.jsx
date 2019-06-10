import React, { Component } from "react";
import "../css/Lyrics.css";

export default class Lyrics extends Component {
    constructor(props) {
        super(props);

        this.state = {
            lyricsOpen: false,
            lyricsHeight: 0,
            lyricsOpacity: 0
        };

        // Sub to events when this component is mounted
        window.PubSub.sub("onVerticalSwipe", this.handleVerticalSwipe);
    }

    // Handle a change in the swiping cover
    handleVerticalSwipe = ({ normalHeight, smallHeigth, normalTop, miniatureTop, currentSongsTop, currentHeight, currentTop }) => {
        // Function to map a number to another range
        function mapNumber(number, inputMin, inputMax, outputMin, outputMax) {
            return ((number - inputMin) * (outputMax - outputMin)) / (inputMax - inputMin) + outputMin;
        }

        // Hide if the lyrics is not open
        if (currentTop >= miniatureTop || currentTop <= currentSongsTop) {
            this.setState({ lyricsOpen: false, lyricsHeight: 0, lyricsOpacity: 0 });
        }

        // Show if the lyrics is open
        else if (currentTop === normalTop) {
            this.setState({ lyricsOpen: true, lyricsHeight: normalTop, lyricsOpacity: 1 });
        }

        // Fade the lyrics in or out - Coming from below
        else if (currentTop > normalTop) {
            this.setState({ lyricsOpen: true, lyricsHeight: currentTop, lyricsOpacity: mapNumber(currentTop, miniatureTop, normalTop, 0, 1) });
        }

        // Fade the lyrics in or out - Coming from above
        else {
            this.setState({ lyricsOpen: true, lyricsHeight: currentTop, lyricsOpacity: mapNumber(currentTop, currentSongsTop, normalTop, 0, 1) });
        }
    };

    render() {
        //const { playbackState } = this.props;
        const { lyricsOpen, lyricsHeight, lyricsOpacity } = this.state;

        if (lyricsOpen) var display = "inline";
        else display = "none";

        return <div className="lyrics_wrapper" style={{ height: lyricsHeight, opacity: lyricsOpacity, display: display }} />;
    }

    // Unsub from events when this component gets unmounted
    componentWillUnmount() {
        window.PubSub.unsub("onVerticalSwipe", this.handleVerticalSwipe);
    }
}
