import React, { Component } from "react";
import "../css/ItemSong.css";

export default class ItemSong extends Component {
    // Handle the click on this item
    handleClick = (id, skeleton) => {
        if (!skeleton) window.PubSub.emit("onSongSelected", { id });
    };

    render() {
        const { id, height, name, album, artist, selected, skeleton } = this.props;

        return (
            <button className="itemSong_item" onClick={() => this.handleClick(id, skeleton)} style={{ height: height + "px" }}>
                <p className={"itemSong_name " + (skeleton ? "itemSong_skeletonName" : "") + (selected ? " itemSong_selectedName" : "")}>{skeleton ? "-" : window.prettifyName(name)}</p>
                <p className={"itemSong_info " + (skeleton ? "itemSong_skeletonInfo" : "")}>{skeleton ? "-" : window.prettifyName(album) + " · " + window.prettifyName(artist)}</p>
            </button>
        );
    }
}
