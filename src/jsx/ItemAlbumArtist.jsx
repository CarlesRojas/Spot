import React, { Component } from "react";
import "../css/ItemAlbumArtist.css";

export default class ItemAlbumArtist extends Component {
    // Handle the click on this item
    handleClick = (id, skeleton) => {
        const { type } = this.props;
        var event = type === "album" ? "onAlbumSelected" : "onArtistSelected";
        if (!skeleton) window.PubSub.emit(event, { id });
    };

    // Renders the component
    render() {
        const { noName } = this.props;
        const { id, height, width, padding, name, image, selected, skeleton, type } = this.props;

        // Substract padding from the cover size
        var coverSize = "calc(" + width + "px - " + padding * 2 + "px)";

        // Get type variables
        switch (type) {
            case "album":
                var mockImage = "https://i.imgur.com/iajaWIN.png";
                var borderRadius = "0.5rem";
                break;
            case "artist":
            default:
                mockImage = "https://i.imgur.com/PgCafqK.png";
                borderRadius = "50%";
                break;
        }

        // Skeleton image
        if (skeleton) var cover = <div className="itemAlbumArtist_skeletonCover" style={{ height: coverSize, width: coverSize, borderRadius: borderRadius }} />;
        else
            cover = (
                <img
                    className="itemAlbumArtist_cover"
                    src={image}
                    onClick={() => this.handleCoverClick()}
                    alt={mockImage}
                    style={{ height: coverSize, width: coverSize, borderRadius: borderRadius }}
                />
            );

        // Skeleton name
        if (noName) var title = null;
        else if (skeleton) {
            title = (
                <p className={"itemAlbumArtist_skeletonName "} style={{ width: width * 0.5 + "px" }}>
                    {"-"}
                </p>
            );
        } else {
            title = (
                <p className={"itemAlbumArtist_name " + (selected ? " itemAlbumArtist_selectedName" : "")} style={{ width: coverSize, padding: padding / 2 + "px" }}>
                    {window.prettifyName(name)}
                </p>
            );
        }

        return (
            <div className="itemAlbumArtist_wrapper">
                <button
                    className="itemAlbumArtist_button"
                    onClick={() => this.handleClick(id, skeleton)}
                    style={{ height: height + "px", width: width + "px", padding: padding + "px" }}
                >
                    {cover}
                    {title}
                </button>
            </div>
        );
    }
}
