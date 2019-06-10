import React, { Component } from "react";
import "../css/Playing.css";

export default class Playing extends Component {
    constructor(props) {
        super(props);

        this.state = {
            playingOpen: false,
            playingHeight: 0,
            playingOpacity: 0
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

        // Hide if the playing is not open
        if (currentTop >= normalTop) {
            this.setState({ playingOpen: false, playingHeight: 0, playingOpacity: 0 });
        }

        // Show if the playing is open
        else if (currentTop <= currentSongsTop && currentHeight <= smallHeigth) {
            var height = window.innerHeight - (currentTop + currentHeight);
            this.setState({ playingOpen: true, playingHeight: height, playingOpacity: 1 });
        }

        // Fade the playing in or out
        else {
            height = window.innerHeight - (currentTop + currentHeight);
            var minHeight = currentSongsTop + smallHeigth;
            var maxHeight = window.innerHeight - smallHeigth;
            this.setState({ playingOpen: true, playingHeight: height, playingOpacity: mapNumber(height, minHeight, maxHeight, 0, 1) });
        }
    };

    // Renders the component
    render() {
        //const { playbackState } = this.props;
        const { playingOpen, playingHeight, playingOpacity } = this.state;

        if (playingOpen) var display = "inline";
        else display = "none";

        return <div className="playing_wrapper" style={{ height: playingHeight, opacity: playingOpacity, display: display }} />;
    }

    // Unsub from events when this component gets unmounted
    componentWillUnmount() {
        window.PubSub.unsub("onVerticalSwipe", this.handleVerticalSwipe);
    }
}
