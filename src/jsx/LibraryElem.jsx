import React, { Component } from "react";
import "../css/LibraryElem.css";

export default class LibraryElem extends Component {
    constructor(props) {
        super(props);

        const { type, id } = props;

        this.state = {
            type: type,
            id: id
        };
    }

    // Handle a click on the shuffle button
    handleShuffleClick = () => {
        // CARLES Shuffle
        console.log("Shuffle");
    };

    // Handle a click on the back button
    handleBackClick = () => {
        const { type } = this.state;

        window.PubSub.emit("onClosePopup", { type });
    };

    // Renders the component
    render() {
        const { type, id } = this.state;

        switch (type) {
            case "artist":
                var borderRadius = "50%";
                var image = id in window.info.library.artists ? window.info.library.artists[id].image : "https://i.imgur.com/PgCafqK.png";
                var background = image === "https://i.imgur.com/PgCafqK.png" ? null : image;
                var name = id in window.info.library.artists ? window.info.library.artists[id].name : "Unknown Artist";
                var albums = <div className="artistView_albums" />;
                break;

            case "album":
            default:
                borderRadius = "0.5rem";
                image = id in window.info.library.albums ? window.info.library.albums[id].image : "https://i.imgur.com/iajaWIN.png";
                background = image === "https://i.imgur.com/iajaWIN.png" ? null : image;
                name = id in window.info.library.albums ? window.info.library.albums[id].name : "Unknown Album";
                albums = null;
                break;
        }

        // Get width of a single artist: window width - scrollbar width - 1.5 rem of margins - 0.8 * 4 rem of padding devided by 2
        var width = window.innerWidth / 3;

        return (
            <div className="artistView_wrapper">
                <div className="artistView_background" style={{ backgroundImage: "url(" + background + ")" }} />
                <div className="artistView_backgroundBlurred" style={{ backgroundImage: "url(" + background + ")" }} />
                <div className="artistView_profile">
                    <img className="artistView_image" src={image} alt="" style={{ borderRadius: borderRadius, height: width, width: width }} />
                    <p className="artistView_name">{window.prettifyName(name)}</p>
                </div>
                {albums}
                <div className="artistView_songs" />
                <div className="artistView_controls">
                    <button className="artistView_shuffle" onClick={() => this.handleShuffleClick()}>
                        SHUFFLE
                    </button>
                    <button className="artistView_back" onClick={() => this.handleBackClick()}>
                        Back
                    </button>
                </div>
            </div>
        );
    }
}
