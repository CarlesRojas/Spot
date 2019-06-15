import React, { Component } from "react";
import SongList from "./SongList";
import "../css/Songs.css";

export default class Songs extends Component {
    // Renders the component
    render() {
        const { playbackState, imageGradient } = this.props;

        const margin = (window.innerWidth / 100) * 5;

        return (
            <div className="songs_wrapper" style={{ padding: "0 0 " + margin / 2 + "px 0", height: "calc(100% - " + margin / 2 + "px)", backgroundImage: imageGradient }}>
                <p className="songs_title">Liked Songs</p>
                <button className="songs_shuffle">SHUFFLE</button>
                <div className="songs_listWrapper">
                    <SongList songList={window.info.library.songs} playbackState={playbackState} />
                </div>
            </div>
        );
    }
}
