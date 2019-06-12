import React, { Component } from "react";
import "../css/ItemAlbum.css";

export default class ItemAlbum extends Component {
    // Handle the click on this item
    handleClick = (id, skeleton) => {
        console.log("Album Selected: " + window.info.library.albums[id].name);
        if (!skeleton) window.PubSub.emit("onAlbumSelected", { id });
    };

    // Renders the component
    render() {
        const { id, height, name, image, selected, skeleton } = this.props;

        // Get width of a single artist: window width - scrollbar width - 1.5 rem of margins - 0.8 * 4 rem of padding devided by 2
        var width = (window.innerWidth - 7 - 1.5 * 16 - 4 * 16 * 0.8) / 2;

        // Skeleton image
        if (skeleton) var cover = <div className="itemAlbum_skeletonCover" />;
        else cover = <img className={"itemAlbum_cover" + (skeleton ? "itemAlbum_skeletonCover" : "")} src={image} onClick={() => this.handleCoverClick()} alt="" style={{ height: width }} />;

        return (
            <div className="itemAlbum_wrapper">
                <button className="itemAlbum_button" onClick={() => this.handleClick(id, skeleton)} style={{ height: height + "px" }}>
                    {cover}
                    <p className={"itemAlbum_name " + (skeleton ? "itemAlbum_skeletonName" : "") + (selected ? " itemAlbum_selectedName" : "")}>{skeleton ? "-" : window.prettifyName(name)}</p>
                </button>
            </div>
        );
    }
}
