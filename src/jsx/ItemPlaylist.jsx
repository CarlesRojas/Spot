import React, { Component } from "react";
import "../css/ItemPlaylist.css";

export default class ItemPlaylist extends Component {
    // Handle the click on this item
    handleClick = (id, skeleton) => {
        if (!skeleton) window.PubSub.emit("onPlaylistSelected", { id });
    };

    //##############################################
    //       REACT CICLE METHODS
    //##############################################

    // Renders the component
    render() {
        const { id, height, name, image, selected, skeleton } = this.props;

        const coverSize = "calc(" + height + "px - 1rem)";
        const mockImage = "https://i.imgur.com/06SzS3d.png";

        // Skeleton image
        if (skeleton) var cover = <div className="itemPlaylist_skeletonImage" style={{ height: coverSize, width: coverSize }} />;
        else cover = <img className="itemPlaylist_image" src={image} alt={mockImage} style={{ height: coverSize, width: coverSize }} />;

        return (
            <button className="itemPlaylist_button" onClick={() => this.handleClick(id, skeleton)} style={{ height: height + "px" }}>
                {cover}
                <p className={"itemPlaylist_name " + (skeleton ? "itemPlaylist_skeletonName" : "") + (selected ? " itemPlaylist_selectedName" : "")}>
                    {skeleton ? "-" : window.prettifyName(name)}
                </p>
            </button>
        );
    }
}
