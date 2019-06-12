import React, { Component } from "react";
import "../css/ItemArtist.css";

export default class ItemArtist extends Component {
    // Handle the click on this item
    handleClick = (id, skeleton) => {
        console.log("Artist Selected: " + window.info.library.artists[id].name);
        if (!skeleton) window.PubSub.emit("onArtistSelected", { id });
    };

    // Renders the component
    render() {
        const { id, height, name, image, selected, skeleton } = this.props;

        // Get width of a single artist: window width - scrollbar width - 1.5 rem of margins - 0.8 * 4 rem of padding devided by 2
        var width = (window.innerWidth - 7 - 1.5 * 16 - 4 * 16 * 0.8) / 2;

        // Skeleton image
        if (skeleton) var cover = <div className="itemArtist_skeletonCover" />;
        else cover = <img className={"itemArtist_cover" + (skeleton ? "itemArtist_skeletonCover" : "")} src={image} onClick={() => this.handleCoverClick()} alt="" style={{ height: width }} />;

        return (
            <div className="itemArtist_wrapper">
                <button className="itemArtist_button" onClick={() => this.handleClick(id, skeleton)} style={{ height: height + "px" }}>
                    {cover}
                    <p className={"itemArtist_name " + (skeleton ? "itemArtist_skeletonName" : "") + (selected ? " itemArtist_selectedName" : "")}>{skeleton ? "-" : window.prettifyName(name)}</p>
                </button>
            </div>
        );
    }
}
