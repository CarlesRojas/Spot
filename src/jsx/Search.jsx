import React, { Component } from "react";
import SongListSortable from "./SongListSortable";
import "../css/Search.css";

export default class Search extends Component {
    constructor(props) {
        super(props);

        // Special case for library song list
        window.PubSub.sub("onLibraryLoaded", this.handleLibraryLoaded);
    }

    // Called when the library finishes loading
    handleLibraryLoaded = () => {
        this.forceUpdate();
    };

    // Renders the component
    render() {
        const { playbackState } = this.props;

        var actions = {
            left: {
                numberOfActionsAlwaysVisible: 0,
                // Items in normal order (first one is in the left)
                list: [
                    { event: "onAlbumSelected", type: "album" },
                    { event: "onArtistSelected", type: "artist" },
                    { event: "onAddToClicked", type: "add" }
                ]
            },
            right: {
                numberOfActionsAlwaysVisible: 1,
                // Items in reverse order (first one is in the right)
                list: [{ event: "onSongLikeClicked", type: "like" }, { event: "onSortClicked", type: "sort" }]
            }
        };

        var songIDs =
            window.info.library.artists && "3WrFJ7ztbogyGnTHbHJFl2" in window.info.library.artists
                ? Object.keys(window.info.library.artists["3WrFJ7ztbogyGnTHbHJFl2"].songs)
                : {};

        var songs = {};
        for (var i = 0; i < songIDs.length; ++i) {
            songs[songIDs[i]] = window.info.library.songs[songIDs[i]];
        }

        return (
            <div className="search_wrapper">
                <SongListSortable songList={songs} playbackState={playbackState} actions={actions} order={"dateAdded"} listenToOrderChange={false} />
            </div>
        );
    }

    // Stop listening to events
    componentWillUnmount() {
        window.PubSub.unsub("onLibraryLoaded", this.handleLibraryLoaded);
    }
}
