import React, { Component } from "react";
import "../css/Songs.css";

export default class Songs extends Component {
    constructor(props) {
        super(props);

        const { type, playbackState } = props;

        this.state = {
            type: type,
            availableHeight: 0,
            scrollTop: 0,
            rowHeight: 100,
            playbackState: playbackState,
            selectedIndex: null,
            animate: true,
            list: null,
            order: null
        };

        window.PubSub.sub("onLibraryLoaded", this.handleLibraryLoaded);
    }

    handleLibraryLoaded = () => {
        this.getListOrder();
    };

    // Saves a link Order - ID to the state
    getListOrder = () => {};

    render() {
        return <div className="songs_wrapper" />;
    }

    // Stop listening to events
    componentWillUnmount() {
        window.PubSub.unsub("onLibraryLoaded", this.handleLibraryLoaded);
    }
}
