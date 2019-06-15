import React, { Component } from "react";
import SongList from "./SongList";
import "../css/Songs.css";

export default class Songs extends Component {
    // Renders the component
    render() {
        const { playbackState, imageGradient } = this.props;

        const margin = (window.innerWidth / 100) * 5;

        // Prepare song actions
        var actions = {
            left: {
                numberOfActionsAlwaysVisible: 0,
                // Items in normal order (first one is in the left)
                list: [{ event: "onAlbumSelected", type: "album" }, { event: "onArtistSelected", type: "artist" }, { event: "onAddClicked", type: "add" }]
            },
            right: {
                numberOfActionsAlwaysVisible: 1,
                // Items in reverse order (first one is in the right)
                list: [{ event: "onLikeClicked", type: "like" }, { event: "onAlbumSelected", type: "album" }]
            }
        };

        return (
            <div className="songs_wrapper" style={{ padding: "0 0 " + margin / 2 + "px 0", height: "calc(100% - " + margin / 2 + "px)", backgroundImage: imageGradient }}>
                <p className="songs_title">Liked Songs</p>
                <div className="songs_listWrapper">
                    <SongList songList={window.info.library.songs} playbackState={playbackState} actions={actions} />
                </div>
                <button className="songs_shuffle">SHUFFLE</button>
            </div>
        );
    }
}
