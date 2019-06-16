import React, { Component } from "react";
import SongList from "./SongList";
import "../css/Songs.css";

import SortIcon from "../resources/sort.svg";

export default class Songs extends Component {
    constructor(props) {
        super(props);

        this.info = {
            longPressTimeout: null
        };

        this.state = {
            sortRotation: 0,
            order: "dateAdded"
        };
    }

    // Called when the sort icon is clicked
    handleSortClick = () => {
        const { order } = this.state;

        // Is the timeout is still there, then it is a short click
        if (this.info.longPressTimeout) {
            clearTimeout(this.info.longPressTimeout);
            this.info.longPressTimeout = null;

            var items = [
                {
                    name: "Name",
                    callbackName: "name",
                    selected: order === "name" || order === "nameReversed"
                },
                {
                    name: "Date Added",
                    callbackName: "dateAdded",
                    selected: order === "dateAdded" || order === "dateAddedReversed"
                }
            ];

            window.PubSub.emit("onSortBySelected", { items, callback: this.handleSortChange.bind(this) });
        }
    };

    // Called when the sort icon is long pressed
    handleSortLongPress = () => {
        const { sortRotation, order } = this.state;
        clearTimeout(this.info.longPressTimeout);
        this.info.longPressTimeout = null;

        if (order === "name") var newOrder = "nameReversed";
        else if (order === "nameReversed") newOrder = "name";
        else if (order === "dateAdded") newOrder = "dateAddedReversed";
        else if (order === "dateAddedReversed") newOrder = "dateAdded";

        this.setState({
            sortRotation: sortRotation === 0 ? 180 : 0,
            order: newOrder
        });
        window.PubSub.emit("onSongOrderChange", { order: newOrder });
    };

    // Called when a different sort order is selected from the popup
    handleSortChange = order => {
        this.setState({ sortRotation: 0, order });
        window.PubSub.emit("onSongOrderChange", { order });
    };

    // Renders the component
    render() {
        const { playbackState, imageGradient } = this.props;
        const { sortRotation } = this.state;

        const margin = (window.innerWidth / 100) * 5;
        const sortTransform = "rotate( " + sortRotation + "deg)";

        // Prepare song actions
        var actions = {
            left: {
                numberOfActionsAlwaysVisible: 0,
                // Items in normal order (first one is in the left)
                list: [{ event: "onAlbumSelected", type: "album" }, { event: "onArtistSelected", type: "artist" }, { event: "onAddClicked", type: "add" }]
            },
            right: {
                numberOfActionsAlwaysVisible: 0,
                // Items in reverse order (first one is in the right)
                list: [{ event: "onLikeClicked", type: "like" }]
            }
        };

        return (
            <div className="songs_wrapper" style={{ padding: "0 0 " + margin / 2 + "px 0", height: "calc(100% - " + margin / 2 + "px)", backgroundImage: imageGradient }}>
                <p className="songs_title">Liked Songs</p>
                <div className="songs_sortButton" ref={elem => (this.buttonDOM = elem)}>
                    <img className="songs_sortIcon" src={SortIcon} alt="" style={{ transform: sortTransform }} />
                </div>
                <div className="songs_listWrapper">
                    <SongList songList={window.info.library.songs} playbackState={playbackState} actions={actions} order={"dateAdded"} listenToOrderChange={true} />
                </div>
                <button className="songs_shuffle">SHUFFLE</button>
            </div>
        );
    }

    // Called when the component mounts
    componentDidMount() {
        this.buttonDOM.addEventListener("touchstart", () => (this.info.longPressTimeout = setTimeout(() => this.handleSortLongPress(), 500)));
        this.buttonDOM.addEventListener("touchend", () => this.handleSortClick());
    }

    // Called when the component unmounts
    componentWillUnmount() {
        this.buttonDOM.removeEventListener("touchstart", () => (this.info.longPressTimeout = setTimeout(() => this.handleSortLongPress(), 500)));
        this.buttonDOM.removeEventListener("touchend", () => this.handleSortClick());
    }
}
